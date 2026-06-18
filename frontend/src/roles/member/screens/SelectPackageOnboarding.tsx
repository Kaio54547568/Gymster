import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Dumbbell, Star, Users } from 'lucide-react';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import { createPackagePaymentRequest } from '../../../services/paymentRequestApi';
import { fetchTrainersFromSupabase } from '../../../services/trainerApi';
import { getTrainerWeeklyAvailability } from '../../../services/trainerAvailabilityApi';
import Section from '../components/Section';
import { withTimeout } from '../domain/packageHelpers';

export default function SelectPackageOnboarding({ onMemberActivated }: { onMemberActivated?: (user: any) => void }) {
  const [packages, setPackages] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [step, setStep] = useState<'package' | 'trainer' | 'payment'>('package');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const sessionsPerWeek = selectedPackage?.sessionsPerWeek || 1;
  const isScheduleValid = useMemo(() => {
    if (sessionsPerWeek === 2) {
      if (selectedSlots.length !== 2) return false;
      const dayOfWeekMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };
      const day1 = dayOfWeekMap[selectedSlots[0].dayKey.toLowerCase()];
      const day2 = dayOfWeekMap[selectedSlots[1].dayKey.toLowerCase()];
      if (day1 === undefined || day2 === undefined) return false;
      if (day1 === day2) return false;
      const diff = Math.abs(day1 - day2);
      return diff !== 1 && diff !== 6;
    }
    return selectedSlots.length === 1;
  }, [selectedSlots, sessionsPerWeek]);

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
      setTrainers(trainerResult.error ? [] : trainerResult.data.filter((item: any) => String(item.status || '').toLowerCase() === 'active'));
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
    setSelectedSlots([]);
    setStep(pkg.hasPersonalTrainer ? 'trainer' : 'payment');
    setRequestSubmitted(false);
    setMessage('');
  };

  const chooseTrainer = (trainer: any) => {
    setSelectedTrainer(trainer);
    setSelectedSlot(null);
    setSelectedSlots([]);
    setStep('trainer');
    setMessage('');
  };

  const chooseSlot = (day: any, slot: any) => {
    if (!slot.available) return;
    const newSlot = {
      dayKey: day.key,
      dayLabel: day.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `${day.label}, ${slot.label}`,
    };

    if (sessionsPerWeek === 2) {
      const exists = selectedSlots.some(s => s.dayKey === day.key && s.startTime === slot.startTime);
      let nextSlots;
      if (exists) {
        nextSlots = selectedSlots.filter(s => !(s.dayKey === day.key && s.startTime === slot.startTime));
      } else {
        if (selectedSlots.length < 2) {
          nextSlots = [...selectedSlots, newSlot];
        } else {
          nextSlots = [selectedSlots[1], newSlot];
        }
      }
      setSelectedSlots(nextSlots);
      
      if (nextSlots.length === 2) {
        const dayOfWeekMap: Record<string, number> = {
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
          sunday: 0,
        };
        const day1 = dayOfWeekMap[nextSlots[0].dayKey.toLowerCase()];
        const day2 = dayOfWeekMap[nextSlots[1].dayKey.toLowerCase()];
        const diff = Math.abs(day1 - day2);
        if (day1 !== day2 && diff !== 1 && diff !== 6) {
          setSelectedSlot({
            dayKey: 'multiple',
            dayLabel: 'Multiple',
            startTime: 'multiple',
            endTime: 'multiple',
            label: `${nextSlots[0].label} & ${nextSlots[1].label}`,
          });
          setStep('payment');
          setMessage('');
        } else {
          setSelectedSlot(null);
          setMessage('Vui lÃ²ng chá»n 2 buá»•i táº­p khÃ¡c ngÃ y nhau vÃ  khÃ´ng liá»n ká».');
        }
      } else {
        setSelectedSlot(null);
        setMessage('Vui lÃ²ng chá»n Ä‘á»§ 2 buá»•i táº­p.');
      }
    } else {
      setSelectedSlots([newSlot]);
      setSelectedSlot(newSlot);
      setStep('payment');
      setMessage('');
    }
  };

  const submitPaymentRequest = async () => {
    if (!selectedPackage) return;
    if (selectedPackage.hasPersonalTrainer && (!selectedTrainer || !selectedSlot)) {
      setMessage('Please choose a trainer and a weekly training slot.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    const sessionLimit = selectedPackage.sessionLimitValue ?? (selectedPackage.hasPersonalTrainer ? 4 : null);

    try {
      const { error } = await withTimeout(createPackagePaymentRequest({
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        packageType: selectedPackage.packageType || selectedPackage.type,
        packageDurationMonths: selectedPackage.durationMonths || selectedPackage.packageDurationMonths,
        sessionLimit: selectedPackage.sessionLimitValue ?? selectedPackage.sessionLimit,
        trainerId: selectedTrainer?.id || null,
        trainerName: selectedTrainer?.name || '',
        amount: selectedPackage.price,
        paymentMethod,
        remainingSessions: sessionLimit,
        selectedSlot,
        selectedSlots,
        selectedSchedule: selectedSlot?.label || '',
      }), 10000, 'Payment request timed out.');

      if (error) {
        setMessage(error.message || 'Yêu cầu thanh toán không thể gửi.');
        return;
      }

      setRequestSubmitted(true);
      setMessage('Vui lòng chờ xác nhận thanh toán.');
    } catch (error) {
      console.error('[Gymster system] Payment request failed:', error);
      setMessage(error instanceof Error ? error.message : 'Yêu cầu thanh toán không thể gửi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresTrainer = Boolean(selectedPackage?.hasPersonalTrainer);
  const requiresSchedule = requiresTrainer;
  const canShowPayment = Boolean(
    selectedPackage &&
    (!requiresTrainer || selectedTrainer),
  );
  const canPay = Boolean(
    selectedPackage &&
    paymentMethod &&
    (!requiresTrainer || (selectedTrainer && (!requiresSchedule || (selectedSlot && isScheduleValid)))),
  );
  const paymentDisabledReason = !selectedPackage
    ? 'Please choose a package first.'
    : requiresTrainer && !selectedTrainer
      ? 'Please choose a PT before payment.'
      : requiresSchedule && (!selectedSlot || !isScheduleValid)
        ? sessionsPerWeek === 2
          ? 'Please choose 2 valid weekly training slots before payment.'
          : 'Please choose a weekly training slot before payment.'
        : '';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-black text-white">Select Package</h1>
        <p className="mt-1 text-sm text-white/50">
          Choose a membership package. PT packages require a trainer and the required weekly training slots.
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
          ['Payment', step === 'payment' || canPay, paymentMethod],
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
              {trainers.map((trainer) => {
                const isFull = trainer.maxActiveMembers > 0 && trainer.currentActiveMembers >= trainer.maxActiveMembers;
                return (
                  <button
                    key={trainer.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => chooseTrainer(trainer)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isFull
                        ? 'opacity-40 cursor-not-allowed border-white/5 bg-white/[0.02]'
                        : selectedTrainer?.id === trainer.id
                          ? 'border-[#EF233C] bg-[#EF233C]/10'
                          : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">
                          {trainer.name}
                          {isFull && <span className="ml-2 text-xs font-black text-[#EF233C] uppercase tracking-wider">(Full)</span>}
                        </div>
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
                );
              })}
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
              ) : !availability.length ? (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-6 text-center text-sm font-bold text-amber-200">
                  No weekly slots are available for this PT. Please choose another PT.
                </div>
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
                              sessionsPerWeek === 2
                                ? selectedSlots.some(s => s.dayKey === day.key && s.startTime === slot.startTime)
                                  ? 'border-[#EF233C] bg-[#EF233C] text-white'
                                  : slot.available
                                    ? 'border-white/10 bg-white/5 text-white/70 hover:border-[#EF233C]/45 hover:text-white'
                                    : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-white/20 line-through'
                                : selectedSlot?.dayKey === day.key && selectedSlot?.startTime === slot.startTime
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

      {canShowPayment && (
        <Section title="Payment">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div className="rounded-2xl border border-white/8 bg-[#222] p-5">
              <h3 className="text-xl font-black text-white">{selectedPackage.name}</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <div className="flex justify-between gap-3"><span>Amount</span><span className="font-black text-white">{Number(selectedPackage.price || 0).toLocaleString('vi-VN')} VND</span></div>
                <div className="flex justify-between gap-3"><span>Trainer</span><span className="font-black text-white">{selectedTrainer?.name || 'Not required'}</span></div>
                <div className="flex justify-between gap-3"><span>Schedule</span><span className="font-black text-white">{selectedSlot?.label || 'Not required'}</span></div>
              </div>
              {paymentDisabledReason && (
                <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs font-bold text-amber-200">
                  {paymentDisabledReason}
                </div>
              )}
            </div>

            <div className="space-y-3 lg:sticky lg:top-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('Bank Transfer')}
                className="flex w-full items-center gap-3 rounded-xl border border-[#EF233C] bg-[#EF233C]/10 px-4 py-3 text-left text-sm font-black text-white transition"
              >
                <CreditCard className="h-4 w-4 text-[#EF233C]" />
                Chờ staff xác nhận thanh toán
              </button>
              <div className="rounded-xl border border-white/8 bg-[#222] p-4 text-sm leading-6 text-white/55">
                Chờ staff xác nhận thanh toán. Sau khi staff duyệt, gói tập của bạn sẽ được kích hoạt.
              </div>
              <button
                type="button"
                disabled={!canPay || isSubmitting || requestSubmitted}
                onClick={submitPaymentRequest}
                title={paymentDisabledReason}
                className="w-full rounded-xl bg-[#EF233C] px-5 py-4 text-sm font-black text-white transition hover:bg-[#c91930] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
	                {isSubmitting ? 'Sending request...' : requestSubmitted ? 'Vui lòng chờ xác nhận thanh toán' : 'Gửi yêu cầu xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
