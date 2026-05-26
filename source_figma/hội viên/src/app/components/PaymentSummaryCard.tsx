import React from 'react';
import { User, Package, Calendar, CreditCard } from 'lucide-react';

interface PaymentSummaryCardProps {
  transaction: {
    type: string;
    packageName: string;
    packageCode: string;
    duration: string;
    startDate: string;
    endDate: string;
    hasPT: boolean;
    originalAmount: number;
    discount: number;
    total: number;
  };
  member: {
    memberId: string;
    name: string;
    email: string;
    phone: string;
  };
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({ transaction, member }) => {
  return (
    <div className="bg-card border border-white/10 rounded-xl p-6 space-y-6">
      <h3 className="text-xl font-bold text-white">Tóm tắt thanh toán</h3>

      {/* Member Info */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-white">Thông tin hội viên</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Mã hội viên</p>
            <p className="text-white font-medium">{member.memberId}</p>
          </div>
          <div>
            <p className="text-gray-400">Họ tên</p>
            <p className="text-white font-medium">{member.name}</p>
          </div>
          <div>
            <p className="text-gray-400">Email</p>
            <p className="text-white font-medium">{member.email}</p>
          </div>
          <div>
            <p className="text-gray-400">Số điện thoại</p>
            <p className="text-white font-medium">{member.phone}</p>
          </div>
        </div>
      </div>

      {/* Transaction Info */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-white">Thông tin giao dịch</h4>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Loại giao dịch</span>
            <span className="text-white font-medium">{transaction.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gói đã chọn</span>
            <span className="text-white font-medium">{transaction.packageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mã gói</span>
            <span className="text-white font-medium">{transaction.packageCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Thời hạn</span>
            <span className="text-white font-medium">{transaction.duration}</span>
          </div>
          {transaction.hasPT && (
            <div className="flex justify-between">
              <span className="text-gray-400">Huấn luyện viên</span>
              <span className="text-green-400 font-medium">Có PT</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Info */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-white">Thời gian hiệu lực</h4>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Ngày bắt đầu</p>
            <p className="text-white font-medium">{transaction.startDate}</p>
          </div>
          <div>
            <p className="text-gray-400">Ngày hết hạn</p>
            <p className="text-white font-medium">{transaction.endDate}</p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-white">Chi tiết thanh toán</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Giá gói</span>
            <span className="text-white">{transaction.originalAmount.toLocaleString('vi-VN')}đ</span>
          </div>
          {transaction.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Giảm giá</span>
              <span className="text-green-400">-{transaction.discount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}
          <div className="pt-3 border-t border-white/10 flex justify-between items-center">
            <span className="text-white font-bold text-lg">Tổng tiền</span>
            <span className="text-primary font-bold text-2xl">
              {transaction.total.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
