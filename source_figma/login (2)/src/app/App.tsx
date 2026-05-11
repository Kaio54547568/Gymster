import { useState, useEffect, useMemo } from "react";
import {
  Dumbbell, Menu, X, Star, Check, Crown, Zap, Shield,
  Activity, BarChart2, CreditCard, Settings, TrendingUp,
  Clock, Phone, Mail, Instagram, Twitter, Facebook, Youtube,
  Flame, Heart, Target, ArrowRight, Users, Calendar, MapPin,
  ChevronLeft, ChevronRight, Play, Lock, User, Eye, EyeOff, ChevronDown,
} from "lucide-react";

type Page = "landing" | "login" | "register";
import { motion, AnimatePresence } from "motion/react";

// ─── data ─────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Home", "Membership", "Trainers", "Services", "About", "Contact"];

const FEATURES = [
  { Icon: Users, title: "Smart Membership Management", desc: "Quản lý toàn bộ hồ sơ hội viên, lịch sử tập luyện và trạng thái gói tập trên một nền tảng duy nhất." },
  { Icon: Calendar, title: "Personal Trainer Booking", desc: "Đặt lịch với huấn luyện viên cá nhân dễ dàng, theo dõi buổi tập và đánh giá tiến độ theo thời gian thực." },
  { Icon: Activity, title: "Workout Tracking", desc: "Ghi nhận lịch sử tập luyện, đo lường hiệu suất và nhận kế hoạch tập luyện cá nhân hóa." },
  { Icon: CreditCard, title: "Payment & Billing", desc: "Xử lý thanh toán nhanh chóng, cấp biên lai tự động và quản lý gia hạn gói tập thông minh." },
  { Icon: Settings, title: "Equipment Monitoring", desc: "Theo dõi tình trạng thiết bị, lên lịch bảo trì và nhận cảnh báo hỏng hóc tức thời." },
  { Icon: BarChart2, title: "Fitness Analytics", desc: "Báo cáo doanh thu, thống kê hội viên và đánh giá hiệu suất nhân viên theo thời gian thực." },
];

const PACKAGES = [
  {
    id: "basic", name: "BASIC", price: "299.000", unit: "₫/tháng", duration: "Gói 3 tháng",
    Icon: Zap, badge: null, popular: false,
    features: ["Truy cập phòng gym 24/7", "Sử dụng thiết bị cơ bản", "Tủ đồ cá nhân", "1 buổi tư vấn dinh dưỡng", "App theo dõi cơ bản"],
  },
  {
    id: "premium", name: "PREMIUM", price: "599.000", unit: "₫/tháng", duration: "Gói 6 tháng",
    Icon: Star, badge: "PHỔ BIẾN", popular: true,
    features: ["Tất cả quyền lợi Basic", "Lớp học nhóm không giới hạn", "2 buổi PT miễn phí/tháng", "Đánh giá thể trạng định kỳ", "App đầy đủ tính năng", "Ưu tiên đặt lịch"],
  },
  {
    id: "vip", name: "VIP ELITE", price: "999.000", unit: "₫/tháng", duration: "Gói 12 tháng",
    Icon: Crown, badge: "CAO CẤP", popular: false,
    features: ["Tất cả quyền lợi Premium", "PT cá nhân không giới hạn", "Kế hoạch dinh dưỡng riêng", "Phòng thay đồ VIP", "Áo tập thương hiệu", "Hỗ trợ 24/7 ưu tiên"],
  },
];

const TRAINERS = [
  {
    name: "Nguyễn Minh Đức", specialty: "Sức mạnh & Thể hình", exp: "8 năm", clients: 120, rating: 4.9,
    img: "https://images.unsplash.com/photo-1750698545009-679820502908?w=400&h=480&fit=crop&auto=format",
    tags: ["Powerlifting", "Bodybuilding"],
  },
  {
    name: "Trần Thị Phương", specialty: "HIIT & Yoga", exp: "6 năm", clients: 95, rating: 4.8,
    img: "https://images.unsplash.com/photo-1683889842937-bfd75dbc4a81?w=400&h=480&fit=crop&auto=format",
    tags: ["HIIT", "Flexibility"],
  },
  {
    name: "Lê Thanh Bình", specialty: "Cardio & Endurance", exp: "10 năm", clients: 150, rating: 4.9,
    img: "https://images.unsplash.com/photo-1652400744403-8f29705bd6a5?w=400&h=480&fit=crop&auto=format",
    tags: ["Marathon", "Cardio"],
  },
];

const GALLERY = [
  { img: "https://images.unsplash.com/photo-1774864040225-867c8806d78e?w=800&h=600&fit=crop&auto=format", alt: "Modern exercise machines in a premium gym", span: "col-span-2 row-span-2" },
  { img: "https://images.unsplash.com/photo-1597076537061-a6b58163aa45?w=400&h=300&fit=crop&auto=format", alt: "Black and red kettlebells", span: "col-span-1 row-span-1" },
  { img: "https://images.unsplash.com/photo-1683889842475-4fda63081fbe?w=400&h=300&fit=crop&auto=format", alt: "Woman training with gymnastic rings", span: "col-span-1 row-span-1" },
  { img: "https://images.unsplash.com/photo-1741156229623-da94e6d7977d?w=600&h=300&fit=crop&auto=format", alt: "Weights and training equipment", span: "col-span-1 row-span-1" },
  { img: "https://images.unsplash.com/photo-1763403921315-f2ef8697199f?w=600&h=300&fit=crop&auto=format", alt: "Yoga class in a bright studio", span: "col-span-1 row-span-1" },
];

const TESTIMONIALS = [
  { name: "Phạm Quốc Huy", role: "Kỹ sư phần mềm", rating: 5, quote: "IRONFORGE đã thay đổi hoàn toàn cách tôi tập luyện. App theo dõi tiến độ cực kỳ chi tiết, PT đỉnh cao. Chỉ sau 3 tháng, tôi giảm 8kg và tăng cơ đáng kể!", img: "https://images.unsplash.com/photo-1666039836795-8e1689798bd7?w=120&h=120&fit=crop&auto=format" },
  { name: "Nguyễn Thị Lan", role: "Giáo viên", rating: 5, quote: "Lớp yoga của IRONFORGE tuyệt vời hơn tôi tưởng. Huấn luyện viên rất tận tâm, cơ sở vật chất sạch đẹp và hiện đại. Tôi đã giới thiệu cho toàn bộ gia đình!", img: "https://images.unsplash.com/photo-1683889842937-bfd75dbc4a81?w=120&h=120&fit=crop&auto=format" },
  { name: "Trần Minh Khoa", role: "Doanh nhân", rating: 5, quote: "Gói VIP Elite xứng đáng từng đồng. PT cá nhân cực kỳ chuyên nghiệp, phòng thay đồ VIP rất sang trọng. Đây là khoản đầu tư tốt nhất tôi từng làm!", img: "https://images.unsplash.com/photo-1577744168855-0391d2ed2b3a?w=120&h=120&fit=crop&auto=format" },
];

