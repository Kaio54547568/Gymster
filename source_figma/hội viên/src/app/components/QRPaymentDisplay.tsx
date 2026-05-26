import React, { useState } from 'react';
import { Copy, CheckCircle2, QrCode, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRPaymentDisplayProps {
  orderCode: string;
  amount: number;
  bankAccount: {
    bank: string;
    accountName: string;
    accountNumber: string;
  };
  transferContent: string;
  onConfirmPaid: () => void;
  onCancel: () => void;
}

export const QRPaymentDisplay: React.FC<QRPaymentDisplayProps> = ({
  orderCode,
  amount,
  bankAccount,
  transferContent,
  onConfirmPaid,
  onCancel
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* QR Code Section */}
      <div className="bg-card border border-white/10 rounded-xl p-8">
        <h3 className="text-xl font-bold text-white mb-6 text-center">Quét mã QR để thanh toán</h3>

        {/* QR Code Placeholder */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">QR thanh toán mẫu</p>
              <p className="text-xs text-gray-400 mt-1">Quét để chuyển khoản</p>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/50 rounded-lg p-4 text-center">
          <p className="text-primary font-bold text-2xl mb-1">
            {amount.toLocaleString('vi-VN')}đ
          </p>
          <p className="text-xs text-gray-400">Số tiền cần thanh toán</p>
        </div>
      </div>

      {/* Bank Transfer Info Section */}
      <div className="space-y-6">
        <div className="bg-card border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-white">Thông tin chuyển khoản</h3>
          </div>

          <div className="space-y-4">
            {/* Bank */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Ngân hàng</label>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <p className="text-white font-medium">{bankAccount.bank}</p>
              </div>
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Chủ tài khoản</label>
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <p className="text-white font-medium">{bankAccount.accountName}</p>
              </div>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Số tài khoản</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                  <p className="text-white font-medium font-mono">{bankAccount.accountNumber}</p>
                </div>
                <button
                  onClick={() => handleCopy(bankAccount.accountNumber, 'số tài khoản')}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  {copiedField === 'số tài khoản' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Số tiền</label>
              <div className="bg-primary/10 border border-primary/50 rounded-lg px-4 py-3">
                <p className="text-primary font-bold text-lg">{amount.toLocaleString('vi-VN')}đ</p>
              </div>
            </div>

            {/* Transfer Content */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Nội dung chuyển khoản</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-orange-500/10 border border-orange-500/50 rounded-lg px-4 py-3">
                  <p className="text-orange-400 font-medium font-mono">{transferContent}</p>
                </div>
                <button
                  onClick={() => handleCopy(transferContent, 'nội dung chuyển khoản')}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                >
                  {copiedField === 'nội dung chuyển khoản' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ⚠️ Vui lòng nhập chính xác nội dung để hệ thống tự động xác nhận thanh toán
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Hủy giao dịch
          </button>
          <button
            onClick={onConfirmPaid}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Tôi đã chuyển khoản
          </button>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            💡 <strong>Lưu ý:</strong> Sau khi chuyển khoản, vui lòng bấm "Tôi đã chuyển khoản" để gửi yêu cầu xác nhận. Gói tập sẽ được kích hoạt sau khi nhân viên xác nhận thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
};
