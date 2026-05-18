import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

interface PaymentResultProps {
  status: 'success' | 'waiting_confirmation' | 'failed';
  transaction?: {
    transactionId: string;
    packageName: string;
    amount: number;
    paymentMethod: string;
    paymentTime: string;
  };
  onViewReceipt?: () => void;
  onBackToPackages?: () => void;
  onViewHistory?: () => void;
  onRetryPayment?: () => void;
  onChangeMethod?: () => void;
}

export const PaymentResult: React.FC<PaymentResultProps> = ({
  status,
  transaction,
  onViewReceipt,
  onBackToPackages,
  onViewHistory,
  onRetryPayment,
  onChangeMethod
}) => {
  if (status === 'success' && transaction) {
    return (
      <div className="bg-card border border-white/10 rounded-xl p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Thanh toán thành công!</h2>
          <p className="text-gray-400">Gói tập của bạn đã được cập nhật thành công</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Mã giao dịch</span>
              <span className="text-white font-medium font-mono">{transaction.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gói tập</span>
              <span className="text-white font-medium">{transaction.packageName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Số tiền</span>
              <span className="text-primary font-bold">
                {transaction.amount.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phương thức</span>
              <span className="text-white font-medium">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Thời gian</span>
              <span className="text-white font-medium">{transaction.paymentTime}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 max-w-md mx-auto">
          {onBackToPackages && (
            <button
              onClick={onBackToPackages}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Quay về gói tập
            </button>
          )}
          {onViewReceipt && (
            <button
              onClick={onViewReceipt}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Xem biên lai
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'waiting_confirmation') {
    return (
      <div className="bg-card border border-white/10 rounded-xl p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-orange-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Đang chờ xác nhận thanh toán</h2>
          <p className="text-gray-400 mb-4">
            Giao dịch của bạn đang chờ nhân viên xác nhận
          </p>
          <p className="text-gray-400">
            Gói tập sẽ được cập nhật sau khi thanh toán được xác nhận thành công
          </p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-400">
              <p className="font-medium mb-1">Thời gian xác nhận</p>
              <p>
                Nhân viên sẽ xác nhận giao dịch trong vòng 15-30 phút (giờ hành chính) hoặc trong ngày làm việc tiếp theo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 max-w-md mx-auto">
          {onBackToPackages && (
            <button
              onClick={onBackToPackages}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Quay về gói tập
            </button>
          )}
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Xem lịch sử giao dịch
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="bg-card border border-white/10 rounded-xl p-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Thanh toán thất bại</h2>
          <p className="text-gray-400 mb-4">
            Giao dịch chưa được hoàn tất
          </p>
          <p className="text-gray-400">
            Vui lòng thử lại hoặc chọn phương thức thanh toán khác
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 mb-8 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-400">
              <p className="font-medium mb-1">Lý do thất bại</p>
              <p>
                Giao dịch không thể hoàn tất. Vui lòng kiểm tra thông tin thanh toán hoặc liên hệ ngân hàng để biết thêm chi tiết.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 max-w-md mx-auto">
          {onChangeMethod && (
            <button
              onClick={onChangeMethod}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Chọn phương thức khác
            </button>
          )}
          {onRetryPayment && (
            <button
              onClick={onRetryPayment}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Thử lại thanh toán
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
};