const CHART_DATA = [
  { day: "T2", calories: 420, members: 240 },
  { day: "T3", calories: 680, members: 315 },
  { day: "T4", calories: 520, members: 278 },
  { day: "T5", calories: 750, members: 390 },
  { day: "T6", calories: 590, members: 342 },
  { day: "T7", calories: 890, members: 455 },
  { day: "CN", calories: 1100, members: 523 },
];

// ─── helpers ──────────────────────────────────────────────────────────────

const R = "#FF3B3B";
const GLASS = { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.07)" };
const GLOW = (size = 20, alpha = 0.3) => `0 0 ${size}px rgba(255,59,59,${alpha})`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-4">
      <div className="h-px w-12" style={{ background: R }} />
      <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: R, fontFamily: "'Inter',sans-serif" }}>{children}</span>
      <div className="h-px w-12" style={{ background: R }} />
    </div>
  );
}

function SectionTitle({ children, light }: { children: React.ReactNode; light?: string }) {
  return (
    <h2 className="text-center text-white mb-4" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(2.2rem,4vw,3.2rem)", letterSpacing: "0.06em", lineHeight: 1.05 }}>
      {children}{light && <span style={{ color: R }}> {light}</span>}
    </h2>
  );
}

// ─── particles ────────────────────────────────────────────────────────────

function Particles({ count = 24 }: { count?: number }) {
  const dots = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i, x: (i * 41.3 + 7) % 100, y: (i * 57.1 + 11) % 100,
      size: (i % 3) + 1.5, dur: 8 + (i % 6) * 2, delay: (i % 5) * 0.9,
      op: 0.2 + (i % 4) * 0.12,
    })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: `rgba(255,59,59,${p.op})`, boxShadow: `0 0 ${p.size * 4}px rgba(255,59,59,0.6)` }}
          animate={{ y: [-14, 14, -14], opacity: [p.op * 0.4, p.op, p.op * 0.4] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── navbar ───────────────────────────────────────────────────────────────

function Navbar({ navigate }: { navigate: (p: Page) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{ background: scrolled ? "rgba(13,13,13,0.92)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 flex items-center justify-between h-[72px]">
        <button onClick={() => navigate("landing")} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(18, 0.5) }}>
            <Dumbbell size={17} className="text-white" />
          </div>
          <span className="text-white tracking-[0.2em]" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.3rem" }}>IRONFORGE</span>
        </button>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(l => (
            <a key={l} href="#" className="text-sm font-medium transition-colors duration-200"
              style={{ color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}
              onMouseEnter={e => (e.currentTarget.style.color = R)}
              onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>
              {l}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button onClick={() => navigate("login")}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-red-500/10"
            style={{ border: `1px solid rgba(255,59,59,0.5)`, color: R, fontFamily: "'Inter',sans-serif" }}>
            Đăng nhập
          </button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate("register")}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(16, 0.35), fontFamily: "'Inter',sans-serif" }}>
            Đăng ký ngay
          </motion.button>
        </div>

        <button className="lg:hidden text-white p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden" style={{ background: "rgba(13,13,13,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-5 py-6 flex flex-col gap-4">
              {NAV_LINKS.map(l => (
                <a key={l} href="#" className="text-white text-base font-medium py-1" style={{ fontFamily: "'Inter',sans-serif" }}>{l}</a>
              ))}
              <div className="flex flex-col gap-3 mt-2">
                <button onClick={() => { navigate("login"); setOpen(false); }}
                  className="w-full py-3 rounded-lg text-sm font-semibold" style={{ border: `1px solid rgba(255,59,59,0.5)`, color: R }}>Đăng nhập</button>
                <button onClick={() => { navigate("register"); setOpen(false); }}
                  className="w-full py-3 rounded-lg text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)" }}>Đăng ký ngay</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── hero ─────────────────────────────────────────────────────────────────

function HeroSection({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-[72px]" style={{ background: "#0D0D0D" }}>
      {/* BG glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle,rgba(255,59,59,0.08) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle,rgba(153,0,0,0.12) 0%,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-0 left-0 w-px h-full opacity-10" style={{ background: "linear-gradient(to bottom,transparent,#FF3B3B,transparent)", left: "15%" }} />
        <div className="absolute top-0 left-0 w-px h-full opacity-5" style={{ background: "linear-gradient(to bottom,transparent,#FF3B3B,transparent)", left: "85%" }} />
      </div>
      <Particles count={30} />

      <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-10 w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-16 lg:py-0">
        {/* Left */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-0.5 w-10" style={{ background: R }} />
            <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: R }}>Premium Fitness Platform</span>
          </div>

          <h1 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: "clamp(4rem,7.5vw,7rem)", lineHeight: 0.9, letterSpacing: "0.02em", color: "#fff", textShadow: "0 0 80px rgba(255,59,59,0.2)" }}>
            PUSH YOUR<br />
            <span style={{ color: R, textShadow: "0 0 60px rgba(255,59,59,0.8),0 0 120px rgba(255,59,59,0.3)" }}>LIMITS</span>
          </h1>

          <p className="mt-5 mb-8 text-base leading-relaxed max-w-md" style={{ color: "#BDBDBD", fontFamily: "'Inter',sans-serif" }}>
            Chuyển đổi cơ thể với huấn luyện viên chuyên nghiệp, thiết bị hiện đại và trải nghiệm fitness đẳng cấp cao.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-sm"
              style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(25, 0.4), fontFamily: "'Inter',sans-serif", letterSpacing: "0.05em" }}
              onClick={() => navigate("register")}>
              Tham gia ngay <ArrowRight size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontFamily: "'Inter',sans-serif" }}
              onClick={() => navigate("register")}>
              <Play size={15} fill="currentColor" /> Xem gói tập
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { val: "5,000+", label: "Hội viên" },
              { val: "50+", label: "Huấn luyện viên" },
              { val: "24/7", label: "Hỗ trợ" },
              { val: "10+", label: "Chương trình" },
            ].map(s => (
              <div key={s.label} className="text-center sm:text-left">
                <div className="font-bold text-white" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.8rem", letterSpacing: "0.06em", color: R }}>{s.val}</div>
                <div className="text-xs uppercase tracking-widest" style={{ color: "#6B7280" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – image + floating cards */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-[480px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden"
            style={{ boxShadow: `0 0 60px rgba(255,59,59,0.15), 0 30px 80px rgba(0,0,0,0.6)`, border: "1px solid rgba(255,255,255,0.07)" }}>
            <img src="https://images.unsplash.com/photo-1674361398440-73029de0d8cd?w=700&h=900&fit=crop&auto=format"
              alt="Muscular athlete flexing in dramatic dark lighting" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,rgba(13,13,13,0.1) 0%,rgba(153,0,0,0.15) 60%,rgba(13,13,13,0.7) 100%)" }} />
            <div className="absolute bottom-0 left-0 right-0 h-40" style={{ background: "linear-gradient(to top,rgba(13,13,13,0.9),transparent)" }} />
          </div>

          {/* Floating card – calories */}
          <motion.div animate={{ y: [-6, 6, -6] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 sm:-left-10 top-16 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ ...GLASS, boxShadow: GLOW(16, 0.2), minWidth: 160 }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,59,59,0.15)" }}>
              <Flame size={18} style={{ color: R }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: "#6B7280" }}>Hôm nay</div>
              <div className="font-bold text-white text-sm">1,240 kcal</div>
            </div>
          </motion.div>

          {/* Floating card – workout */}
          <motion.div animate={{ y: [6, -6, 6] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 sm:-right-10 top-1/3 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ ...GLASS, boxShadow: GLOW(16, 0.2), minWidth: 160 }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,59,59,0.15)" }}>
              <Clock size={18} style={{ color: R }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: "#6B7280" }}>Buổi tập</div>
              <div className="font-bold text-white text-sm">45 phút</div>
            </div>
          </motion.div>

          {/* Floating card – members */}
          <motion.div animate={{ y: [-4, 8, -4] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-2 sm:-right-8 bottom-20 rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ ...GLASS, boxShadow: GLOW(16, 0.2), minWidth: 160 }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,59,59,0.15)" }}>
              <Heart size={18} style={{ color: R }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: "#6B7280" }}>Nhịp tim</div>
              <div className="font-bold text-white text-sm">142 bpm</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
          className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}>
          <div className="w-1 h-2 rounded-full" style={{ background: R }} />
        </motion.div>
      </div>
    </section>
  );
}

