import { useState } from 'react';
import { X } from 'lucide-react';
import PackageCard from '../components/PackageCard';
import PackageRequestSummary from '../components/PackageRequestSummary';
import PackageTransactionTable from '../components/PackageTransactionTable';
import Section from '../components/Section';
import { getTransactionBadgeClass } from '../domain/packageTransactionMappers';
import { useMyPackagePage } from '../hooks/useMyPackagePage';
import { downloadMemberReceiptPdf, getMemberReceiptDetail } from '../../../services/memberReceiptApi';

export default function MyPackagePage() {
  const [receiptDetail, setReceiptDetail] = useState<any>(null);
  const [receiptMessage, setReceiptMessage] = useState('');
  const [receiptLoading, setReceiptLoading] = useState(false);
  const {
    canSubmitRequest,
    displayCurrentPackage,
    filteredPackages,
    getPackageAction,
    isLoadingMemberPackage,
    loadMessage,
    packageSearch,
    requestMessage,
    selectedPackage,
    selectedPaymentMethod,
    setPackageSearch,
    setSelectedPackage,
    setSelectedPaymentMethod,
    submitRenewalRequest,
    transactionRows,
    usagePercent,
    hasMoreThan5DaysLeft,
  } = useMyPackagePage();

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

  const downloadReceipt = async (transaction: any) => {
    setReceiptMessage('');
    try {
      await downloadMemberReceiptPdf(transaction.id, transaction.receiptCode);
      setReceiptMessage('Receipt PDF downloaded successfully.');
      window.setTimeout(() => setReceiptMessage(''), 3000);
    } catch (error: any) {
      setReceiptMessage(error?.message || 'Receipt PDF could not be downloaded.');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">My Package</h1>
      {isLoadingMemberPackage && <div className="rounded-2xl border border-white/8 bg-[#181818] p-4 text-sm font-bold text-white/45">Loading package data...</div>}
      {loadMessage && !isLoadingMemberPackage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{loadMessage}</div>}
      {receiptMessage && <div className="rounded-2xl border border-[#EF233C]/20 bg-[#EF233C]/10 p-4 text-sm font-bold text-white">{receiptMessage}</div>}

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
            onDownloadReceipt={downloadReceipt}
            onViewReceipt={viewReceipt}
            transactions={transactionRows}
          />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Section title="Buy / Renew / Upgrade">
          <div className="space-y-3">
            <input
              value={packageSearch}
              onChange={(event) => setPackageSearch(event.target.value)}
              placeholder="Search packages..."
              className="w-full rounded-xl border border-white/8 bg-[#222] px-4 py-3 text-sm font-bold text-white outline-none focus:border-[#EF233C]/50"
            />
            {filteredPackages.map((item, index) => {
              const isCurrent = item.title === displayCurrentPackage.title;
              const isSelected = selectedPackage?.title === item.title;

              return (
                <PackageCard
                  key={item.id}
                  actionLabel={getPackageAction(index, item.title)}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  item={item}
                  onSelect={setSelectedPackage}
                />
              );
            })}
            {!filteredPackages.length && <div className="rounded-xl border border-white/8 bg-[#222] p-4 text-sm text-white/45">No packages match your search.</div>}
          </div>
        </Section>

        <Section title="Request Summary">
          <PackageRequestSummary
            canSubmitRequest={canSubmitRequest}
            requestMessage={requestMessage}
            selectedPackage={selectedPackage}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            submitRenewalRequest={submitRenewalRequest}
            hasMoreThan5DaysLeft={hasMoreThan5DaysLeft}
            daysRemaining={displayCurrentPackage.daysRemaining}
          />
        </Section>
      </div>

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

                <div className="flex justify-end">
                  <button onClick={() => downloadReceipt({ id: receiptDetail.id, receiptCode: receiptDetail.receiptCode })} className="rounded-xl bg-[#EF233C] px-5 py-3 text-sm font-black text-white transition hover:bg-[#990000]">
                    Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
