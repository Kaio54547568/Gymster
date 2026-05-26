import React from 'react';
import { X, Printer, Download, Mail, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { gymInfo } from '../data/transactionData';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    transactionId: string;
    receiptId: string;
    date: string;
    time: string;
    type: string;
    packageName: string;
    packageCode: string;
    amount: number;
    originalAmount: number;
    discount: number;
    promoCode?: string;
    paymentMethod: string;
    status: string;
    confirmedBy?: string;
    startDate: string;
    endDate: string;
    notes?: string;
  };
  member: {
    memberId: string;
    name: string;
    email: string;
    phone: string;
  };
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  member
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('Tải PDF biên lai...');
  };

  const handleSendEmail = () => {
    alert(`Biên lai đã được gửi đến ${member.email}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card border border-white/10 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Biên lai thanh toán</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6" id="receipt-content">
          {/* Gym Info */}
          <div className="text-center border-b border-white/10 pb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">{gymInfo.name}</h1>
            <p className="text-gray-400">{gymInfo.address}</p>
            <p className="text-gray-400">
              {gymInfo.phone} | {gymInfo.email}
            </p>
          </div>

          {/* Receipt Info */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-400">Mã biên lai</p>
                <p className="text-xl font-bold text-white">{transaction.receiptId}</p>
              </div>
              <StatusBadge status={transaction.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Mã giao dịch</p>
                <p className="text-white font-medium">{transaction.transactionId}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Ngày thanh toán</p>
                <p className="text-white font-medium">{transaction.date}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Giờ thanh toán</p>
                <p className="text-white font-medium">{transaction.time}</p>
              </div>
            </div>
          </div>

          {/* Member Info */}
          <div>
            <h3 className="text-white font-bold mb-3">Thông tin hội viên</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Mã hội viên</p>
                <p className="text-white font-medium">{member.memberId}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Họ tên</p>
                <p className="text-white font-medium">{member.name}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Email</p>
                <p className="text-white font-medium">{member.email}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Số điện thoại</p>
                <p className="text-white font-medium">{member.phone}</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-white font-bold mb-3">Chi tiết giao dịch</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Loại giao dịch</span>
                <span className="text-white font-medium">{transaction.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tên gói tập</span>
                <span className="text-white font-medium">{transaction.packageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mã gói</span>
                <span className="text-white font-medium">{transaction.packageCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ngày bắt đầu</span>
                <span className="text-white font-medium">{transaction.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ngày hết hạn</span>
                <span className="text-white font-medium">{transaction.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phương thức thanh toán</span>
                <span className="text-white font-medium">{transaction.paymentMethod}</span>
              </div>
              {transaction.confirmedBy && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Nhân viên xác nhận</span>
                  <span className="text-white font-medium">{transaction.confirmedBy}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="text-white font-bold mb-3">Thông tin thanh toán</h3>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Số tiền gốc</span>
                <span className="text-white">{transaction.originalAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              {transaction.discount > 0 && (
                <>
                  {transaction.promoCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mã khuyến mãi</span>
                      <span className="text-green-400 font-mono">{transaction.promoCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tiền giảm giá</span>
                    <span className="text-green-400">-{transaction.discount.toLocaleString('vi-VN')}đ</span>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                <span className="text-white font-bold text-lg">Tổng tiền đã thanh toán</span>
                <span className="text-primary font-bold text-2xl">
                  {transaction.amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Ghi chú</p>
              <p className="text-white">{transaction.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <p className="text-green-400 font-medium">Cảm ơn bạn đã sử dụng dịch vụ!</p>
            </div>
            <p className="text-sm text-gray-400">
              Mọi thắc mắc vui lòng liên hệ: {gymInfo.phone}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-card border-t border-white/10 px-6 py-4 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Printer className="w-5 h-5" />
            <span>In biên lai</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            <span>Tải PDF</span>
          </button>
          <button
            onClick={handleSendEmail}
            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
          >
            <Mail className="w-5 h-5" />
            <span>Gửi Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};