// ─── features ─────────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="py-24 relative" style={{ background: "#0D0D0D" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,59,59,0.2),transparent)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <SectionLabel>Tính năng nền tảng</SectionLabel>
        <SectionTitle light="Quản Lý Gym">Mọi Thứ Bạn Cần Để</SectionTitle>
        <p className="text-center max-w-xl mx-auto mb-14 text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
          Hệ thống quản lý gym toàn diện — từ hội viên, huấn luyện viên đến thiết bị và tài chính.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }} viewport={{ once: true }}
              whileHover={{ y: -4, boxShadow: GLOW(30, 0.2) }}
              className="rounded-2xl p-6 cursor-default transition-all duration-300"
              style={{ ...GLASS, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(255,59,59,0.1)", border: "1px solid rgba(255,59,59,0.2)" }}>
                <Icon size={22} style={{ color: R }} />
              </div>
              <h3 className="font-bold text-white mb-2 text-base" style={{ fontFamily: "'Inter',sans-serif" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── packages ─────────────────────────────────────────────────────────────

function PackagesSection({ navigate }: { navigate: (p: Page) => void }) {
  const [sel, setSel] = useState("premium");
  return (
    <section className="py-24 relative" style={{ background: "#0A0A0A" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle,rgba(153,0,0,0.06) 0%,transparent 70%)", filter: "blur(60px)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <SectionLabel>Gói thành viên</SectionLabel>
        <SectionTitle light="Của Bạn">Chọn Cấp Độ</SectionTitle>
        <p className="text-center max-w-lg mx-auto mb-14 text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
          Mỗi gói tập được thiết kế để phù hợp với mục tiêu và ngân sách của bạn.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PACKAGES.map((pkg, i) => {
            const { Icon } = pkg;
            const active = sel === pkg.id;
            const isVip = pkg.id === "vip";
            return (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
                whileHover={{ y: -6 }} onClick={() => setSel(pkg.id)}
                className="relative rounded-2xl p-7 cursor-pointer transition-all duration-300"
                style={{
                  background: isVip
                    ? "linear-gradient(145deg,rgba(255,59,59,0.12),rgba(153,0,0,0.08))"
                    : active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)",
                  border: isVip
                    ? "1px solid rgba(255,59,59,0.5)"
                    : active ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: isVip ? `${GLOW(40, 0.25)}, 0 20px 50px rgba(0,0,0,0.4)` : "0 8px 30px rgba(0,0,0,0.3)",
                }}>
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-white font-bold"
                    style={{ background: "linear-gradient(90deg,#FF3B3B,#990000)", fontSize: "0.6rem", letterSpacing: "0.2em", boxShadow: GLOW(12, 0.5) }}>
                    {pkg.badge}
                  </div>
                )}

                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,59,59,0.12)", border: "1px solid rgba(255,59,59,0.2)" }}>
                    <Icon size={20} style={{ color: R }} />
                  </div>
                  {active && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: R }}><Check size={10} className="text-white" /></div>}
                </div>

                <div className="mb-1 font-bold uppercase tracking-[0.15em]" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.1rem", color: R }}>{pkg.name}</div>
                <div className="mb-0.5">
                  <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Oswald',sans-serif" }}>{pkg.price}</span>
                  <span className="text-xs ml-1" style={{ color: "#6B7280" }}>{pkg.unit}</span>
                </div>
                <div className="text-xs mb-5" style={{ color: "#6B7280" }}>{pkg.duration}</div>

                <div className="space-y-2 mb-6">
                  {pkg.features.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={11} className="mt-0.5 flex-shrink-0" style={{ color: R }} />
                      <span className="text-xs leading-snug" style={{ color: "#9CA3AF" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  onClick={() => navigate("register")}
                  style={isVip
                    ? { background: "linear-gradient(135deg,#FF3B3B,#990000)", color: "#fff", boxShadow: GLOW(16, 0.35), fontFamily: "'Inter',sans-serif" }
                    : { border: "1px solid rgba(255,59,59,0.4)", color: R, fontFamily: "'Inter',sans-serif" }}>
                  {isVip ? "Đăng ký VIP Elite" : "Chọn gói này"}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── trainers ─────────────────────────────────────────────────────────────

function TrainersSection({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <section className="py-24 relative" style={{ background: "#0D0D0D" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,59,59,0.15),transparent)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <SectionLabel>Đội ngũ chuyên gia</SectionLabel>
        <SectionTitle light="Tốt Nhất">Tập Cùng Những</SectionTitle>
        <p className="text-center max-w-lg mx-auto mb-14 text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
          Đội ngũ huấn luyện viên được chứng nhận quốc tế, sẵn sàng đồng hành trên mọi hành trình fitness của bạn.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TRAINERS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }} viewport={{ once: true }}
              whileHover={{ y: -6 }}
              className="rounded-2xl overflow-hidden transition-all duration-300 group"
              style={{ ...GLASS, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = GLOW(30, 0.2))}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)")}>
              {/* Image */}
              <div className="relative h-64 bg-gray-900 overflow-hidden">
                <img src={t.img} alt={`Huấn luyện viên ${t.name}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(13,13,13,0.8) 0%,transparent 60%)" }} />
                <div className="absolute bottom-3 left-4 right-4 flex gap-2 flex-wrap">
                  {t.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(255,59,59,0.2)", color: R, border: "1px solid rgba(255,59,59,0.3)", fontSize: "0.65rem" }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-bold text-white text-base" style={{ fontFamily: "'Inter',sans-serif" }}>{t.name}</div>
                    <div className="text-sm" style={{ color: "#6B7280" }}>{t.specialty}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={13} fill={R} style={{ color: R }} />
                    <span className="text-sm font-semibold text-white">{t.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 mb-4">
                  <div className="text-xs" style={{ color: "#6B7280" }}><span className="text-white font-semibold">{t.exp}</span> kinh nghiệm</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}><span className="text-white font-semibold">{t.clients}</span> học viên</div>
                </div>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: "1px solid rgba(255,59,59,0.35)", color: R, fontFamily: "'Inter',sans-serif", transition: "all 0.2s" }}
                  onClick={() => navigate("register")}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,59,59,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  Đặt lịch tập
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── gallery ──────────────────────────────────────────────────────────────

function GallerySection() {
  return (
    <section className="py-24" style={{ background: "#0A0A0A" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <SectionLabel>Cơ sở vật chất</SectionLabel>
        <SectionTitle light="Đẳng Cấp">Không Gian Tập Luyện</SectionTitle>
        <p className="text-center max-w-lg mx-auto mb-12 text-sm leading-relaxed" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
          Hơn 2,000m² không gian tập luyện được trang bị thiết bị hiện đại nhất từ các thương hiệu hàng đầu thế giới.
        </p>

        <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[480px]">
          {GALLERY.map((g, i) => (
            <motion.div key={i} className={`${g.span} relative overflow-hidden rounded-2xl bg-gray-900 group cursor-pointer`}
              whileHover={{ scale: 0.99 }} transition={{ duration: 0.3 }}>
              <img src={g.img} alt={g.alt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                style={{ background: "rgba(255,59,59,0.15)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(13,13,13,0.5) 0%,transparent 60%)" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── testimonials ─────────────────────────────────────────────────────────

function TestimonialsSection() {
  const [active, setActive] = useState(0);
  return (
    <section className="py-24 relative" style={{ background: "#0D0D0D" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,59,59,0.15),transparent)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <SectionLabel>Đánh giá hội viên</SectionLabel>
        <SectionTitle light="Hội Viên Nói">Những Gì</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}
              className="rounded-2xl p-6" style={{ ...GLASS, boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} fill={R} style={{ color: R }} />
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: "#9CA3AF", fontFamily: "'Inter',sans-serif", fontStyle: "italic" }}>
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0" style={{ border: "2px solid rgba(255,59,59,0.3)" }}>
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white" style={{ fontFamily: "'Inter',sans-serif" }}>{t.name}</div>
                  <div className="text-xs" style={{ color: "#6B7280" }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{ background: i === active ? R : "rgba(255,255,255,0.2)", transform: i === active ? "scale(1.3)" : "scale(1)" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── mini svg chart (replaces recharts to avoid internal key conflicts) ───

type ChartRow = { day: string; members: number };

function MiniAreaChart({ data }: { data: ChartRow[] }) {
  const W = 280;
  const H = 90;
  const pad = { t: 6, b: 20, l: 4, r: 4 };
  const vals = data.map(d => d.members);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const xs = data.map((_, i) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r));
  const ys = data.map(d => pad.t + (1 - (d.members - min) / range) * (H - pad.t - pad.b));
  const pts = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const areaPath = `M${xs[0]},${ys[0]} ` + xs.slice(1).map((x, i) => `L${x},${ys[i + 1]}`).join(" ")
    + ` L${xs[xs.length - 1]},${H - pad.b} L${xs[0]},${H - pad.b} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="mcg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF3B3B" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF3B3B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#mcg)" />
      <polyline points={pts} fill="none" stroke="#FF3B3B" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <text key={d.day} x={xs[i]} y={H - 4} textAnchor="middle" fill="#6B7280" fontSize="8">{d.day}</text>
      ))}
    </svg>
  );
}

// ─── app preview ──────────────────────────────────────────────────────────

function AppPreviewSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#0A0A0A" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,59,59,0.15),transparent)" }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle,rgba(255,59,59,0.06) 0%,transparent 70%)", filter: "blur(60px)" }} />
      </div>
      <div className="max-w-7xl mx-auto px-5 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div>
            <SectionLabel>Nền tảng số</SectionLabel>
            <h2 className="text-white mb-5" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(2.5rem,4vw,3.5rem)", letterSpacing: "0.05em", lineHeight: 1.05 }}>
              Quản Lý Gym Thông Minh <span style={{ color: R }}>Tại Đầu Ngón Tay</span>
            </h2>
            <p className="text-sm leading-relaxed mb-8" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
              Từ quản lý hội viên, đặt lịch huấn luyện đến báo cáo doanh thu — tất cả trên một nền tảng duy nhất, truy cập mọi lúc mọi nơi.
            </p>

            <div className="space-y-4">
              {[
                { Icon: Activity, label: "Theo dõi buổi tập theo thời gian thực" },
                { Icon: Calendar, label: "Đặt lịch PT và lớp học tự động" },
                { Icon: BarChart2, label: "Báo cáo doanh thu và phân tích nâng cao" },
                { Icon: Shield, label: "Bảo mật dữ liệu đạt tiêu chuẩn quốc tế" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,59,59,0.1)", border: "1px solid rgba(255,59,59,0.2)" }}>
                    <Icon size={15} style={{ color: R }} />
                  </div>
                  <span className="text-sm" style={{ color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right – dashboard mockup */}
          <div>
            <div className="rounded-2xl overflow-hidden" style={{ ...GLASS, boxShadow: `${GLOW(40, 0.15)}, 0 30px 70px rgba(0,0,0,0.6)`, border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Browser chrome */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF3B3B" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#FFB800" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#00C853" }} />
                <div className="ml-3 flex-1 rounded-md py-1 px-3 text-xs text-center" style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280" }}>
                  ironforge.app/dashboard
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-4" style={{ background: "#111111" }}>
                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Hội viên hôm nay", val: "234", icon: Users, delta: "+12%" },
                    { label: "Doanh thu", val: "8.4M", icon: TrendingUp, delta: "+8%" },
                    { label: "Buổi tập", val: "48", icon: Activity, delta: "+5%" },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <m.icon size={13} style={{ color: R }} />
                        <span className="text-xs" style={{ color: "#22C55E", fontSize: "0.6rem" }}>{m.delta}</span>
                      </div>
                      <div className="font-bold text-white text-base" style={{ fontFamily: "'Oswald',sans-serif" }}>{m.val}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#6B7280", fontSize: "0.6rem" }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-white">Hoạt động tuần này</span>
                    <span className="text-xs" style={{ color: R }}>Xem chi tiết</span>
                  </div>
                  <MiniAreaChart data={CHART_DATA} />
                </div>

                {/* Recent members */}
                <div className="space-y-2">
                  {[
                    { name: "Nguyễn Văn A", pkg: "VIP Elite", time: "09:24" },
                    { name: "Trần Thị B", pkg: "Premium", time: "10:15" },
                    { name: "Lê Minh C", pkg: "Basic", time: "11:03" },
                  ].map(m => (
                    <div key={m.name} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(255,59,59,0.2)", color: R }}>{m.name[0]}</div>
                        <span className="text-xs text-white">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: R, fontSize: "0.65rem" }}>{m.pkg}</span>
                        <span className="text-xs" style={{ color: "#4B5563", fontSize: "0.65rem" }}>{m.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── cta banner ───────────────────────────────────────────────────────────

function CTABanner({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0D0D0D 0%,#1a0000 50%,#0D0D0D 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full" style={{ background: "radial-gradient(ellipse,rgba(255,59,59,0.12) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,59,59,0.3),transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right,transparent,rgba(255,59,59,0.15),transparent)" }} />
      </div>
      <Particles count={16} />

      <div className="relative z-10 max-w-3xl mx-auto px-5 lg:px-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: "rgba(255,59,59,0.1)", border: "1px solid rgba(255,59,59,0.25)" }}>
          <Flame size={14} style={{ color: R }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: R }}>Bắt đầu ngay hôm nay</span>
        </div>
        <h2 className="text-white mb-4" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(2.5rem,5vw,4rem)", letterSpacing: "0.05em" }}>
          BẮT ĐẦU HÀNH TRÌNH <span style={{ color: R }}>FITNESS</span> CỦA BẠN
        </h2>
        <p className="text-sm leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "#9CA3AF", fontFamily: "'Inter',sans-serif" }}>
          Tham gia cùng hơn 5,000 hội viên đã tin tưởng IRONFORGE. Dùng thử miễn phí 7 ngày, không cần thẻ tín dụng.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white"
            style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(30, 0.5), fontFamily: "'Inter',sans-serif", fontSize: "0.95rem", letterSpacing: "0.05em" }}
            onClick={() => navigate("register")}>
            Đăng ký miễn phí <ArrowRight size={17} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontFamily: "'Inter',sans-serif", fontSize: "0.95rem" }}
            onClick={() => navigate("login")}>
            Đăng nhập tài khoản
          </motion.button>
        </div>
      </div>
    </section>
  );
}

// ─── footer ───────────────────────────────────────────────────────────────

function Footer() {
  const socials = [
    { Icon: Instagram, label: "Instagram" }, { Icon: Facebook, label: "Facebook" },
    { Icon: Youtube, label: "Youtube" }, { Icon: Twitter, label: "Twitter" },
  ];
  const links = {
    "Nền tảng": ["Quản lý hội viên", "Đặt lịch PT", "Theo dõi workout", "Báo cáo & Thống kê"],
    "Công ty": ["Về chúng tôi", "Đội ngũ", "Blog", "Tuyển dụng"],
    "Hỗ trợ": ["Trung tâm trợ giúp", "Liên hệ", "Chính sách bảo mật", "Điều khoản dịch vụ"],
  };

  return (
    <footer style={{ background: "#080808", borderTop: "1px solid rgba(255,59,59,0.12)" }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-10 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(14, 0.4) }}>
                <Dumbbell size={17} className="text-white" />
              </div>
              <span className="text-white tracking-[0.2em]" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.25rem" }}>IRONFORGE</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>
              Nền tảng quản lý phòng tập gym hàng đầu Việt Nam, kết hợp công nghệ hiện đại với trải nghiệm fitness đẳng cấp.
            </p>
            <div className="flex gap-3">
              {socials.map(({ Icon, label }) => (
                <motion.button key={label} whileHover={{ scale: 1.15, color: R }} whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#6B7280" }}
                  onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(255,59,59,0.35)"; e.currentTarget.style.color = R; }}
                  onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#6B7280"; }}>
                  <Icon size={15} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <div className="text-white font-semibold text-sm mb-4 uppercase tracking-widest" style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: "0.15em", fontSize: "0.95rem" }}>{title}</div>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a href="#" className="text-sm transition-colors duration-200 hover:text-white"
                      style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}
                      onMouseEnter={e => (e.currentTarget.style.color = R)}
                      onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap gap-6 mt-10 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { Icon: MapPin, text: "123 Nguyễn Huệ, Quận 1, TP.HCM" },
            { Icon: Phone, text: "0901 234 567" },
            { Icon: Mail, text: "hello@ironforge.vn" },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon size={14} style={{ color: R }} />
              <span className="text-sm" style={{ color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-xs" style={{ color: "#4B5563", fontFamily: "'Inter',sans-serif" }}>© 2026 IRONFORGE Fitness Center. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="text-xs transition-colors" style={{ color: "#4B5563" }}>Chính sách bảo mật</a>
            <a href="#" className="text-xs transition-colors" style={{ color: "#4B5563" }}>Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── floating cta ─────────────────────────────────────────────────────────

function FloatingCTA({ navigate }: { navigate: (p: Page) => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const h = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-40">
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-white text-sm shadow-2xl"
            style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: `${GLOW(25, 0.5)}, 0 10px 30px rgba(0,0,0,0.5)`, fontFamily: "'Inter',sans-serif" }}
            onClick={() => navigate("register")}>
            <Flame size={16} />
            Bắt đầu ngay
            <ArrowRight size={14} />
          </motion.button>
          {/* Pulse ring */}
          <motion.div className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ border: "2px solid rgba(255,59,59,0.4)" }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── shared auth input ────────────────────────────────────────────────────

type AuthInputProps = {
  Icon: React.ElementType;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};
function AuthInput({ Icon, label, type = "text", placeholder, value, onChange }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-colors duration-200" style={{ color: focused ? R : "#4B5563" }}>
          <Icon size={15} />
        </div>
        <input
          type={isPass && show ? "text" : type}
          placeholder={placeholder} value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full pl-10 pr-10 py-3 text-sm text-white placeholder-gray-700 rounded-lg outline-none transition-all duration-300"
          style={{
            fontFamily: "'Inter',sans-serif",
            background: "rgba(255,255,255,0.04)",
            border: focused ? "1px solid rgba(255,59,59,0.7)" : "1px solid rgba(255,255,255,0.07)",
            boxShadow: focused ? "0 0 18px rgba(255,59,59,0.12)" : "none",
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-red-400 transition-colors">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── auth hero panel (shared left side) ──────────────────────────────────

function AuthHero({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <aside className="hidden lg:flex lg:w-[44%] relative flex-col flex-shrink-0 overflow-hidden">
      <div className="absolute inset-0 bg-black">
        <img src="https://images.unsplash.com/photo-1645362841580-965e3171912b?w=1200&h=1080&fit=crop&auto=format"
          alt="Muscular athlete training" className="w-full h-full object-cover" style={{ opacity: 0.55 }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(150deg,rgba(0,0,0,0.85) 0%,rgba(153,0,0,0.12) 55%,rgba(0,0,0,0.92) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.65) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: "linear-gradient(to top,rgba(153,0,0,0.4) 0%,transparent 100%)" }} />
      </div>
      <Particles count={20} />
      <div className="relative z-10 flex flex-col justify-between h-full p-10">
        <button onClick={() => navigate("landing")} className="flex items-center gap-3 w-fit">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(20, 0.5) }}>
            <Dumbbell size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold tracking-[0.22em]" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.35rem" }}>IRONFORGE</div>
            <div className="text-xs tracking-[0.25em] uppercase" style={{ color: R }}>Fitness Center</div>
          </div>
        </button>
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-0.5 w-10" style={{ background: R }} />
            <span className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: R }}>Premium Fitness</span>
          </div>
          <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: "clamp(3.5rem,5.5vw,5.5rem)", lineHeight: 0.88, letterSpacing: "0.04em", color: "#fff", textShadow: "0 0 80px rgba(255,59,59,0.3)" }}>
            PUSH YOUR<br />
            <span style={{ color: R, textShadow: "0 0 50px rgba(255,59,59,0.9)" }}>LIMITS</span>
          </h1>
          <p className="text-gray-300 text-base font-light tracking-wider mt-4" style={{ fontFamily: "'Inter',sans-serif" }}>
            Train harder. Become stronger.
          </p>
          <div className="flex gap-7 mt-8">
            {[{ val: "2,400+", label: "Hội viên" }, { val: "50+", label: "HLV" }, { val: "99%", label: "Hài lòng" }].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold" style={{ fontFamily: "'Oswald',sans-serif", color: R }}>{s.val}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={13} style={{ color: R }} />
          <span className="text-xs text-gray-500 tracking-wider">Cam kết hoàn tiền trong 30 ngày</span>
        </div>
      </div>
    </aside>
  );
}

// ─── login page ───────────────────────────────────────────────────────────

function LoginPage({ navigate }: { navigate: (p: Page) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="flex min-h-screen" style={{ background: "#0D0D0D", fontFamily: "'Inter',sans-serif" }}>
      <AuthHero navigate={navigate} />

      <main className="flex-1 flex items-center justify-center px-5 sm:px-10 py-12 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="w-full max-w-md">

          {/* Mobile logo */}
          <button onClick={() => navigate("landing")} className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(16, 0.45) }}>
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="text-white tracking-[0.2em]" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.3rem" }}>IRONFORGE</span>
          </button>

          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 30px 70px rgba(0,0,0,0.6)" }}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg,rgba(255,59,59,0.18),rgba(153,0,0,0.12))", border: "1px solid rgba(255,59,59,0.28)", boxShadow: GLOW(30, 0.15) }}>
                <Lock size={22} style={{ color: R }} />
              </div>
              <h2 className="text-white font-bold mb-1" style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: "0.12em", fontSize: "2rem" }}>
                CHÀO MỪNG TRỞ LẠI
              </h2>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>Đăng nhập vào tài khoản của bạn</p>
            </div>

            <div className="space-y-4 mb-6">
              <AuthInput Icon={Mail} label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
              <AuthInput Icon={Lock} label="Mật khẩu" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setRemember(!remember)}
                  className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer"
                  style={{ background: remember ? R : "transparent", border: remember ? `1px solid ${R}` : "1px solid rgba(255,255,255,0.2)", boxShadow: remember ? GLOW(10, 0.4) : "none" }}>
                  {remember && <Check size={9} className="text-white" />}
                </div>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>Ghi nhớ đăng nhập</span>
              </label>
              <button className="text-sm hover:text-white transition-colors" style={{ color: R }}>Quên mật khẩu?</button>
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-widest mb-5"
              style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(30, 0.4), fontFamily: "'Oswald',sans-serif", fontSize: "1.1rem", letterSpacing: "0.2em" }}>
              Đăng nhập
            </motion.button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              <span className="text-xs" style={{ color: "#4B5563" }}>hoặc</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[{ label: "Google", color: "#EA4335" }, { label: "Facebook", color: "#1877F2" }].map(s => (
                <button key={s.label} className="py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ border: "1px solid rgba(255,255,255,0.07)", color: "#9CA3AF", background: "rgba(255,255,255,0.03)" }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${s.color}40`; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#9CA3AF"; }}>
                  {s.label}
                </button>
              ))}
            </div>

            <p className="text-center text-sm" style={{ color: "#6B7280" }}>
              Chưa có tài khoản?{" "}
              <button onClick={() => navigate("register")} className="font-medium hover:text-red-300 transition-colors" style={{ color: R }}>
                Đăng ký ngay
              </button>
            </p>
          </div>

          <button onClick={() => navigate("landing")} className="flex items-center gap-2 mx-auto mt-6 text-sm transition-colors hover:text-white" style={{ color: "#4B5563" }}>
            <ChevronLeft size={15} /> Về trang chủ
          </button>
        </motion.div>
      </main>
    </div>
  );
}

