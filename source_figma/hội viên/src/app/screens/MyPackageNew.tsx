import React, { useState } from 'react';
import { MemberHeader } from '../components/MemberHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressCircle } from '../components/ProgressCircle';
import { EmptyState } from '../components/EmptyState';
import { PackageCard } from '../components/PackageCard';
import { PaymentSummaryCard } from '../components/PaymentSummaryCard';
import { PromoCodeInput } from '../components/PromoCodeInput';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentStepper } from '../components/PaymentStepper';
import { QRPaymentDisplay } from '../components/QRPaymentDisplay';
import { PaymentResult } from '../components/PaymentResult';
import { ReceiptModal } from '../components/ReceiptModal';
import { TransactionHistoryTable } from '../components/TransactionHistoryTable';
import { CheckCircle2, Calendar, Clock, Package as PackageIcon, AlertCircle } from 'lucide-react';
import { currentPackage, packages, currentMember } from '../data/mockData';
import { transactions } from '../data/transactionData';
import { toast } from 'sonner';

type Tab = 'current' | 'buy' | 'renew' | 'payment' | 'history';
type PaymentStep = 'order_summary' | 'payment_qr' | 'payment_result' | 'receipt';
type PaymentStatus = 'pending_payment' | 'waiting_confirmation' | 'success' | 'failed' | 'cancelled';

