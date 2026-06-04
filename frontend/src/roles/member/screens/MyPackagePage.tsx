import PackageCard from '../components/PackageCard';
import PackageRequestSummary from '../components/PackageRequestSummary';
import PackageTransactionTable from '../components/PackageTransactionTable';
import Section from '../components/Section';
import { getTransactionBadgeClass } from '../domain/packageTransactionMappers';
import { useMyPackagePage } from '../hooks/useMyPackagePage';

export default function MyPackagePage() {
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
  } = useMyPackagePage();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-black text-white">My Package</h1>
      {isLoadingMemberPackage && <div className="rounded-2xl border border-white/8 bg-[#181818] p-4 text-sm font-bold text-white/45">Loading package data...</div>}
      {loadMessage && !isLoadingMemberPackage && <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm font-bold text-amber-300">{loadMessage}</div>}

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
          />
        </Section>
      </div>
    </div>
  );
}
