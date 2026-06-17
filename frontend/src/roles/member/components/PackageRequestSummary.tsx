import { CreditCard } from 'lucide-react';
import { paymentMethods } from '../domain/memberConstants';
import type { DisplayPackage } from '../domain/packageTransactionMappers';

type PackageRequestSummaryProps = {
  canSubmitRequest: boolean;
  requestMessage: string;
  selectedPackage: DisplayPackage | null;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  submitRenewalRequest: () => void;
  hasMoreThan5DaysLeft?: boolean;
  daysRemaining?: number | string;
};

export default function PackageRequestSummary({
  canSubmitRequest,
  requestMessage,
  selectedPackage,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  submitRenewalRequest,
  hasMoreThan5DaysLeft = false,
  daysRemaining = 0,
}: PackageRequestSummaryProps) {
  return (
    <div className="space-y-3">
      {paymentMethods.map((method) => (
        <button
          key={method}
          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold text-white transition ${
            selectedPaymentMethod === method ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222] hover:border-[#EF233C]/40'
          }`}
          type="button"
          onClick={() => setSelectedPaymentMethod(method)}
        >
          <CreditCard className="h-4 w-4 text-[#EF233C]" />
          {method}
        </button>
      ))}

      <div className="rounded-xl border border-white/8 bg-[#222] p-4">
        <div className="mb-3 text-sm font-black text-white">Renewal / Upgrade Summary</div>
        <div className="space-y-2 text-sm text-white/60">
          <div className="flex justify-between gap-3"><span>Selected package</span><span className="text-right font-bold text-white">{selectedPackage?.title ?? '-'}</span></div>
          <div className="flex justify-between gap-3"><span>Duration</span><span className="font-bold text-white">{selectedPackage?.duration ?? '-'}</span></div>
          <div className="flex justify-between gap-3"><span>Amount</span><span className="font-bold text-[#EF233C]">{selectedPackage?.price ?? '-'}</span></div>
          <div className="flex justify-between gap-3"><span>Preferred payment method</span><span className="font-bold text-white">{selectedPaymentMethod || '-'}</span></div>
          <div className="flex justify-between gap-3"><span>Request status</span><span className="font-bold text-amber-300">Pending staff approval</span></div>
        </div>
      </div>

      {hasMoreThan5DaysLeft && (
        <div className="rounded-xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-3 text-sm font-bold text-[#EF233C]">
          Gói hiện tại của bạn còn {daysRemaining} ngày. Bạn chỉ được gửi yêu cầu gia hạn / đổi gói khi gói hiện tại còn tối đa 5 ngày.
        </div>
      )}

      <button
        className="w-full rounded-xl bg-[#EF233C] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
        disabled={!canSubmitRequest}
        type="button"
        onClick={submitRenewalRequest}
      >
        Submit Request
      </button>
      {requestMessage && <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">{requestMessage}</div>}
    </div>
  );
}
