import React, { useState } from 'react';
import { CreditCard, Wallet, Building } from 'lucide-react';
import { packages, currentPackage } from '../data/mockData';

export const RenewalForm: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState(currentPackage.planCode);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const selectedPkg = packages.find((p) => p.planCode === selectedPackage);
  const totalPrice = selectedPkg ? selectedPkg.price - discount : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentMethod) {
      alert('Vui lòng chọn phương thức thanh toán');
      return;
    }

    alert(`Gia hạn gói tập thành công! Tổng tiền: ${totalPrice.toLocaleString('vi-VN')}đ`);
  };

  const applyPromoCode = () => {
    if (promoCode === 'SAVE10') {
      setDiscount(selectedPkg ? selectedPkg.price * 0.1 : 0);
      alert('Áp dụng mã giảm giá thành công! Giảm 10%');
    } else {
      alert('Mã giảm giá không hợp lệ');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Current Package */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Gói hiện tại</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Tên gói</p>
            <p className="text-white font-medium">{currentPackage.title}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Ngày hết hạn</p>
            <p className="text-white font-medium">{currentPackage.expiryDate}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Số ngày còn lại</p>
            <p className="text-orange-400 font-medium">{currentPackage.daysRemaining} ngày</p>
          </div>
        </div>
      </div>

      {/* Package Selection */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Chọn gói gia hạn</h3>
        <div className="space-y-3">
          {packages.map((pkg) => (
            <label
              key={pkg.planCode}
              className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                selectedPackage === pkg.planCode
                  ? 'border-primary bg-primary/5'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="package"
                  value={pkg.planCode}
                  checked={selectedPackage === pkg.planCode}
                  onChange={(e) => setSelectedPackage(e.target.value)}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <p className="text-white font-medium">{pkg.title}</p>
                  <p className="text-sm text-gray-400">{pkg.duration}</p>
                </div>
              </div>
              <p className="text-xl font-bold text-primary">
                {pkg.price.toLocaleString('vi-VN')}đ
              </p>
            </label>
          ))}
        </div>
      </div>

      {/* Promo Code */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Mã khuyến mãi</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Nhập mã khuyến mãi..."
            className="flex-1 bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={applyPromoCode}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
          >
            Áp dụng
          </button>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Phương thức thanh toán</h3>
        <div className="space-y-3">
          {[
            { value: 'cash', label: 'Tiền mặt', icon: Wallet },
            { value: 'transfer', label: 'Chuyển khoản', icon: Building },
            { value: 'ewallet', label: 'Ví điện tử', icon: CreditCard }
          ].map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.value}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === method.value
                    ? 'border-primary bg-primary/5'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.value}
                  checked={paymentMethod === method.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-primary"
                />
                <Icon className="w-5 h-5 text-gray-400" />
                <span className="text-white font-medium">{method.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Tóm tắt thanh toán</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Giá gói</span>
            <span className="text-white font-medium">
              {selectedPkg?.price.toLocaleString('vi-VN')}đ
            </span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Giảm giá</span>
              <span className="text-green-400 font-medium">
                -{discount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          )}
          <div className="pt-3 border-t border-white/10 flex justify-between">
            <span className="text-white font-bold text-lg">Tổng tiền</span>
            <span className="text-primary font-bold text-2xl">
              {totalPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-lg transition-colors font-medium"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
        >
          Xác nhận gia hạn
        </button>
      </div>
    </form>
  );
};
