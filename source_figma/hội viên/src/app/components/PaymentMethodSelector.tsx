import React, { useState } from 'react';
import { Wallet, Building, CreditCard, HandCoins, QrCode } from 'lucide-react';
import { bankInfo } from '../data/transactionData';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  transactionCode?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  transactionCode = 'HV003 GYM6M'
}) => {
  const methods = [
    {
      id: 'cash',
      label: 'Tiền mặt tại quầy',
      icon: HandCoins,
      description: 'Thanh toán trực tiếp tại quầy lễ tân'
    },
    {
      id: 'bank_transfer',
      label: 'Chuyển khoản ngân hàng',
      icon: Building,
      description: 'Chuyển khoản qua ngân hàng'
    },
    {
      id: 'ewallet',
      label: 'Ví điện tử',
      icon: Wallet,
      description: 'Thanh toán qua ví điện tử'
    },
    {
      id: 'card',
      label: 'Thẻ ngân hàng',
      icon: CreditCard,
      description: 'Thanh toán bằng thẻ ATM/Visa/Master'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Chọn phương thức thanh toán</h3>
        <div className="grid grid-cols-2 gap-4">
          {methods.map((method) => {
            const Icon = method.icon;
            return (
              <label
                key={method.id}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={method.id}
                  checked={selectedMethod === method.id}
                  onChange={(e) => onMethodChange(e.target.value)}
                  className="mt-1"
                />
                <Icon className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <p className="text-white font-medium mb-1">{method.label}</p>
                  <p className="text-sm text-gray-400">{method.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Payment Method Details */}
      {selectedMethod === 'cash' && (
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
          <p className="text-blue-400 font-medium mb-2">💡 Hướng dẫn thanh toán</p>
          <p className="text-gray-300 text-sm">
            Vui lòng đến quầy lễ tân để hoàn tất thanh toán. Giao dịch sẽ được xác nhận ngay sau khi thanh toán thành công.
          </p>
        </div>
      )}

      {selectedMethod === 'bank_transfer' && (
        <div className="bg-card border border-white/10 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building className="w-5 h-5 text-primary" />
            <h4 className="font-medium text-white">Thông tin chuyển khoản</h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Ngân hàng</p>
              <p className="text-white font-medium">{bankInfo.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Chi nhánh</p>
              <p className="text-white font-medium">{bankInfo.branch}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Chủ tài khoản</p>
              <p className="text-white font-medium">{bankInfo.accountName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Số tài khoản</p>
              <p className="text-primary font-bold text-lg">{bankInfo.accountNumber}</p>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4">
            <p className="text-orange-400 font-medium mb-2">Nội dung chuyển khoản</p>
            <p className="text-white font-mono text-lg">{transactionCode}</p>
          </div>

          <div className="flex items-center justify-center bg-white p-4 rounded-lg">
            <div className="text-center">
              <QrCode className="w-32 h-32 mx-auto mb-2 text-gray-800" />
              <p className="text-gray-600 text-sm">Quét mã QR để chuyển khoản</p>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              ⏱️ Giao dịch sẽ được xác nhận trong vòng 15-30 phút sau khi chuyển khoản thành công.
            </p>
          </div>
        </div>
      )}

      {selectedMethod === 'ewallet' && (
        <div className="bg-card border border-white/10 rounded-lg p-6 text-center">
          <Wallet className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Thanh toán qua ví điện tử</p>
          <p className="text-gray-400 text-sm mb-6">
            Bạn sẽ được chuyển đến cổng thanh toán ví điện tử để hoàn tất giao dịch
          </p>
          <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg transition-colors font-medium">
            Thanh toán qua ví điện tử
          </button>
        </div>
      )}

      {selectedMethod === 'card' && (
        <div className="bg-card border border-white/10 rounded-lg p-6 text-center">
          <CreditCard className="w-16 h-16 text-primary mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Thanh toán bằng thẻ</p>
          <p className="text-gray-400 text-sm mb-6">
            Bạn sẽ được chuyển đến cổng thanh toán thẻ để hoàn tất giao dịch
          </p>
          <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg transition-colors font-medium">
            Thanh toán bằng thẻ
          </button>
        </div>
      )}
    </div>
  );
};