// ─── register page ────────────────────────────────────────────────────────

const REG_PACKAGES = [
  { id: "basic", name: "BASIC", price: "299.000", duration: "3 tháng", Icon: Zap, badge: null, features: ["Truy cập 24/7", "Thiết bị cơ bản", "Tủ đồ cá nhân", "1 buổi tư vấn"] },
  { id: "premium", name: "PREMIUM", price: "599.000", duration: "6 tháng", Icon: Star, badge: "PHỔ BIẾN", features: ["Tất cả Basic", "Lớp nhóm thoải mái", "2 buổi PT/tháng", "Đánh giá định kỳ", "App đầy đủ"] },
  { id: "vip", name: "VIP ELITE", price: "999.000", duration: "12 tháng", Icon: Crown, badge: "CAO CẤP", features: ["Tất cả Premium", "PT không giới hạn", "Dinh dưỡng cá nhân", "Phòng VIP", "Áo tập thương hiệu"] },
];

const REG_TRAINERS = [
  { id: 1, name: "Nguyễn Minh Đức", specialty: "Sức mạnh & Thể hình", rating: 4.9, exp: "8 năm", clients: 120, img: "https://images.unsplash.com/photo-1750698545009-679820502908?w=200&h=200&fit=crop&auto=format" },
  { id: 2, name: "Trần Thị Phương", specialty: "HIIT & Yoga", rating: 4.8, exp: "6 năm", clients: 95, img: "https://images.unsplash.com/photo-1683889842937-bfd75dbc4a81?w=200&h=200&fit=crop&auto=format" },
  { id: 3, name: "Lê Thanh Bình", specialty: "Cardio & Endurance", rating: 4.9, exp: "10 năm", clients: 150, img: "https://images.unsplash.com/photo-1652400744403-8f29705bd6a5?w=200&h=200&fit=crop&auto=format" },
];

