import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { RefreshCw, User, CreditCard, CheckCircle, AlertCircle, FileText, Printer, Download, Crown, Zap, Target, Star, Building2, Wallet, QrCode, Smartphone, Calendar, DollarSign, Mail, Search, X } from 'lucide-react';

interface PaymentDTO {
  memberId: string;
  packageId: string;
  paymentMethod: string;
  amount: number;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
}

interface TrainingPackage {
  packageId: string;
  packageName: string;
  durationInMonths: number;
  price: number;
  isActive: boolean;
  features: string[];
  image: string;
  badge?: string;
  icon: any;
  popular?: boolean;
}

interface Member {
  memberId: string;
  fullName: string;
  phoneNum: string;
  currentPackage: {
    name: string;
    endDate: string;
    daysRemaining: number;
  };
}

export function RenewPackageUI() {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Chọn gói, 2: Chọn hội viên, 3: Thanh toán
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState('');

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });

  // Mock members data
  const allMembers: Member[] = [
    {
      memberId: 'M00123',
      fullName: 'Nguyễn Hoàng Anh',
      phoneNum: '0912345678',
      currentPackage: { name: 'Gói Premium 6 tháng', endDate: '2026-07-20', daysRemaining: 45 }
    },
    {
      memberId: 'M00124',
      fullName: 'Trần Minh Đức',
      phoneNum: '0987654321',
      currentPackage: { name: 'Gói 3 tháng', endDate: '2026-06-15', daysRemaining: 10 }
    },
    {
      memberId: 'M00125',
      fullName: 'Lê Quốc Bảo',
      phoneNum: '0901234567',
      currentPackage: { name: 'Gói VIP 12 tháng', endDate: '2027-01-10', daysRemaining: 180 }
    },
    {
      memberId: 'M00126',
      fullName: 'Phạm Thị Mai',
      phoneNum: '0909876543',
      currentPackage: { name: 'Gói PT Elite', endDate: '2026-08-05', daysRemaining: 60 }
    },
    {
      memberId: 'M00127',
      fullName: 'Võ Văn Nam',
      phoneNum: '0923456789',
      currentPackage: { name: 'Gói 6 tháng', endDate: '2026-09-20', daysRemaining: 105 }
    }
  ];

  const filteredMembers = allMembers.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.memberId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phoneNum.includes(searchTerm)
  );

  const packages: TrainingPackage[] = [
    {
      packageId: 'PKG001',
      packageName: 'Gói 3 tháng',
      durationInMonths: 3,
      price: 3200000,
      isActive: true,
      features: ['Tập không giới hạn', 'Wifi miễn phí', 'Tủ khóa cá nhân', 'Nước uống miễn phí', 'Mở cửa 6AM - 10PM'],
      image: 'https://images.unsplash.com/photo-1754475118668-64ac3f3b2559?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNjdWxhciUyMGF0aGxldGUlMjBkYXJrJTIwZ3ltfGVufDF8fHx8MTc3ODA4NTA2NXww&ixlib=rb-4.1.0&q=80&w=1080',
      icon: Target
    },
    {
      packageId: 'PKG002',
      packageName: 'Gói 6 tháng',
      durationInMonths: 6,
      price: 6500000,
      isActive: true,
      features: ['Tập không giới hạn', 'Lớp Group Class', 'Phòng xông hơi & sauna', 'Protein Shake miễn phí', 'Khăn tắm miễn phí', 'Mở cửa 24/7'],
      image: 'https://images.unsplash.com/photo-1770616756218-f0abe20da404?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwdHJhaW5pbmclMjBpbnRlbnNlJTIwZGFya3xlbnwxfHx8fDE3NzgyNTM3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'PHỔ BIẾN',
      icon: Zap,
      popular: true
    },
    {
      packageId: 'PKG003',
      packageName: 'Gói VIP 12 tháng',
      durationInMonths: 12,
      price: 12000000,
      isActive: true,
      features: ['Tất cả quyền lợi Premium', 'Tặng 12 buổi PT', 'Ưu tiên đặt lịch', 'Guest Pass (2/tháng)', 'Tư vấn dinh dưỡng', 'Tủ khóa VIP riêng biệt'],
      image: 'https://images.unsplash.com/photo-1754475096386-b7a2a45a91fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxtdXNjdWxhciUyMGF0aGxldGUlMjBkYXJrJTIwZ3ltfGVufDF8fHx8MTc3ODA4NTA2NXww&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'SANG TRỌNG',
      icon: Crown
    },
    {
      packageId: 'PKG004',
      packageName: 'Gói PT Elite',
      durationInMonths: 3,
      price: 15000000,
      isActive: true,
      features: ['20 buổi PT 1-1', 'Kế hoạch tập riêng', 'Thực đơn cá nhân hóa', 'Theo dõi tiến độ', 'Quyền tập Gym', 'Hỗ trợ online 24/7'],
      image: 'https://images.unsplash.com/photo-1676655079738-af54dfd6318e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw3fHxmaXRuZXNzJTIwdHJhaW5pbmclMjBpbnRlbnNlJTIwZGFya3xlbnwxfHx8fDE3NzgyNTM3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      badge: 'ĐẶC BIỆT',
      icon: Star
    }
  ];

  const paymentMethods = [
    { id: 'cash', name: 'Tiền mặt', icon: Wallet, description: 'Thanh toán tại quầy' },
    { id: 'credit_card', name: 'Thẻ tín dụng', icon: CreditCard, description: 'Visa, Mastercard, AMEX' },
    { id: 'bank_transfer', name: 'Chuyển khoản', icon: Building2, description: 'Chuyển khoản ngân hàng' },
    { id: 'ewallet', name: 'Ví điện tử', icon: Smartphone, description: 'Momo, ZaloPay, VNPay' }
  ];

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setSearchTerm('');
    setShowSuggestions(false);
    setStep(3);
  };

  const calculateNewDates = () => {
    const pkg = packages.find(p => p.packageId === selectedPackage);
    if (!pkg || !selectedMember) return { start: '', end: '' };

    const currentEnd = new Date(selectedMember.currentPackage.endDate);
    const newStart = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + pkg.durationInMonths);

    return {
      start: newStart.toLocaleDateString('vi-VN'),
      end: newEnd.toLocaleDateString('vi-VN')
    };
  };

  const handleConfirmRenewal = () => {
    if (!selectedPackage) {
      setError('Vui lòng chọn gói tập');
      return;
    }

    if (!selectedMember) {
      setError('Vui lòng chọn hội viên');
      return;
    }

    if (!paymentMethod) {
      setError('Vui lòng chọn phương thức thanh toán');
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!cardDetails.cardNumber || !cardDetails.cardHolder || !cardDetails.expiryDate || !cardDetails.cvv) {
        setError('Vui lòng điền đầy đủ thông tin thẻ');
        return;
      }
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setShowReceipt(true);
    }, 2000);
  };

  const dates = calculateNewDates();

  if (showReceipt) {
    const pkg = packages.find(p => p.packageId === selectedPackage);
    const receiptId = 'HD' + Date.now().toString().slice(-6);

    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-card/95 border-2 border-primary rounded-3xl p-10 shadow-[0_0_80px_rgba(255,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-destructive/20 rounded-full blur-3xl animate-pulse"></div>

            <div className="relative z-10">
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-destructive rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(255,0,0,0.8)] animate-bounce">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                  THANH TOÁN THÀNH CÔNG!
                </h2>
                <p className="text-muted-foreground text-lg">Gói tập đã được kích hoạt</p>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-8 border border-border/50 backdrop-blur-sm mb-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                  <div>
                    <h3 className="text-3xl font-black mb-2">HÓA ĐƠN THANH TOÁN</h3>
                    <p className="text-sm text-muted-foreground">Mã hóa đơn: <span className="text-primary font-mono font-bold text-lg">{receiptId}</span></p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleString('vi-VN')}</p>
                  </div>
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-destructive rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.6)]">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-card/50 rounded-xl p-5 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">MÃ HỘI VIÊN</p>
                      <p className="font-black font-mono text-xl text-primary">{selectedMember?.memberId}</p>
                    </div>
                    <div className="bg-card/50 rounded-xl p-5 border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">TÊN HỘI VIÊN</p>
                      <p className="font-black text-xl">{selectedMember?.fullName}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/20 to-destructive/20 rounded-2xl p-6 border-2 border-primary/50">
                    <p className="text-sm text-muted-foreground mb-2">GÓI TẬP ĐÃ CHỌN</p>
                    <p className="text-3xl font-black text-primary mb-6">{pkg?.packageName}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-card/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <p className="text-xs text-muted-foreground">NGÀY BẮT ĐẦU</p>
                        </div>
                        <p className="font-bold text-lg">{dates.start}</p>
                      </div>
                      <div className="bg-card/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <p className="text-xs text-muted-foreground">NGÀY KẾT THÚC</p>
                        </div>
                        <p className="font-bold text-lg">{dates.end}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-border">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-2xl font-black mb-1">TỔNG THANH TOÁN</p>
                        <p className="text-sm text-muted-foreground">
                          Phương thức: <span className="font-bold text-foreground">{paymentMethods.find(m => m.id === paymentMethod)?.name}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-5xl font-black text-primary">{pkg?.price.toLocaleString('vi-VN')}</p>
                        <p className="text-xl font-bold text-muted-foreground">VNĐ</p>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-xl p-4 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Nhân viên xử lý</p>
                      <p className="font-bold">Nguyễn Staff</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button onClick={() => window.print()} className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary hover:bg-secondary/80 rounded-2xl transition-all font-bold border border-border hover:border-primary/50">
                  <Printer className="w-5 h-5" />
                  In biên lai
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary hover:bg-secondary/80 rounded-2xl transition-all font-bold border border-border hover:border-primary/50">
                  <Download className="w-5 h-5" />
                  Tải PDF
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary hover:bg-secondary/80 rounded-2xl transition-all font-bold border border-border hover:border-primary/50">
                  <FileText className="w-5 h-5" />
                  Xuất hóa đơn
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary hover:bg-secondary/80 rounded-2xl transition-all font-bold border border-border hover:border-primary/50">
                  <Mail className="w-5 h-5" />
                  Gửi email
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Link to={`/members/${selectedMember?.memberId}`} className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary to-destructive text-white hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] rounded-2xl transition-all font-black">
                  Xem hồ sơ hội viên
                </Link>
                <button onClick={() => { setShowReceipt(false); setStep(1); setSelectedPackage(null); setSelectedMember(null); setPaymentMethod(''); }} className="px-6 py-4 border-2 border-border hover:bg-secondary rounded-2xl transition-all font-bold">
                  Đăng ký mới
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1770616756218-f0abe20da404?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwdHJhaW5pbmclMjBpbnRlbnNlJTIwZGFya3xlbnwxfHx8fDE3NzgyNTM3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Fitness Training"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div>
              <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">QUẢN LÝ GÓI TẬP</p>
              <h1 className="text-6xl font-black tracking-tight mb-4">
                <span className="text-primary">GIA HẠN</span>
                <br />
                <span className="text-white">GÓI TẬP</span>
              </h1>
              <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                Gia hạn và nâng cấp gói tập cho hội viên, quản lý thanh toán và in hóa đơn, theo dõi lịch sử gia hạn trên hệ thống.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8 -mt-12 relative z-10">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl ${step >= 1 ? 'bg-primary text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]' : 'bg-card/80 border border-border'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-white text-primary' : 'bg-secondary'} font-black`}>1</div>
              <span className="font-black">CHỌN GÓI</span>
            </div>
            <div className={`h-1 w-12 ${step >= 2 ? 'bg-primary' : 'bg-border'} rounded`}></div>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl ${step >= 2 ? 'bg-primary text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]' : 'bg-card/80 border border-border'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-white text-primary' : 'bg-secondary'} font-black`}>2</div>
              <span className="font-black">CHỌN HỘI VIÊN</span>
            </div>
            <div className={`h-1 w-12 ${step >= 3 ? 'bg-primary' : 'bg-border'} rounded`}></div>
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-xl ${step >= 3 ? 'bg-primary text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]' : 'bg-card/80 border border-border'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-white text-primary' : 'bg-secondary'} font-black`}>3</div>
              <span className="font-black">THANH TOÁN</span>
            </div>
          </div>

          {/* Step 1: Package Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-3xl font-black mb-6">CHỌN GÓI TẬP CỦA BẠN</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {packages.map(pkg => {
                  const Icon = pkg.icon;
                  const isSelected = selectedPackage === pkg.packageId;

                  return (
                    <div
                      key={pkg.packageId}
                      onClick={() => setSelectedPackage(pkg.packageId)}
                      className={`group relative cursor-pointer rounded-3xl overflow-hidden transition-all duration-500 ${
                        isSelected ? 'ring-4 ring-primary shadow-[0_0_60px_rgba(255,0,0,0.6)] scale-105' : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(0,0,0,0.6)]'
                      } ${pkg.popular ? 'md:scale-110' : ''}`}
                    >
                      <div className="relative h-56">
                        <img src={pkg.image} alt={pkg.packageName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                        <div className={`absolute inset-0 ${isSelected ? 'bg-primary/30' : 'bg-black/20'} mix-blend-multiply transition-all`}></div>

                        {pkg.badge && (
                          <div className={`absolute top-4 ${pkg.popular ? 'right-4 left-4 text-center' : 'right-4'} px-4 py-2 ${pkg.popular ? 'bg-gradient-to-r from-primary to-destructive' : 'bg-primary'} text-white text-xs font-black rounded-full shadow-[0_0_20px_rgba(255,0,0,0.8)] animate-pulse`}>
                            ✨ {pkg.badge} ✨
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-4 left-4 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,1)] animate-bounce">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>

                      <div className={`p-6 transition-all ${isSelected ? 'bg-gradient-to-br from-primary/30 to-destructive/30 backdrop-blur-xl border-t-4 border-primary' : 'bg-card/95 backdrop-blur-sm'}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? 'bg-primary shadow-[0_0_20px_rgba(255,0,0,0.6)]' : 'bg-secondary'}`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-primary'}`} />
                          </div>
                          <h4 className="text-xl font-black">{pkg.packageName}</h4>
                        </div>

                        <div className="mb-4">
                          <p className="text-4xl font-black text-primary mb-1">{pkg.price.toLocaleString('vi-VN')}</p>
                          <p className="text-sm text-muted-foreground font-bold">VNĐ • {pkg.durationInMonths} tháng</p>
                        </div>

                        <ul className="space-y-2 mb-4">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={isSelected ? 'font-bold' : 'font-medium'}>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button onClick={() => setSelectedPackage(pkg.packageId)} className={`w-full py-3 rounded-xl font-black transition-all ${isSelected ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,0,0.5)]' : 'bg-secondary hover:bg-primary hover:text-white'}`}>
                          {isSelected ? 'ĐÃ CHỌN' : 'CHỌN GÓI NÀY'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPackage && (
                <div className="mt-8 flex justify-end">
                  <button onClick={() => setStep(2)} className="px-12 py-5 bg-gradient-to-r from-primary to-destructive text-white rounded-3xl font-black text-xl hover:shadow-[0_0_60px_rgba(255,0,0,0.8)] transition-all">
                    TIẾP TỤC →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Member Selection */}
          {step === 2 && (
            <div>
              <div className="backdrop-blur-xl bg-card/90 border-2 border-border/50 rounded-3xl p-8 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <h3 className="text-3xl font-black mb-6">TÌM KIẾM HỘI VIÊN</h3>

                <div className="relative">
                  <div className="relative">
                    <Search className="w-6 h-6 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Nhập tên, mã hội viên, hoặc số điện thoại..."
                      className="w-full bg-input pl-14 pr-12 py-5 rounded-2xl border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-lg font-medium"
                    />
                    {searchTerm && (
                      <button onClick={() => { setSearchTerm(''); setShowSuggestions(false); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && searchTerm && filteredMembers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-primary rounded-2xl shadow-[0_0_40px_rgba(255,0,0,0.4)] max-h-96 overflow-y-auto z-50">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.memberId}
                          onClick={() => handleSelectMember(member)}
                          className="w-full p-5 hover:bg-primary/10 transition-colors border-b border-border last:border-0 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-lg mb-1">{member.fullName}</p>
                              <p className="text-sm text-muted-foreground">Mã: <span className="font-mono text-primary">{member.memberId}</span> • SĐT: {member.phoneNum}</p>
                              <p className="text-xs text-muted-foreground mt-1">Gói hiện tại: {member.currentPackage.name}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.currentPackage.daysRemaining < 30 ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                                Còn {member.currentPackage.daysRemaining} ngày
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showSuggestions && searchTerm && filteredMembers.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-border rounded-2xl shadow-lg p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-lg font-bold mb-1">Không tìm thấy hội viên</p>
                      <p className="text-sm text-muted-foreground">Vui lòng thử từ khóa khác</p>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-3">Hoặc chọn từ danh sách gần đây:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allMembers.slice(0, 4).map((member) => (
                      <button
                        key={member.memberId}
                        onClick={() => handleSelectMember(member)}
                        className="p-4 bg-secondary/30 hover:bg-primary/10 border border-border hover:border-primary rounded-xl transition-all text-left"
                      >
                        <p className="font-bold mb-1">{member.fullName}</p>
                        <p className="text-sm text-muted-foreground">Mã: <span className="font-mono text-primary">{member.memberId}</span></p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="px-12 py-5 border-4 border-border hover:bg-secondary rounded-3xl transition-all font-black text-xl">
                  ← Quay lại
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && selectedMember && selectedPackage && (
            <>
              {/* Member Info Summary */}
              <div className="backdrop-blur-xl bg-card/90 border-2 border-border/50 rounded-3xl p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                      <User className="w-6 h-6 text-primary" />
                      HỘI VIÊN ĐÃ CHỌN
                    </h3>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Họ và tên</p>
                        <p className="text-2xl font-black">{selectedMember.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Mã hội viên</p>
                        <p className="text-xl font-mono font-black text-primary">{selectedMember.memberId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gói hiện tại</p>
                        <p className="font-bold">{selectedMember.currentPackage.name}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setStep(2); setSelectedMember(null); }} className="px-6 py-3 border-2 border-border hover:bg-secondary rounded-xl transition-all font-bold">
                    Đổi hội viên
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="backdrop-blur-xl bg-card/90 border-2 border-border/50 rounded-3xl p-8 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-primary" />
                  PHƯƠNG THỨC THANH TOÁN
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  {paymentMethods.map(method => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;

                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-6 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-gradient-to-br from-primary/20 to-destructive/20 shadow-[0_0_40px_rgba(255,0,0,0.4)] scale-105'
                            : 'border-border hover:border-primary/50 hover:scale-105'
                        }`}
                      >
                        <Icon className={`w-10 h-10 mx-auto mb-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className={`font-black mb-1 ${isSelected ? 'text-primary text-lg' : ''}`}>{method.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">{method.description}</p>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6 border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="font-black mb-6 flex items-center gap-2 text-xl">
                      <CreditCard className="w-6 h-6 text-primary" />
                      THÔNG TIN THẺ TÍN DỤNG
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold mb-2 text-muted-foreground">Số thẻ</label>
                        <input
                          type="text"
                          value={cardDetails.cardNumber}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-mono font-bold text-lg"
                          maxLength={19}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-muted-foreground">Tên chủ thẻ</label>
                        <input
                          type="text"
                          value={cardDetails.cardHolder}
                          onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value })}
                          placeholder="NGUYEN VAN A"
                          className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-bold text-lg uppercase"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold mb-2 text-muted-foreground">Ngày hết hạn</label>
                          <input
                            type="text"
                            value={cardDetails.expiryDate}
                            onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                            placeholder="MM/YY"
                            className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-mono font-bold text-lg"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold mb-2 text-muted-foreground">CVV</label>
                          <input
                            type="text"
                            value={cardDetails.cvv}
                            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                            placeholder="123"
                            className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-mono font-bold text-lg"
                            maxLength={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6 border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-black mb-6 text-xl">THÔNG TIN TÀI KHOẢN</h4>
                        <div className="space-y-4">
                          <div className="bg-card/50 rounded-xl p-4 border border-border">
                            <p className="text-xs text-muted-foreground font-bold mb-1">TÊN NGÂN HÀNG</p>
                            <p className="font-black text-lg">Vietcombank</p>
                          </div>
                          <div className="bg-card/50 rounded-xl p-4 border border-border">
                            <p className="text-xs text-muted-foreground font-bold mb-1">SỐ TÀI KHOẢN</p>
                            <p className="font-black font-mono text-lg">0123456789</p>
                          </div>
                          <div className="bg-card/50 rounded-xl p-4 border border-border">
                            <p className="text-xs text-muted-foreground font-bold mb-1">CHỦ TÀI KHOẢN</p>
                            <p className="font-black text-lg">GYM MANAGER CO., LTD</p>
                          </div>
                          <div className="bg-card/50 rounded-xl p-4 border border-primary/50">
                            <p className="text-xs text-muted-foreground font-bold mb-1">NỘI DUNG CHUYỂN KHOẢN</p>
                            <p className="font-black text-primary text-lg">{selectedMember.memberId} GIAHAN</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="bg-white p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                          <QrCode className="w-56 h-56 text-black" />
                          <p className="text-center text-black text-sm font-black mt-4">QUÉT MÃ QR ĐỂ THANH TOÁN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'ewallet' && (
                  <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6 border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h4 className="font-black mb-6 text-xl">CHỌN VÍ ĐIỆN TỬ</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['Momo', 'ZaloPay', 'VNPay'].map(wallet => (
                        <button
                          key={wallet}
                          className="p-8 bg-card/50 rounded-2xl border-2 border-border hover:border-primary hover:scale-105 transition-all"
                        >
                          <Smartphone className="w-12 h-12 text-primary mx-auto mb-3" />
                          <p className="font-black text-lg">{wallet}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className="bg-gradient-to-br from-secondary/50 to-secondary/30 rounded-2xl p-6 border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="text-center py-12">
                      <Wallet className="w-20 h-20 text-primary mx-auto mb-6" />
                      <h4 className="font-black text-2xl mb-3">THANH TOÁN TIỀN MẶT</h4>
                      <p className="text-muted-foreground text-lg">Vui lòng đến quầy để hoàn tất thanh toán</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              {paymentMethod && (
                <div className="backdrop-blur-xl bg-gradient-to-br from-card/95 to-secondary/60 border-4 border-primary/50 rounded-3xl p-8 mb-6 shadow-[0_0_60px_rgba(255,0,0,0.4)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-destructive/20 rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                    <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-primary" />
                      TỔNG QUAN THANH TOÁN
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-4 border-b-2 border-border/50">
                        <p className="text-muted-foreground font-bold">Gói tập</p>
                        <p className="font-black text-xl">{packages.find(p => p.packageId === selectedPackage)?.packageName}</p>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b-2 border-border/50">
                        <p className="text-muted-foreground font-bold">Thời hạn</p>
                        <p className="font-black text-xl">{packages.find(p => p.packageId === selectedPackage)?.durationInMonths} tháng</p>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b-2 border-border/50">
                        <p className="text-muted-foreground font-bold">Ngày bắt đầu</p>
                        <p className="font-black text-xl">{dates.start}</p>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b-2 border-border/50">
                        <p className="text-muted-foreground font-bold">Ngày kết thúc</p>
                        <p className="font-black text-xl">{dates.end}</p>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b-2 border-border/50">
                        <p className="text-muted-foreground font-bold">Phương thức</p>
                        <p className="font-black text-xl">{paymentMethods.find(m => m.id === paymentMethod)?.name}</p>
                      </div>
                      <div className="flex items-center justify-between pt-6">
                        <p className="text-3xl font-black">TỔNG CỘNG</p>
                        <div className="text-right">
                          <p className="text-5xl font-black text-primary">
                            {packages.find(p => p.packageId === selectedPackage)?.price.toLocaleString('vi-VN')}
                          </p>
                          <p className="text-xl font-bold text-muted-foreground">VNĐ</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-destructive/20 border-2 border-destructive rounded-2xl p-6 mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  <p className="text-destructive font-bold text-lg">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="px-12 py-5 border-4 border-border hover:bg-secondary rounded-3xl transition-all font-black text-xl">
                  ← Quay lại
                </button>
                <button
                  onClick={handleConfirmRenewal}
                  disabled={loading || !paymentMethod}
                  className="flex-1 bg-gradient-to-r from-primary to-destructive text-white px-10 py-6 rounded-3xl font-black text-xl hover:shadow-[0_0_60px_rgba(255,0,0,0.8)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ĐANG XỬ LÝ...
                    </span>
                  ) : (
                    'XÁC NHẬN THANH TOÁN'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
