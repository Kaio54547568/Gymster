import { useState } from 'react';
import { Check, CreditCard, Wallet, Smartphone, Building, Download, Printer, Mail } from 'lucide-react';
import { motion } from 'motion/react';

const packages = [
  { id: 1, name: 'Gói 3 tháng', price: '2,500,000', duration: '3 tháng', features: ['Tập luyện không giới hạn', 'Tủ khóa cá nhân', 'Wifi miễn phí'], popular: false },
  { id: 2, name: 'Gói 6 tháng', price: '4,500,000', duration: '6 tháng', features: ['Tập luyện không giới hạn', 'Tủ khóa cá nhân', 'Wifi miễn phí', 'Free 2 buổi PT'], popular: true },
  { id: 3, name: 'Gói VIP 12 tháng', price: '8,000,000', duration: '12 tháng', features: ['Tập luyện không giới hạn', 'Tủ khóa VIP', 'Wifi miễn phí', 'Free 5 buổi PT', 'Phòng tập riêng'], popular: false },
  { id: 4, name: 'Gói PT Elite', price: '12,000,000', duration: '12 tháng', features: ['Tất cả quyền lợi VIP', '20 buổi PT', 'Lập kế hoạch riêng', 'Tư vấn dinh dưỡng'], popular: false }
];

export default function PackagesPayments() {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [showReceipt, setShowReceipt] = useState(false);

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    setShowPaymentModal(false);
    setShowReceipt(true);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">PACKAGES & PAYMENTS</h1>
        <p className="text-[#A1A1AA]">Quản lý gói tập và thanh toán</p>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileHover={{ scale: 1.05, y: -8 }}
            className={`bg-[#0c1014] border rounded-2xl p-6 relative ${
              pkg.popular ? 'border-[#EF233C] shadow-2xl shadow-[#EF233C]/30' : 'border-[#EF233C]/20'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#EF233C] text-white text-xs font-bold rounded-full">
                PHỔ BIẾN NHẤT
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
              <div className="bebas text-5xl text-[#EF233C] tracking-wider mb-1">{pkg.price}</div>
              <p className="text-[#A1A1AA]">VNĐ / {pkg.duration}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {pkg.features.map((feature, idx) => (
                <li key={`pkg-${pkg.id}-feature-${idx}`} className="flex items-center gap-2 text-white text-sm">
                  <Check className="w-5 h-5 text-[#22C55E]" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPackage(pkg)}
              className="w-full px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold"
            >
              Select Package
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-[#0c1014] border border-[#EF233C]/30 rounded-3xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="bebas text-4xl text-white tracking-wider mb-6">THANH TOÁN</h2>

            <div className="bg-[#050607] border border-[#EF233C]/20 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{selectedPackage.name}</h3>
              <p className="text-[#EF233C] text-3xl font-bold">{selectedPackage.price} VNĐ</p>
            </div>

            <div className="mb-6">
              <h4 className="text-white font-bold mb-4">Select Payment Method</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'cash', name: 'Cash', icon: Wallet },
                  { id: 'bank', name: 'Bank Transfer', icon: Building },
                  { id: 'card', name: 'Credit Card', icon: CreditCard },
                  { id: 'wallet', name: 'E-Wallet', icon: Smartphone }
                ].map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                      paymentMethod === id
                        ? 'bg-[#EF233C] border-[#EF233C] text-white'
                        : 'bg-[#050607] border-[#EF233C]/30 text-[#A1A1AA]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{name}</span>
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'bank' && (
              <div className="bg-[#050607] border border-[#EF233C]/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 bg-white rounded-xl p-2">
                    <div className="w-full h-full bg-[#0c1014] flex items-center justify-center text-xs text-white">QR CODE</div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-white"><span className="text-[#A1A1AA]">Ngân hàng:</span> Vietcombank</p>
                    <p className="text-white"><span className="text-[#A1A1AA]">STK:</span> 0123456789</p>
                    <p className="text-white"><span className="text-[#A1A1AA]">Chủ TK:</span> GYMX FITNESS CENTER</p>
                    <p className="text-white"><span className="text-[#A1A1AA]">Nội dung:</span> THANHTOAN {selectedPackage.id}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handlePayment} className="flex-1 px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold">
                Confirm Payment
              </button>
              <button onClick={() => setShowPaymentModal(false)} className="px-6 py-3 bg-[#050607] text-white rounded-xl hover:bg-[#0c1014] transition-colors font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && selectedPackage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={() => setShowReceipt(false)}>
          <div className="bg-[#0c1014] border border-[#EF233C]/30 rounded-3xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-[#22C55E]" />
              </div>
              <h2 className="bebas text-4xl text-white tracking-wider mb-2">THANH TOÁN THÀNH CÔNG</h2>
              <p className="text-[#A1A1AA]">Mã biên lai: #RC-2024-{Math.floor(Math.random() * 1000)}</p>
            </div>

            <div className="bg-[#050607] border border-[#EF233C]/20 rounded-xl p-6 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Gói tập:</span>
                <span className="text-white font-semibold">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Thời hạn:</span>
                <span className="text-white font-semibold">{selectedPackage.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Số tiền:</span>
                <span className="text-[#EF233C] font-bold text-xl">{selectedPackage.price} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Ngày thanh toán:</span>
                <span className="text-white font-semibold">08/05/2026</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" />
                Print Receipt
              </button>
              <button className="flex-1 px-4 py-3 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-xl hover:bg-[#EF233C]/10 transition-colors font-semibold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button className="px-4 py-3 bg-[#0c1014] border border-[#EF233C]/30 text-white rounded-xl hover:bg-[#EF233C]/10 transition-colors">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