function RegisterPage({ navigate }: { navigate: (p: Page) => void }) {
  const [selPkg, setSelPkg] = useState("premium");
  const [selPT, setSelPT] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "", confirm: "", phone: "", dob: "", gender: "" });
  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const isVIP = selPkg === "vip";

  return (
    <div className="flex min-h-screen" style={{ background: "#0D0D0D", fontFamily: "'Inter',sans-serif" }}>
      <AuthHero navigate={navigate} />

      <main className="flex-1 overflow-y-auto" style={{ background: "#0D0D0D", scrollbarWidth: "none" }}>
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">

          {/* Mobile logo */}
          <button onClick={() => navigate("landing")} className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(16, 0.45) }}>
              <Dumbbell size={16} className="text-white" />
            </div>
            <span className="text-white tracking-[0.2em]" style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1.3rem" }}>IRONFORGE</span>
          </button>

          {/* Info card */}
          <div className="rounded-2xl p-7 mb-5" style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 30px 70px rgba(0,0,0,0.6)" }}>
            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                style={{ background: "linear-gradient(135deg,rgba(255,59,59,0.18),rgba(153,0,0,0.12))", border: "1px solid rgba(255,59,59,0.28)", boxShadow: GLOW(30, 0.15) }}>
                <Dumbbell size={22} style={{ color: R }} />
              </div>
              <h2 className="text-white font-bold mb-1" style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: "0.12em", fontSize: "1.9rem" }}>CREATE MEMBERSHIP</h2>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>Join the ultimate fitness experience</p>
            </div>

            <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: R }}>Thông tin cá nhân</div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput Icon={User} label="Họ và tên" placeholder="Nguyễn Văn A" value={form.fullName} onChange={setF("fullName")} />
                <AuthInput Icon={User} label="Tên đăng nhập" placeholder="nguyenvana" value={form.username} onChange={setF("username")} />
              </div>
              <AuthInput Icon={Mail} label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={setF("email")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput Icon={Lock} label="Mật khẩu" type="password" placeholder="••••••••" value={form.password} onChange={setF("password")} />
                <AuthInput Icon={Lock} label="Xác nhận mật khẩu" type="password" placeholder="••••••••" value={form.confirm} onChange={setF("confirm")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput Icon={Phone} label="Số điện thoại" type="tel" placeholder="0901 234 567" value={form.phone} onChange={setF("phone")} />
                <AuthInput Icon={Calendar} label="Ngày sinh" type="date" placeholder="" value={form.dob} onChange={setF("dob")} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#9CA3AF" }}>Giới tính</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10" style={{ color: "#4B5563" }}><Users size={15} /></div>
                  <select value={form.gender} onChange={setF("gender")} className="w-full pl-10 pr-10 py-3 text-sm rounded-lg outline-none appearance-none transition-all duration-300"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: form.gender ? "#fff" : "#4B5563", fontFamily: "'Inter',sans-serif" }}
                    onFocus={e => { e.currentTarget.style.border = "1px solid rgba(255,59,59,0.7)"; }}
                    onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"; }}>
                    <option value="" style={{ background: "#1A1A1A" }}>Chọn giới tính</option>
                    <option value="male" style={{ background: "#1A1A1A" }}>Nam</option>
                    <option value="female" style={{ background: "#1A1A1A" }}>Nữ</option>
                    <option value="other" style={{ background: "#1A1A1A" }}>Khác</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4B5563" }}><ChevronDown size={14} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* Package selection */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1" style={{ background: "rgba(255,59,59,0.18)" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: R }}>Chọn gói tập</span>
            <div className="h-px flex-1" style={{ background: "rgba(255,59,59,0.18)" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {REG_PACKAGES.map((pkg, i) => {
              const { Icon } = pkg;
              const sel = selPkg === pkg.id;
              return (
                <motion.button key={pkg.id} type="button" onClick={() => setSelPkg(pkg.id)}
                  whileHover={{ scale: 1.025, y: -3 }} whileTap={{ scale: 0.975 }}
                  className="relative text-left rounded-xl p-5 cursor-pointer w-full"
                  style={{ background: sel ? "linear-gradient(145deg,rgba(255,59,59,0.14),rgba(153,0,0,0.08))" : "rgba(255,255,255,0.025)", border: sel ? "1px solid rgba(255,59,59,0.55)" : "1px solid rgba(255,255,255,0.06)", boxShadow: sel ? GLOW(35, 0.2) : "none" }}>
                  {pkg.badge && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap"
                      style={{ background: "linear-gradient(90deg,#FF3B3B,#990000)", color: "#fff", fontSize: "0.58rem", letterSpacing: "0.18em", boxShadow: GLOW(12, 0.5) }}>
                      {pkg.badge}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={17} style={{ color: sel ? R : "#4B5563" }} />
                    {sel && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: R }}><Check size={10} className="text-white" /></div>}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ fontFamily: "'Oswald',sans-serif", color: sel ? R : "#6B7280" }}>{pkg.name}</div>
                  <div className="mb-0.5">
                    <span className="text-xl font-bold text-white" style={{ fontFamily: "'Oswald',sans-serif" }}>{pkg.price}</span>
                    <span className="text-xs ml-1" style={{ color: "#6B7280" }}>₫</span>
                  </div>
                  <div className="text-xs text-gray-600 mb-3">{pkg.duration}</div>
                  <div className="space-y-1.5">
                    {pkg.features.map(f => (
                      <div key={f} className="flex items-start gap-1.5">
                        <Check size={9} className="mt-0.5 flex-shrink-0" style={{ color: sel ? R : "#374151" }} />
                        <span className="text-xs leading-snug" style={{ color: sel ? "#D1D5DB" : "#6B7280" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* PT selection (VIP only) */}
          <AnimatePresence>
            {isVIP && (
              <motion.div key="pt-sel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.38 }} className="overflow-hidden mb-5">
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1" style={{ background: "rgba(255,59,59,0.18)" }} />
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: R }}>Chọn huấn luyện viên</span>
                  <div className="h-px flex-1" style={{ background: "rgba(255,59,59,0.18)" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {REG_TRAINERS.map(t => {
                    const sel = selPT === t.id;
                    return (
                      <motion.button key={t.id} type="button" onClick={() => setSelPT(sel ? null : t.id)}
                        whileHover={{ scale: 1.025, y: -3 }} whileTap={{ scale: 0.975 }}
                        className="relative text-left rounded-xl p-5 cursor-pointer w-full"
                        style={{ background: sel ? "linear-gradient(145deg,rgba(255,59,59,0.12),rgba(153,0,0,0.07))" : "rgba(255,255,255,0.025)", border: sel ? "1px solid rgba(255,59,59,0.5)" : "1px solid rgba(255,255,255,0.06)", boxShadow: sel ? GLOW(28, 0.18) : "none", transition: "all 0.3s" }}>
                        {sel && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: R }}><Check size={10} className="text-white" /></div>}
                        <div className="flex flex-col items-center text-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-gray-900"
                            style={{ border: sel ? `2px solid ${R}` : "2px solid rgba(255,255,255,0.08)", boxShadow: sel ? GLOW(20, 0.45) : "none" }}>
                            <img src={t.img} alt={t.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-sm font-semibold text-white mb-0.5">{t.name}</div>
                          <div className="text-xs text-gray-500 mb-2">{t.specialty}</div>
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} fill={i < Math.floor(t.rating) ? R : "none"} style={{ color: R }} />)}
                            <span className="text-xs font-semibold text-white ml-1">{t.rating}</span>
                          </div>
                          <div className="text-xs text-gray-600">{t.exp} · {t.clients} HV</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit card */}
          <div className="rounded-2xl p-7" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)" }}>
            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <div role="checkbox" aria-checked={agreed} tabIndex={0} onClick={() => setAgreed(!agreed)}
                onKeyDown={e => e.key === "Enter" && setAgreed(!agreed)}
                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200 cursor-pointer"
                style={{ background: agreed ? R : "transparent", border: agreed ? `1px solid ${R}` : "1px solid rgba(255,255,255,0.18)", boxShadow: agreed ? GLOW(14, 0.45) : "none" }}>
                {agreed && <Check size={11} className="text-white" />}
              </div>
              <span className="text-sm leading-snug" style={{ color: "#9CA3AF" }}>
                Tôi đồng ý với <span className="hover:text-red-300 cursor-pointer transition-colors" style={{ color: R }}>Điều khoản dịch vụ</span> và <span className="hover:text-red-300 cursor-pointer transition-colors" style={{ color: R }}>Chính sách bảo mật</span> của IRONFORGE
              </span>
            </label>

            <motion.button type="button" whileHover={{ scale: 1.012 }} whileTap={{ scale: 0.988 }}
              className="w-full py-4 rounded-xl font-bold text-white uppercase tracking-widest mb-4"
              style={{ background: "linear-gradient(135deg,#FF3B3B,#990000)", boxShadow: GLOW(35, 0.4), fontFamily: "'Oswald',sans-serif", fontSize: "1.15rem", letterSpacing: "0.22em" }}>
              JOIN NOW — IRONFORGE
            </motion.button>

            <p className="text-center text-sm" style={{ color: "#6B7280" }}>
              Đã có tài khoản?{" "}
              <button onClick={() => navigate("login")} className="font-medium hover:text-red-300 transition-colors" style={{ color: R }}>Đăng nhập ngay</button>
            </p>
          </div>

          <button onClick={() => navigate("landing")} className="flex items-center gap-2 mx-auto mt-6 text-sm transition-colors hover:text-white" style={{ color: "#4B5563" }}>
            <ChevronLeft size={15} /> Về trang chủ
          </button>
          <div className="h-8" />
        </div>
      </main>
    </div>
  );
}

// ─── app ──────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const navigate = (p: Page) => { setPage(p); window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); };

  if (page === "login") return <LoginPage navigate={navigate} />;
  if (page === "register") return <RegisterPage navigate={navigate} />;

  return (
    <div style={{ background: "#0D0D0D" }}>
      <Navbar navigate={navigate} />
      <HeroSection navigate={navigate} />
      <FeaturesSection />
      <PackagesSection navigate={navigate} />
      <TrainersSection navigate={navigate} />
      <GallerySection />
      <TestimonialsSection />
      <AppPreviewSection />
      <CTABanner navigate={navigate} />
      <Footer />
      <FloatingCTA navigate={navigate} />
    </div>
  );
}
