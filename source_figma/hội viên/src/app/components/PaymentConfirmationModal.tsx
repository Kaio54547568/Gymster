import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: {
    memberId: string;
    memberName: string;
    type: string;
    packageName: string;
    total: number;
    paymentMethod: string;
    date: string;
  };
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Xác nhận thanh toán</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300">
            Vui lòng kiểm tra kỹ thông tin giao dịch trước khi xác nhận thanh toán:
          </p>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Họ tên</span>
              <span className="text-white font-medium">{transaction.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mã hội viên</span>
              <span className="text-white font-medium">{transaction.memberId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Loại giao dịch</span>
              <span className="text-white font-medium">{transaction.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gói đăng ký</span>
              <span className="text-white font-medium">{transaction.packageName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phương thức</span>
              <span className="text-white font-medium">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Ngày giao dịch</span>
              <span className="text-white font-medium">{transaction.date}</span>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-white font-bold text-lg">Tổng tiền</span>
              <span className="text-primary font-bold text-2xl">
                {transaction.total.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
            <p className="text-orange-400 text-sm">
              ⚠️ Sau khi xác nhận, bạn không thể hủy giao dịch. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Quay lại chỉnh sửa
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};
