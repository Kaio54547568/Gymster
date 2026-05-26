import React from 'react';
import { Eye } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface Transaction {
  transactionId: string;
  date: string;
  type: string;
  packageName: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

interface TransactionHistoryTableProps {
  transactions: Transaction[];
  onViewReceipt: (transactionId: string) => void;
}

export const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({
  transactions,
  onViewReceipt
}) => {
  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Lịch sử giao dịch</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 font-medium py-3 px-4">Mã GD</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Ngày</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Loại GD</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Gói tập</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Số tiền</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">PT thanh toán</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4">Trạng thái</th>
              <th className="text-left text-gray-400 font-medium py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.transactionId}
                className="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4 text-white font-mono text-sm">
                  {transaction.transactionId}
                </td>
                <td className="py-3 px-4 text-white">{transaction.date}</td>
                <td className="py-3 px-4 text-gray-400">{transaction.type}</td>
                <td className="py-3 px-4 text-white font-medium">
                  {transaction.packageName}
                </td>
                <td className="py-3 px-4 text-primary font-bold">
                  {transaction.amount.toLocaleString('vi-VN')}đ
                </td>
                <td className="py-3 px-4 text-gray-400 text-sm">
                  {transaction.paymentMethod}
                </td>
                <td className="py-3 px-4">
                  <StatusBadge status={transaction.status} />
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewReceipt(transaction.transactionId)}
                    className="flex items-center gap-2 px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem biên lai</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Chưa có giao dịch nào</p>
        </div>
      )}
    </div>
  );
};