export const MyPackageNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('current');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('order_summary');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending_payment');
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);

  const hasActivePackage = currentPackage.status === 'Đang hoạt động';

  const handleBuyPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setPaymentStep('order_summary');
    setPaymentStatus('pending_payment');
    setActiveTab('payment');
  };

  const handleApplyPromo = (code: string, discountPercent: number) => {
    setPromoCode(code);
    if (selectedPackage) {
      setDiscount(selectedPackage.price * discountPercent);
    }
  };

  const handleConfirmPurchase = () => {
    if (!paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán');
      return;
    }

    // Create pending transaction
    const orderCode = `DH${Date.now()}`;
    const newTransaction = {
      transactionId: `GD${Date.now()}`,
      orderCode: orderCode,
      packageName: selectedPackage.title,
      packageCode: selectedPackage.planCode,
      amount: selectedPackage.price - discount,
      originalAmount: selectedPackage.price,
      discount: discount,
      promoCode: promoCode,
      paymentMethod: paymentMethod,
      status: 'Đang chờ thanh toán',
      date: new Date().toLocaleDateString('vi-VN'),
      time: new Date().toLocaleTimeString('vi-VN')
    };

    setCurrentTransaction(newTransaction);
    setPaymentStatus('pending_payment');
    setPaymentStep('payment_qr');
    toast.success('Đơn hàng đã được tạo. Vui lòng thanh toán để hoàn tất.');
  };

  const handleUserPaid = () => {
    setPaymentStatus('waiting_confirmation');
    setPaymentStep('payment_result');
    toast.info('Yêu cầu xác nhận thanh toán đã được gửi');
  };

  const handleSimulatePaymentSuccess = () => {
    setPaymentStatus('success');
    if (currentTransaction) {
      const successTransaction = {
        ...currentTransaction,
        status: 'Thành công',
        paymentTime: new Date().toLocaleString('vi-VN')
      };
      setSelectedTransaction(successTransaction);
    }
    setPaymentStep('payment_result');
    toast.success('Thanh toán thành công!');
  };

  const handleCancelTransaction = () => {
    setPaymentStatus('cancelled');
    setPaymentStep('order_summary');
    setSelectedPackage(null);
    setActiveTab('buy');
    toast.info('Đã hủy giao dịch');
  };

  const handleViewReceipt = (transactionId?: string) => {
    if (transactionId) {
      const transaction = transactions.find((t) => t.transactionId === transactionId);
      if (transaction) {
        setSelectedTransaction(transaction);
        setShowReceiptModal(true);
      }
    } else if (selectedTransaction) {
      setShowReceiptModal(true);
      setPaymentStep('receipt');
    }
  };

  const handleRetryPayment = () => {
    setPaymentStep('order_summary');
    setPaymentStatus('pending_payment');
  };

  const handleChangeMethod = () => {
    setPaymentMethod('');
    setPaymentStep('order_summary');
    setPaymentStatus('pending_payment');
  };

  const tabs = [
    { id: 'current' as Tab, label: 'Gói hiện tại' },
    { id: 'buy' as Tab, label: 'Mua gói mới' },
    { id: 'renew' as Tab, label: 'Gia hạn / Chuyển gói' },
    ...(selectedPackage ? [{ id: 'payment' as Tab, label: 'Thanh toán' }] : []),
    { id: 'history' as Tab, label: 'Lịch sử giao dịch' }
  ];

  const paymentTransaction = selectedPackage
    ? {
        type: 'Mua gói mới',
        packageName: selectedPackage.title,
        packageCode: selectedPackage.planCode,
        duration: selectedPackage.duration,
        startDate: '15/05/2026',
        endDate: '15/11/2026',
        hasPT: selectedPackage.hasPT || false,
        originalAmount: selectedPackage.price,
        discount: discount,
        total: selectedPackage.price - discount
      }
    : null;

  return (
    <>
      <MemberHeader title="Gói tập của tôi" subtitle="Quản lý gói tập và thanh toán" />

      <div className="p-8">
        {/* Tabs */}
        <div className="bg-card border border-white/10 rounded-xl mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-primary text-white bg-white/5'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Current Package Tab */}
          {activeTab === 'current' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {hasActivePackage ? (
                <>
                  <div className="bg-card border border-white/10 rounded-xl p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <PackageIcon className="w-8 h-8 text-primary" />
                          <h2 className="text-3xl font-bold text-white">{currentPackage.title}</h2>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <StatusBadge status={currentPackage.status} />
                          <span className="text-gray-400">Mã gói: {currentPackage.planCode}</span>
                        </div>
                        <p className="text-gray-400">Loại gói: {currentPackage.type}</p>
                      </div>

                      <ProgressCircle
                        value={currentPackage.usedSessions}
                        max={currentPackage.totalSessions}
                        size={140}
                        strokeWidth={10}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-6 mb-6">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <p className="text-xs text-gray-400">Ngày đăng ký</p>
                        </div>
                        <p className="text-white font-bold">{currentPackage.registrationDate}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-orange-400" />
                          <p className="text-xs text-gray-400">Ngày hết hạn</p>
                        </div>
                        <p className="text-white font-bold">{currentPackage.expiryDate}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          <p className="text-xs text-gray-400">Số buổi còn lại</p>
                        </div>
                        <p className="text-green-400 font-bold text-xl">
                          {currentPackage.remainingSessions}
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <p className="text-xs text-gray-400">Giá gói</p>
                        </div>
                        <p className="text-white font-bold">
                          {currentPackage.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                    </div>

                    {currentPackage.daysRemaining <= 30 && (
                      <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-4 mb-6">
                        <p className="text-orange-400 font-medium">
                          ⚠️ Gói tập của bạn còn {currentPackage.daysRemaining} ngày. Hãy gia hạn để không bị gián đoạn luyện tập.
                        </p>
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Tiến độ sử dụng</span>
                        <span className="text-sm text-white font-medium">
                          {currentPackage.usedSessions}/{currentPackage.totalSessions} buổi
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-primary h-3 rounded-full transition-all"
                          style={{
                            width: `${
                              (currentPackage.usedSessions / currentPackage.totalSessions) * 100
                            }%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveTab('renew')}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        Gia hạn ngay
                      </button>
                      <button
                        onClick={() => setActiveTab('buy')}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-primary text-primary px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        Mua gói mới
                      </button>
                      <button
                        onClick={() => setActiveTab('renew')}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                      >
                        Chuyển / nâng cấp gói
                      </button>
                    </div>
                  </div>

                  <div className="bg-card border border-white/10 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Quyền lợi gói tập</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {currentPackage.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  message="Bạn hiện không có gói tập nào đang hoạt động"
                  action={{
                    label: 'Đăng ký gói mới',
                    onClick: () => setActiveTab('buy')
                  }}
                />
              )}
            </div>
          )}

          {/* Buy Package Tab */}
          {activeTab === 'buy' && (
            <div>
              <div className="mb-6 flex gap-3">
                {[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'gym', label: 'Gym' },
                  { value: 'yoga', label: 'Yoga' },
                  { value: 'pt', label: 'Có PT' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.planCode}
                    package={pkg}
                    onClick={() => handleBuyPackage(pkg)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Renew/Change Tab */}
          {activeTab === 'renew' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-card border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Gói hiện tại</h3>
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

              <div className="bg-card border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-6">Lựa chọn của bạn</h3>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 hover:border-primary cursor-pointer transition-all">
                    <input type="radio" name="action" className="w-4 h-4" />
                    <div>
                      <p className="text-white font-medium">Gia hạn gói hiện tại</p>
                      <p className="text-sm text-gray-400">Gia hạn thêm {currentPackage.duration} với giá {currentPackage.price.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 hover:border-primary cursor-pointer transition-all">
                    <input type="radio" name="action" className="w-4 h-4" />
                    <div>
                      <p className="text-white font-medium">Nâng cấp lên gói VIP</p>
                      <p className="text-sm text-gray-400">Chuyển sang gói VIP có PT với giá 5.000.000đ</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 hover:border-primary cursor-pointer transition-all">
                    <input type="radio" name="action" className="w-4 h-4" />
                    <div>
                      <p className="text-white font-medium">Chuyển sang gói khác</p>
                      <p className="text-sm text-gray-400">Chọn gói tập phù hợp hơn với mục tiêu của bạn</p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => {
                    setSelectedPackage(packages[1]);
                    setPaymentStep('order_summary');
                    setPaymentStatus('pending_payment');
                    setActiveTab('payment');
                  }}
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && paymentTransaction && (
            <div className="max-w-5xl mx-auto">
              {/* Payment Stepper */}
              <PaymentStepper
                currentStep={
                  paymentStep === 'order_summary' ? 1 :
                  paymentStep === 'payment_qr' ? 2 :
                  paymentStep === 'payment_result' ? 3 : 4
                }
              />

              {/* Step 1: Order Summary */}
              {paymentStep === 'order_summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                      <PaymentMethodSelector
                        selectedMethod={paymentMethod}
                        onMethodChange={setPaymentMethod}
                        transactionCode={`${currentMember.memberId} ${paymentTransaction.packageCode}`}
                      />

                      <PromoCodeInput onApply={handleApplyPromo} />
                    </div>

                    <div>
                      <PaymentSummaryCard
                        transaction={paymentTransaction}
                        member={currentMember}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedPackage(null);
                        setActiveTab('buy');
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={!paymentMethod}
                      className={`flex-1 px-6 py-3 rounded-lg transition-colors font-medium ${
                        paymentMethod
                          ? 'bg-primary hover:bg-primary/90 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Tiếp tục thanh toán
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: QR Payment */}
              {paymentStep === 'payment_qr' && currentTransaction && (
                <div className="space-y-6">
                  <div className="bg-card border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">Thanh toán đơn hàng</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Mã đơn hàng: <span className="text-white font-mono">{currentTransaction.orderCode}</span>
                        </p>
                      </div>
                      <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg px-4 py-2">
                        <p className="text-orange-400 text-sm font-medium">Đang chờ thanh toán</p>
                      </div>
                    </div>
                  </div>

                  <QRPaymentDisplay
                    orderCode={currentTransaction.orderCode}
                    amount={currentTransaction.amount}
                    bankAccount={{
                      bank: 'Vietcombank',
                      accountName: 'GYM CENTER',
                      accountNumber: '0123456789'
                    }}
                    transferContent={`${currentTransaction.orderCode} ${currentMember.memberId}`}
                    onConfirmPaid={handleUserPaid}
                    onCancel={handleCancelTransaction}
                  />

                  {/* Demo Button */}
                  <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-blue-400 text-sm mb-3">
                          <strong>Chế độ Demo:</strong> Trong môi trường thực tế, thanh toán sẽ được xác nhận tự động hoặc bởi nhân viên. Bấm nút bên dưới để mô phỏng thanh toán thành công.
                        </p>
                        <button
                          onClick={handleSimulatePaymentSuccess}
                          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Mô phỏng thanh toán thành công
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Result */}
              {paymentStep === 'payment_result' && (
                <PaymentResult
                  status={
                    paymentStatus === 'success' ? 'success' :
                    paymentStatus === 'waiting_confirmation' ? 'waiting_confirmation' : 'failed'
                  }
                  transaction={
                    paymentStatus === 'success' && selectedTransaction ? {
                      transactionId: selectedTransaction.transactionId,
                      packageName: selectedTransaction.packageName,
                      amount: selectedTransaction.amount,
                      paymentMethod: selectedTransaction.paymentMethod,
                      paymentTime: selectedTransaction.paymentTime || new Date().toLocaleString('vi-VN')
                    } : undefined
                  }
                  onViewReceipt={paymentStatus === 'success' ? () => handleViewReceipt() : undefined}
                  onBackToPackages={() => {
                    setSelectedPackage(null);
                    setActiveTab('current');
                  }}
                  onViewHistory={() => setActiveTab('history')}
                  onRetryPayment={handleRetryPayment}
                  onChangeMethod={handleChangeMethod}
                />
              )}
            </div>
          )}

          {/* Transaction History Tab */}
          {activeTab === 'history' && (
            <div className="max-w-6xl mx-auto">
              <TransactionHistoryTable
                transactions={transactions}
                onViewReceipt={handleViewReceipt}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showReceiptModal && selectedTransaction && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          transaction={selectedTransaction}
          member={currentMember}
        />
      )}
    </>
  );
};
