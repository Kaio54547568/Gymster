import type { DisplayTransaction } from '../domain/packageTransactionMappers';

type PackageTransactionTableProps = {
  getBadgeClass: (status: string) => string;
  onViewReceipt?: (transaction: DisplayTransaction) => void;
  transactions: DisplayTransaction[];
};

export default function PackageTransactionTable({ getBadgeClass, onViewReceipt, transactions }: PackageTransactionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-white/45">
          <tr>
            <th className="py-3">Receipt Code</th>
            <th>Package Name</th>
            <th>Amount</th>
            <th>Payment Date</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.length ? (
            transactions.map((item) => (
              <tr key={item.id} className="border-t border-white/8 text-white">
                <td className="py-3 font-mono text-[#EF233C]">{item.receiptCode || item.id}</td>
                <td>{item.packageName || item.service}</td>
                <td>{item.amount}</td>
                <td>{item.date}</td>
                <td>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${getBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onViewReceipt?.(item)}
                      className="rounded-lg border border-[#EF233C]/30 px-3 py-1.5 text-xs font-bold text-[#EF233C] transition hover:bg-[#EF233C] hover:text-white"
                    >
                      View Receipt
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="border-t border-white/8">
              <td colSpan={6} className="py-8 text-center text-sm font-bold text-white/45">No transactions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
