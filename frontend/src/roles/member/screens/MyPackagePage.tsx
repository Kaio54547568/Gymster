import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, CreditCard, Dumbbell, LoaderCircle, Star, Users, X } from 'lucide-react';
import PackageCard from '../components/PackageCard';
import PackageTransactionTable from '../components/PackageTransactionTable';
import Section from '../components/Section';
import { getTransactionBadgeClass } from '../domain/packageTransactionMappers';
import { useMyPackagePage } from '../hooks/useMyPackagePage';
import { getMemberReceiptDetail } from '../../../services/memberReceiptApi';
import { fetchTrainersFromSupabase } from '../../../services/trainerApi';
import { getTrainerWeeklyAvailability } from '../../../services/trainerAvailabilityApi';
import { completeDemoPayment } from '../../../services/paymentRequestApi';
import { fetchPackageQuote } from '../../../services/packageApi';
export default function MyPackagePage() {
  const [receiptDetail, setReceiptDetail] = useState<any>(null);
  const [receiptMessage, setReceiptMessage] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);

  const {
    displayCurrentPackage,
    filteredPackages,
    getPackageAction,
    hasMoreThan5DaysLeft,
    isLoadingMemberPackage,
    loadMessage,
    packageSearch,
    pendingPackage,
    setPackageSearch,
    selectedPackage,
    setSelectedPackage,
    transactionRows,
    usagePercent,
    refetchData,
  } = useMyPackagePage();

  // Custom checkout states
  const checkoutKeyRef = useRef(`checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [purchasedSessions, setPurchasedSessions] = useState(1);
  const [quoteDetails, setQuoteDetails] = useState<any | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [showPtModal, setShowPtModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutState, setCheckoutState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [message, setMessage] = useState('');
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState('');

  // Fetch trainers on mount
  useEffect(() => {
    fetchTrainersFromSupabase().then(({ data, error }) => {
      if (!error && data) {
        setTrainers(data.filter((item: any) => String(item.status || '').toLowerCase() === 'active'));
      }
    });
  }, []);

  // Fetch trainer availability when trainer changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedTrainer?.id) {
      setAvailability([]);
      return;
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

  const handleSelectPackage = (pkg: any) => {
    if (pendingPackage) {
      setPaymentError('You already have a package waiting for activation. You cannot buy another package yet.');
      return;
    }
    setSelectedPackage(pkg);
    setSelectedTrainer(null);
    setSelectedSlot(null);
    setSelectedSlots([]);
    setPurchasedSessions(pkg?.minPurchaseSessions || 1);
    setQuoteDetails(null);
    setPaymentError('');
    setMessage('');
    checkoutKeyRef.current = `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    if (pkg.hasPersonalTrainer) {
      setShowPtModal(true);
    } else {
      setShowPtModal(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!selectedPackage) return;
    
    if (selectedPackage.packageType !== 'session_based') {
      setQuoteDetails({
        unitPrice: selectedPackage.originalPrice,
        originalPrice: selectedPackage.originalPrice,
        discountPercent: selectedPackage.discountPercent,
        discountAmount: selectedPackage.discountAmount,
        finalAmount: selectedPackage.discountedPrice || selectedPackage.price,
      });
      return;
    }

    setIsQuoting(true);
    fetchPackageQuote({ packageId: selectedPackage.id, purchasedSessions }).then(({ data, error }) => {
      if (!isMounted) return;
      setIsQuoting(false);
      if (!error && data) {
        setQuoteDetails(data);
        setPaymentError('');
      } else {
        setQuoteDetails(null);
        setPaymentError(error?.message || 'Could not fetch package quote.');
      }
    });

    return () => { isMounted = false; };
  }, [selectedPackage, purchasedSessions]);

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
          setMessage('');
        } else {
          setSelectedSlot(null);
          setMessage('Vui lòng chọn 2 buổi tập khác ngày nhau và không liền kề.');
        }
      } else {
        setSelectedSlot(null);
        setMessage('Vui lòng chọn đủ 2 buổi tập.');
      }
    } else {
      setSelectedSlots([newSlot]);
      setSelectedSlot(newSlot);
      setMessage('');
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedPackage) return;
    if (selectedPackage.hasPersonalTrainer && (!selectedTrainer || !selectedSlot)) {
      setPaymentError('Please choose a trainer and a weekly training slot.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutState('processing');
    setPaymentError('');
    const sessionLimit = selectedPackage.sessionLimitValue ?? (selectedPackage.hasPersonalTrainer ? 4 : null);

    try {
      const { data, error } = await completeDemoPayment({
        checkoutKey: checkoutKeyRef.current,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        packageType: selectedPackage.packageType || selectedPackage.type,
        packageDurationMonths: selectedPackage.durationMonths || selectedPackage.packageDurationMonths,
        sessionLimit: selectedPackage.sessionLimitValue ?? selectedPackage.sessionLimit,
        purchasedSessions: selectedPackage.packageType === 'session_based' ? purchasedSessions : undefined,
        trainerId: selectedTrainer?.id || null,
        trainerName: selectedTrainer?.name || '',
        amount: quoteDetails?.finalAmount ?? selectedPackage.price,
        paymentMethod: 'Bank Transfer',
        remainingSessions: selectedPackage.packageType === 'session_based' ? purchasedSessions : sessionLimit,
        selectedSlot,
        selectedSlots,
        selectedSchedule: selectedSlot?.label || '',
      });

      if (error) {
        setCheckoutState('idle');
        setPaymentError(error.message || 'Thanh toán demo không thể hoàn tất.');
        return;
      }

      setCheckoutSuccessMessage(
        data?.memberPackage?.status === 'pending_activation'
          ? `Payment completed. Your new package will start on ${data.memberPackage.start_date || data.memberPackage.startDate}.`
          : 'Payment completed. Your package is now active.',
      );
      setCheckoutState('success');
      window.setTimeout(async () => {
        setCheckoutState('idle');
        setSelectedPackage(null);
        setSelectedTrainer(null);
        setSelectedSlot(null);
        setSelectedSlots([]);
        await refetchData();
      }, 1500);
    } catch (err: any) {
      console.error('[Gymster system] Payment request failed:', err);
      setCheckoutState('idle');
      setPaymentError(err?.message || 'Thanh toán demo không thể hoàn tất.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewReceipt = async (transaction: any) => {
    setReceiptMessage('');
    setReceiptLoading(true);
    try {
      const detail = await getMemberReceiptDetail(transaction.id);
      setReceiptDetail(detail);
    } catch (error: any) {
      setReceiptMessage(error?.message || 'Receipt could not be loaded.');
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">My Package</h1>
      {isLoadingMemberPackage && <div className="rounded-2xl border border-white/8 bg-[#181818] p-4 text-sm font-bold text-white/45">Loading package data...</div>}
      {loadMessage && !isLoadingMemberPackage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{loadMessage}</div>}
      {receiptMessage && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">{receiptMessage}</div>}
      {pendingPackage && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="font-black">Package pending activation</div>
          <div className="mt-1 text-amber-100/75">
            {pendingPackage.packageName || 'Your paid package'} will start on {pendingPackage.startDate || 'the scheduled date'}.
            You cannot buy another package until this package is activated or cancelled.
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Current Package">
          <div className="space-y-5 text-sm text-white/65">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-black text-white">{displayCurrentPackage.title}</div>
                <div className="mt-1 text-xs font-semibold text-white/40">
                  {displayCurrentPackage.hasPackage ? 'Active membership details' : 'Select a package below to request a membership.'}
                </div>
              </div>
              {displayCurrentPackage.hasPackage && (
                <span className="rounded-full bg-[#EF233C]/15 px-3 py-1 text-xs font-black text-[#EF233C] ring-1 ring-[#EF233C]/25">
                  {displayCurrentPackage.status}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Registration date</div>
                <div className="mt-1 font-bold text-white">{displayCurrentPackage.registrationDate}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Expiry date</div>
                <div className="mt-1 font-bold text-white">{displayCurrentPackage.expiryDate}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Remaining days</div>
                <div className="mt-1 font-bold text-white">
                  {displayCurrentPackage.daysRemaining === '-' ? '-' : `${displayCurrentPackage.daysRemaining} days`}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="text-xs text-white/40">Remaining sessions</div>
                <div className="mt-1 font-bold text-white">
                  {displayCurrentPackage.remainingSessions === '-' ? '-' : `${displayCurrentPackage.remainingSessions} sessions`}
                </div>
              </div>
              {displayCurrentPackage.trainer && (
                <div className="rounded-xl bg-white/[0.03] p-3 sm:col-span-2">
                  <div className="text-xs text-white/40">Trainer</div>
                  <div className="mt-1 font-bold text-white">{displayCurrentPackage.trainer}</div>
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs font-bold text-white/45">
                <span>Package usage</span>
                <span>{usagePercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#EF233C]" style={{ width: `${usagePercent}%` }} />
              </div>
              {displayCurrentPackage.hasPackage ? (
                <div className="mt-2 text-xs text-white/45">
                  {displayCurrentPackage.totalSessions > 0
                    ? `${displayCurrentPackage.usedSessions}/${displayCurrentPackage.totalSessions} sessions used`
                    : 'Unlimited gym access'}
                </div>
              ) : (
                <div className="mt-2 text-xs text-white/45">No session usage yet.</div>
              )}
            </div>

            <div className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4">
              <div className="text-xs text-white/45">Price</div>
              <div className="mt-1 text-xl font-black text-[#EF233C]">{displayCurrentPackage.price}</div>
            </div>
          </div>
        </Section>

        <Section title="Transaction History">
          <PackageTransactionTable
            getBadgeClass={getTransactionBadgeClass}
            onViewReceipt={viewReceipt}
            transactions={transactionRows}
          />
        </Section>
      </div>

      <Section title="Buy / Renew / Upgrade">
        <div className="space-y-4">
          <input
            value={packageSearch}
            onChange={(event) => setPackageSearch(event.target.value)}
            placeholder="Search packages..."
            className="w-full max-w-md rounded-xl border border-white/8 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
          />
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredPackages.map((item, index) => {
              const isCurrent = item.title === displayCurrentPackage.title;
              const isSelected = selectedPackage?.title === item.title;

              return (
                <PackageCard
                  key={item.id}
                  actionLabel={getPackageAction(index, item.title)}
                  disabled={Boolean(pendingPackage)}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  item={item}
                  onSelect={handleSelectPackage}
                />
              );
            })}
            {!filteredPackages.length && <div className="col-span-full rounded-xl border border-white/8 bg-[#222] p-4 text-sm text-white/45">No packages match your search.</div>}
          </div>
        </div>
      </Section>

      {selectedPackage && (
        <Section title="Demo Payment Checkout">
          <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
            <div className="rounded-2xl border border-white/8 bg-[#222] p-5">
              <h3 className="text-xl font-black text-white">{selectedPackage.name}</h3>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                {selectedPackage.packageType === 'session_based' && (
                  <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
                    <label className="text-xs font-bold text-white/50">Purchased Sessions</label>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setPurchasedSessions(Math.max(1, purchasedSessions - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded bg-white/10 text-white hover:bg-white/20"
                      >-</button>
                      <span className="font-black text-white min-w-[2rem] text-center">{purchasedSessions}</span>
                      <button 
                        type="button"
                        onClick={() => setPurchasedSessions(Math.min(30, purchasedSessions + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded bg-white/10 text-white hover:bg-white/20"
                      >+</button>
                    </div>
                  </div>
                )}
                {isQuoting ? (
                  <div className="flex justify-between gap-3 animate-pulse"><span>Calculating price...</span></div>
                ) : (
                  <>
                    {quoteDetails?.discountAmount > 0 && (
                      <div className="flex justify-between gap-3 text-white/40 line-through"><span>Original</span><span className="font-bold">{Number(quoteDetails.originalPrice).toLocaleString('vi-VN')} VND</span></div>
                    )}
                    {selectedPackage.discountPercent > 0 && quoteDetails?.discountAmount > 0 && (
                      <div className="flex justify-between gap-3"><span>Promotion</span><span className="font-black text-emerald-300">{selectedPackage.promotion?.title || 'Package discount'} (-{quoteDetails.discountPercent}%)</span></div>
                    )}
                    <div className="flex justify-between gap-3 border-t border-white/8 pt-3"><span>Final amount</span><span className="font-black text-[#EF233C]">{Number(quoteDetails?.finalAmount || selectedPackage.price || 0).toLocaleString('vi-VN')} VND</span></div>
                  </>
                )}
                <div className="flex justify-between gap-3"><span>Trainer</span><span className="font-black text-white">{selectedTrainer?.name || 'Not required'}</span></div>
                <div className="flex justify-between gap-3"><span>Schedule</span><span className="font-black text-white">{selectedSlot?.label || 'Not required'}</span></div>
              </div>
              {hasMoreThan5DaysLeft && (
                <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-xs font-bold text-amber-200">
                  Your new package will start after your current package expires.
                </div>
              )}
              {selectedPackage.hasPersonalTrainer && !selectedTrainer && (
                <div className="mt-4 rounded-xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-3 text-xs font-bold text-[#EF233C]">
                  PT and weekly schedule are required. Please click the button on the package card to select them.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex w-full items-center gap-3 rounded-xl border border-[#EF233C] bg-[#EF233C]/10 px-4 py-3 text-left text-sm font-black text-white">
                <CreditCard className="h-4 w-4 text-[#EF233C]" />
                Demo Payment (Bank Transfer)
              </div>
              <div className="rounded-xl border border-white/8 bg-[#222] p-4 text-sm leading-6 text-white/55">
                The backend recalculates the current promotion when the transaction is created. If you already have an active package, the new package waits without replacing your remaining days.
              </div>
              <button
                type="button"
                disabled={isSubmitting || (selectedPackage.hasPersonalTrainer && (!selectedTrainer || !isScheduleValid))}
                onClick={handleConfirmPayment}
                className="w-full rounded-xl bg-[#EF233C] px-5 py-4 text-sm font-black text-white transition hover:bg-[#c91930] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {isSubmitting ? 'Processing Payment...' : 'Confirm Payment'}
              </button>
              {paymentError && (
                <div className="rounded-xl border border-[#EF233C]/35 bg-[#EF233C]/10 p-4 text-sm font-bold leading-6 text-white" role="alert">
                  {paymentError}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Trainer & Schedule pop-up modal */}
      {showPtModal && selectedPackage?.hasPersonalTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-6 shadow-2xl shadow-[#EF233C]/10">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">Select Trainer & Schedule</h2>
                <p className="mt-1 text-sm text-white/45">
                  Please choose a PT and select your weekly training slots ({sessionsPerWeek} session{sessionsPerWeek > 1 ? 's' : ''} per week).
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPtModal(false);
                  setSelectedPackage(null);
                }}
                className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-white/60 transition hover:border-[#EF233C] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {message && (
              <div className="mb-4 rounded-xl border border-[#EF233C]/25 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">
                {message}
              </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {trainers.map((trainer) => {
                  const isFull = trainer.maxActiveMembers > 0 && trainer.currentActiveMembers >= trainer.maxActiveMembers;
                  return (
                    <button
                      key={trainer.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        setSelectedTrainer(trainer);
                        setSelectedSlot(null);
                        setSelectedSlots([]);
                        setMessage('');
                      }}
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

              <div className="rounded-2xl border border-white/8 bg-[#222] p-4 max-h-[50vh] overflow-y-auto">
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

            <div className="mt-6 flex justify-end gap-3 border-t border-white/8 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPtModal(false);
                  setSelectedPackage(null);
                }}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 font-semibold text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isScheduleValid}
                onClick={() => setShowPtModal(false)}
                className="rounded-xl bg-[#EF233C] px-6 py-3 font-bold text-white transition hover:bg-[#c91930] disabled:bg-white/10 disabled:text-white/35 disabled:cursor-not-allowed"
              >
                Confirm PT & Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {(receiptDetail || receiptLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => !receiptLoading && setReceiptDetail(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#EF233C]/30 bg-[#0c1014] p-6 shadow-2xl shadow-[#EF233C]/10" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white">Receipt / Biên lai</h2>
                <p className="mt-1 font-mono text-sm font-bold text-[#EF233C]">{receiptDetail?.receiptCode || 'Loading...'}</p>
              </div>
              <button onClick={() => setReceiptDetail(null)} disabled={receiptLoading} className="rounded-xl border border-[#EF233C]/30 bg-black/30 p-2 text-white/60 transition hover:border-[#EF233C] hover:text-white disabled:opacity-40">
                <X className="h-5 w-5" />
              </button>
            </div>

            {receiptLoading ? (
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 text-sm font-bold text-white/45">Loading receipt...</div>
            ) : receiptDetail && (
              <div className="space-y-5">
                <ReceiptSection title="Member Information" rows={[
                  ['Họ tên', receiptDetail.member?.fullName],
                  ['Member ID', receiptDetail.member?.memberId],
                  ['Email', receiptDetail.member?.email],
                  ['Số điện thoại', receiptDetail.member?.phone],
                ]} />
                <ReceiptSection title="Package Information" rows={[
                  ['Tên gói tập', receiptDetail.package?.name],
                  ['Loại gói', receiptDetail.package?.type],
                  ['Thời hạn gói', receiptDetail.package?.duration],
                  ['Ngày bắt đầu', receiptDetail.package?.startDateLabel],
                  ['Ngày kết thúc', receiptDetail.package?.endDateLabel],
                  ['PT phụ trách', receiptDetail.package?.trainerName || 'Không có'],
                ]} />
                <ReceiptSection title="Payment Information" rows={[
                  ['Mã giao dịch', receiptDetail.payment?.transactionCode],
                  ['Ngày thanh toán', receiptDetail.payment?.paymentDateLabel],
                  ['Số tiền', receiptDetail.payment?.amountLabel],
                  ['Phương thức thanh toán', receiptDetail.payment?.method],
                  ['Trạng thái thanh toán', receiptDetail.payment?.status],
                ]} />
                <ReceiptSection title="System Information" rows={[
                  ['Mã biên lai', receiptDetail.receiptCode],
                  ['Ngày tạo biên lai', receiptDetail.receiptCreatedLabel],
                ]} />
              </div>
            )}
          </div>
        </div>
      )}

      {checkoutState !== 'idle' && typeof document !== 'undefined' ? createPortal(
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-live="assertive"
        >
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#171717] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.85)]">
            {checkoutState === 'processing' ? (
              <>
                <LoaderCircle className="mx-auto h-16 w-16 animate-spin text-[#EF233C]" />
                <h2 className="mt-6 text-2xl font-black text-white">Đang xử lý thanh toán</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Hệ thống đang kích hoạt gói tập và lịch PT của bạn. Vui lòng không đóng trang.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
                <h2 className="mt-6 text-2xl font-black text-white">Thanh toán thành công</h2>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  {checkoutSuccessMessage}
                </p>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function ReceiptSection({ title, rows }: { title: string; rows: [string, any][] }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-[#EF233C]">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-black/25 p-3">
            <div className="text-xs font-bold text-white/40">{label}</div>
            <div className="mt-1 break-words text-sm font-bold text-white">{value || 'Chưa có dữ liệu'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
