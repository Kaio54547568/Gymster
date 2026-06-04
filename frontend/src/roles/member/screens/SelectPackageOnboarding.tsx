import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Dumbbell, Star, Users } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../../../services/authService';
import { createMemberPackage, updateMemberPackageStatus } from '../../../services/memberPackageApi';
import { createNotification } from '../../../services/notificationApi';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import { createPayment } from '../../../services/paymentApi';
import { fetchTrainersFromSupabase } from '../../../services/trainerApi';
import { getTrainerWeeklyAvailability } from '../../../services/trainerAvailabilityApi';
import { activateMemberAccount } from '../../../services/userApi';
import { createWorkoutSessionsForSchedule } from '../../../services/workoutSessionApi';
import Section from '../components/Section';
import { addMonths, getPackageDurationMonths, toDateInputValue, withTimeout } from '../domain/packageHelpers';

export default function SelectPackageOnboarding({ onMemberActivated }: { onMemberActivated?: (user: any) => void }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [packages, setPackages] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [step, setStep] = useState<'package' | 'trainer' | 'payment'>('package');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadOptions() {
      setIsLoading(true);
      const [packageResult, trainerResult] = await Promise.all([
        fetchPackagesFromSupabase(),
        fetchTrainersFromSupabase(),
      ]);

      if (!isMounted) return;

      setPackages(packageResult.error ? [] : packageResult.data.filter((item: any) => item.isActive !== false));
      setTrainers(trainerResult.error ? [] : trainerResult.data.filter((item: any) => item.status === 'active'));
      setMessage(packageResult.error || trainerResult.error ? 'Some package or trainer data could not be loaded.' : '');
      setIsLoading(false);
    }

    loadOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!selectedTrainer?.id) {
      setAvailability([]);
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingAvailability(true);
    getTrainerWeeklyAvailability(selectedTrainer.id).then(({ data }) => {
      if (!isMounted) return;
      setAvailability(data);
      setIsLoadingAvailability(false);
    }).catch(() => {
      if (!isMounted) return;
      setAvailability([]);
      setIsLoadingAvailability(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTrainer?.id]);

  const choosePackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setSelectedTrainer(null);
    setSelectedSlot(null);
    setStep(pkg.hasPersonalTrainer ? 'trainer' : 'payment');
    setMessage('');
  };

  const chooseTrainer = (trainer: any) => {
    setSelectedTrainer(trainer);
    setSelectedSlot(null);
    setMessage('');
  };

  const chooseSlot = (day: any, slot: any) => {
    if (!slot.available) return;
    setSelectedSlot({
      dayKey: day.key,
      dayLabel: day.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `${day.label}, ${slot.label}`,
    });
    setStep('payment');
    setMessage('');
  };

  const completePayment = async () => {
    if (!selectedPackage) return;
    if (selectedPackage.hasPersonalTrainer && (!selectedTrainer || !selectedSlot)) {
      setMessage('Please choose a trainer and a weekly training slot.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const activeUser = {
      ...currentUser,
      role: currentUser?.role || 'member',
      accountStatus: 'Active',
      account_status: 'active',
    };
    const flowData = {
      currentUser,
      selectedPackage,
      selectedTrainer,
      selectedSlot,
      paymentMethod,
      sessionLimit: selectedPackage.sessionLimitValue ?? (selectedPackage.hasPersonalTrainer ? 4 : null),
    };

    setCurrentUser(activeUser);
    onMemberActivated?.(activeUser);
    setIsSubmitting(false);
    navigate('/member', { replace: true });

    void (async () => {
      try {
        await withTimeout(activateMemberAccount(flowData.currentUser), 10000, 'Account activation timed out.');

        const createdPackage = await withTimeout(createMemberPackage({
          memberId: flowData.currentUser?.memberId || flowData.currentUser?.member_id,
          memberEmail: flowData.currentUser?.email || '',
          packageId: flowData.selectedPackage.id,
          trainerId: flowData.selectedTrainer?.id || null,
          status: 'pending_payment',
          remainingSessions: flowData.sessionLimit,
        }), 10000, 'Package registration timed out.');

        if (createdPackage.error || !createdPackage.data?.memberPackageId) {
          console.error('[Gymster hệ thống] Demo package registration could not be saved:', createdPackage.error);
          return;
        }

        const transactionCode = `GYMSTER-DEMO-${Date.now()}`;
        const paymentDate = new Date().toISOString();
        const paymentResult = await withTimeout(createPayment({
          memberId: flowData.currentUser?.memberId || flowData.currentUser?.member_id,
          memberEmail: flowData.currentUser?.email || '',
          packageId: flowData.selectedPackage.id,
          memberPackageId: createdPackage.data.memberPackageId,
          amount: flowData.selectedPackage.price,
          paymentMethod: flowData.paymentMethod,
          paymentDate,
          transactionCode,
          transferContent: `GYMSTER DEMO ${flowData.selectedPackage.code || flowData.selectedPackage.id}`,
        }), 10000, 'Payment save timed out.');

        if (paymentResult.error) {
          console.error('[Gymster hệ thống] Demo payment could not be saved:', paymentResult.error);
          return;
        }

        const startDate = toDateInputValue(new Date(paymentDate));
        const endDate = toDateInputValue(addMonths(new Date(paymentDate), getPackageDurationMonths(flowData.selectedPackage)));
        const packageUpdate = await withTimeout(updateMemberPackageStatus(createdPackage.data.memberPackageId, 'active', {
          start_date: startDate,
          end_date: endDate,
          remaining_sessions: flowData.sessionLimit,
          used_sessions: 0,
          activated_at: paymentDate,
        }), 10000, 'Package activation timed out.');

        if (packageUpdate.error) {
          console.error('[Gymster hệ thống] Demo member package could not be activated:', packageUpdate.error);
          return;
        }

        if (flowData.selectedPackage.hasPersonalTrainer && flowData.selectedTrainer && flowData.selectedSlot) {
          await withTimeout(createWorkoutSessionsForSchedule({
            memberId: flowData.currentUser?.memberId || flowData.currentUser?.member_id,
            memberEmail: flowData.currentUser?.email || '',
            trainerId: flowData.selectedTrainer.id,
            packageId: flowData.selectedPackage.id,
            memberPackageId: createdPackage.data.memberPackageId,
            selectedSchedule: flowData.selectedSlot.label,
            startDate,
            endDate,
          }), 8000, 'Workout session creation timed out.');

          await createNotification({
            notificationType: 'system',
            title: 'Your trainer information',
            message: [
              `PT: ${flowData.selectedTrainer.name}`,
              flowData.selectedTrainer.specialty ? `Specialty: ${flowData.selectedTrainer.specialty}` : '',
              flowData.selectedTrainer.rating ? `Rating: ${flowData.selectedTrainer.rating}/5` : '',
              flowData.selectedSlot.label ? `Schedule: ${flowData.selectedSlot.label}` : '',
            ].filter(Boolean).join(' | '),
          });
        }
      } catch (error) {
        console.error('[Gymster hệ thống] Demo payment background sync failed:', error);
      }
    })();

  };

  const canPay = Boolean(
    selectedPackage &&
    paymentMethod &&
    (!selectedPackage.hasPersonalTrainer || (selectedTrainer && selectedSlot)),
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Select Package</h1>
        <p className="mt-1 text-sm text-white/50">
          Choose a membership package. PT packages require a trainer and one available weekly training slot.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Package', step === 'package' || selectedPackage, selectedPackage?.name || 'Choose package'],
          ['Trainer & Schedule', !selectedPackage?.hasPersonalTrainer || step === 'trainer' || selectedTrainer, selectedPackage?.hasPersonalTrainer ? selectedTrainer?.name || 'Choose trainer' : 'Not required'],
          ['Payment', step === 'payment', paymentMethod],
        ].map(([label, active, value]) => (
          <div key={label as string} className={`rounded-2xl border p-4 ${active ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#181818]'}`}>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-white/35">{label}</div>
            <div className="mt-2 text-sm font-black text-white">{value as string}</div>
          </div>
        ))}
      </div>

      <Section title="Available Packages">
        {isLoading ? (
          <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">Loading packages...</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => choosePackage(pkg)}
                className={`rounded-2xl border p-5 text-left transition ${
                  selectedPackage?.id === pkg.id ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EF233C]/15 text-[#EF233C]">
                    {pkg.hasPersonalTrainer ? <Users className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">{pkg.type}</span>
                </div>
                <h2 className="text-xl font-black text-white">{pkg.name}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-white/55">{pkg.description || 'Membership package'}</p>
                <div className="mt-4 grid gap-2 text-sm text-white/65">
                  <div>Duration: <span className="font-bold text-white">{pkg.duration}</span></div>
                  <div>Sessions: <span className="font-bold text-white">{pkg.sessionLimit}</span></div>
                  <div>Trainer: <span className="font-bold text-white">{pkg.hasPersonalTrainer ? 'Required' : 'Optional later'}</span></div>
                </div>
                <div className="mt-5 text-2xl font-black text-[#EF233C]">{Number(pkg.price || 0).toLocaleString('vi-VN')} VND</div>
              </button>
            ))}
            {!packages.length && <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">No active packages found.</div>}
          </div>
        )}
      </Section>

      {selectedPackage?.hasPersonalTrainer && (
        <Section title="Choose PT and Weekly Schedule">
          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <button
                  key={trainer.id}
                  type="button"
                  onClick={() => chooseTrainer(trainer)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedTrainer?.id === trainer.id ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white">{trainer.name}</div>
                      <div className="mt-1 text-sm font-semibold text-white/45">{trainer.specialty}</div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-[#EF233C]/15 px-3 py-1 text-xs font-black text-[#EF233C]">
                      <Star className="h-3.5 w-3.5 fill-current" /> {trainer.rating || 'New'}
                    </span>
                  </div>
                  <div className="mt-3 text-xs font-bold text-white/40">
                    Active members {trainer.currentActiveMembers}/{trainer.maxActiveMembers || '-'}
                  </div>
                </button>
              ))}
              {!trainers.length && <div className="rounded-xl border border-white/8 bg-[#222] p-5 text-sm font-bold text-white/45">No active trainers found.</div>}
            </div>

            <div className="rounded-2xl border border-white/8 bg-[#222] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-white">Weekly available slots</h3>
                  <p className="mt-1 text-xs font-semibold text-white/45">Booked slots are hidden from selection.</p>
                </div>
                {selectedSlot && <span className="rounded-full bg-[#EF233C]/15 px-3 py-1 text-xs font-black text-[#EF233C]">{selectedSlot.label}</span>}
              </div>

              {!selectedTrainer ? (
                <div className="rounded-xl border border-white/8 bg-black/20 p-6 text-center text-sm font-bold text-white/45">Choose a PT to see available slots.</div>
              ) : isLoadingAvailability ? (
                <div className="rounded-xl border border-white/8 bg-black/20 p-6 text-center text-sm font-bold text-white/45">Loading PT schedule...</div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-7">
                  {availability.map((day) => (
                    <div key={day.key} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="mb-3 text-center text-sm font-black text-white">{day.shortLabel}</div>
                      <div className="grid gap-2">
                        {day.slots.map((slot: any) => (
                          <button
                            key={`${day.key}-${slot.label}`}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => chooseSlot(day, slot)}
                            className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                              selectedSlot?.dayKey === day.key && selectedSlot?.startTime === slot.startTime
                                ? 'border-[#EF233C] bg-[#EF233C] text-white'
                                : slot.available
                                  ? 'border-white/10 bg-white/5 text-white/70 hover:border-[#EF233C]/45 hover:text-white'
                                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-white/20 line-through'
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {selectedPackage && (!selectedPackage.hasPersonalTrainer || selectedSlot) && (
        <Section title="Payment">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div className="rounded-2xl border border-white/8 bg-[#222] p-5">
              <h3 className="text-xl font-black text-white">{selectedPackage.name}</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <div className="flex justify-between gap-3"><span>Amount</span><span className="font-black text-white">{Number(selectedPackage.price || 0).toLocaleString('vi-VN')} VND</span></div>
                <div className="flex justify-between gap-3"><span>Trainer</span><span className="font-black text-white">{selectedTrainer?.name || 'Not required'}</span></div>
                <div className="flex justify-between gap-3"><span>Schedule</span><span className="font-black text-white">{selectedSlot?.label || 'Not required'}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('Bank Transfer')}
                className="flex w-full items-center gap-3 rounded-xl border border-[#EF233C] bg-[#EF233C]/10 px-4 py-3 text-left text-sm font-black text-white transition"
              >
                <CreditCard className="h-4 w-4 text-[#EF233C]" />
                Bank Transfer
              </button>
              <div className="rounded-xl border border-white/8 bg-[#222] p-4 text-sm leading-6 text-white/55">
                Bank transfer QR payment will be connected later. Use demo skip to activate this member package while testing.
              </div>
              <button
                type="button"
                disabled={!canPay || isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white/35 disabled:cursor-not-allowed"
              >
                Continue to Bank Transfer (Coming Soon)
              </button>
              <button
                type="button"
                disabled={!canPay || isSubmitting}
                onClick={completePayment}
                className="w-full rounded-xl bg-[#EF233C] px-5 py-4 text-sm font-black text-white transition hover:bg-[#c91930] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {isSubmitting ? 'Activating...' : 'Skip payment (demo)'}
              </button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
