import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { fetchLandingPageData } from "../../services/landingApi";
import "./LandingPage.css";

const navItems = [
  ["Trang chủ", "home"],
  ["Gói tập", "membership"],
  ["Huấn luyện viên", "trainers"],
  ["Dịch vụ", "services"],
  ["Về chúng tôi", "about"],
  ["Liên hệ", "contact"],
];

const features = [
  ["Quản lý hội viên thông minh", "Quản lý hồ sơ hội viên, lịch sử tập luyện và trạng thái gói tập trên một nền tảng duy nhất."],
  ["Đặt lịch huấn luyện viên", "Đặt lịch với PT, theo dõi buổi tập và đánh giá tiến độ theo thời gian thực."],
  ["Theo dõi tập luyện", "Ghi nhận lịch sử tập, đo lường hiệu suất và nhận kế hoạch tập luyện cá nhân hóa."],
  ["Thanh toán và gia hạn", "Xử lý thanh toán, biên lai và gia hạn gói tập rõ ràng, nhanh chóng."],
  ["Theo dõi thiết bị", "Quản lý tình trạng thiết bị, lên lịch bảo trì và nhận cảnh báo khi cần xử lý."],
  ["Báo cáo vận hành", "Theo dõi doanh thu, hội viên mới và hiệu suất nhân sự theo thời gian thực."],
];

const fallbackStats = [
  ["5,000+", "Hội viên"],
  ["50+", "Huấn luyện viên"],
  ["10+", "Gói tập"],
  ["24/7", "Hỗ trợ"],
];

const fallbackPackages = [
  {
    name: "Basic Gym 3 Months",
    price: "850.000",
    unit: "VND",
    duration: "Gói 3 tháng",
    features: ["Access to gym facilities", "Locker access", "Basic workout support", "Gymster package tracking"],
  },
  {
    name: "Basic Gym 6 Months",
    price: "1.600.000",
    unit: "VND",
    duration: "Gói 6 tháng",
    badge: "PHỔ BIẾN",
    featured: true,
    features: ["Access to gym facilities", "Priority schedule support", "Monthly body check", "Gymster package tracking"],
  },
  {
    name: "VIP PT Package 6 Months",
    price: "7.800.000",
    unit: "VND",
    duration: "Gói 6 tháng",
    badge: "VIP PT",
    features: ["60 PT sessions", "Personal workout plan", "Weekly progress tracking", "Priority trainer support"],
  },
];

const fallbackTrainers = [
  ["Alex Carter", "Strength and Conditioning", "12/20 hội viên", "4.9", "https://images.unsplash.com/photo-1750698545009-679820502908?w=500&h=620&fit=crop&auto=format"],
  ["Mia Tran", "HIIT and Yoga", "10/18 hội viên", "4.8", "https://images.unsplash.com/photo-1683889842937-bfd75dbc4a81?w=500&h=620&fit=crop&auto=format"],
  ["David Nguyen", "Cardio and Endurance", "16/24 hội viên", "4.9", "https://images.unsplash.com/photo-1652400744403-8f29705bd6a5?w=500&h=620&fit=crop&auto=format"],
];

const testimonials = [
  ["Phạm Quốc Huy", "Gymster giúp tôi theo dõi tiến độ và lịch PT rõ ràng hơn rất nhiều."],
  ["Nguyễn Thị Lan", "Giao diện dễ dùng, lịch tập và thông báo rất tiện cho hội viên."],
  ["Trần Minh Khoa", "Tôi thích cách hệ thống gom gói tập, thanh toán và lịch tập vào một nơi."],
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Brand() {
  return (
    <Link className="landing-brand" to="/">
      <span>G</span>
      <strong>GYMSTER</strong>
    </Link>
  );
}

function SectionTitle({ kicker, title, accent }) {
  return (
    <div className="landing-title">
      <p>{kicker}</p>
      <h2>
        {title}
        {accent && <span> {accent}</span>}
      </h2>
    </div>
  );
}

function Navbar() {
  return (
    <header className="landing-nav-wrap">
      <div className="landing-nav">
        <Brand />
        <nav>
          {navItems.map(([label, id]) => (
            <button key={id} type="button" onClick={() => scrollToSection(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="landing-nav-actions">
          <Link className="outline-btn" to="/login">Đăng nhập</Link>
          <Link className="red-btn small" to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ stats }) {
  const navigate = useNavigate();

  return (
    <section className="landing-hero" id="home">
      <div className="hero-bg-grid" />
      <div className="landing-container hero-grid">
        <div className="hero-copy">
          <div className="hero-kicker-line">Nền tảng fitness cao cấp</div>
          <h1>
            Push your
            <span>Limits</span>
          </h1>
          <p>
            Chuyển đổi cơ thể với huấn luyện viên chuyên nghiệp, thiết bị hiện đại và trải nghiệm fitness đẳng cấp cao.
          </p>
          <div className="hero-actions">
            <button className="red-btn" type="button" onClick={() => navigate("/register")}>
              Tham gia ngay <span>→</span>
            </button>
            <button className="ghost-btn" type="button" onClick={() => scrollToSection("membership")}>
              ▶ Xem gói tập
            </button>
          </div>
          <div className="hero-metrics">
            {stats.map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=760&h=920&fit=crop&auto=format"
            alt="Hội viên Gymster tập luyện"
          />
          <div className="float-card top">Hôm nay<strong>1,240 kcal</strong></div>
          <div className="float-card mid">Buổi tập<strong>45 phút</strong></div>
          <div className="float-card bottom">Nhịp tim<strong>142 bpm</strong></div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="landing-section" id="services">
      <div className="landing-container">
        <SectionTitle kicker="Tính năng" title="Quản lý phòng gym" accent="toàn diện" />
        <div className="landing-card-grid">
          {features.map(([title, text]) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">G</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackagesSection({ packages }) {
  return (
    <section className="landing-section dark-band" id="membership">
      <div className="landing-container">
        <SectionTitle kicker="Membership" title="Chọn gói tập" accent="phù hợp" />
        <div className="package-list">
          {packages.map((pkg) => (
            <article className={`membership-card ${pkg.featured ? "featured" : ""}`} key={pkg.id || pkg.name}>
              {pkg.badge && <span className="membership-badge">{pkg.badge}</span>}
              <h3>{pkg.name}</h3>
              <div className="membership-price">{pkg.price}<span>{pkg.unit}</span></div>
              <p>{pkg.duration}</p>
              <ul>
                {pkg.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
              <Link className={pkg.featured ? "red-btn full" : "outline-btn full"} to="/register">
                Đăng ký gói này
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrainersSection({ trainers }) {
  return (
    <section className="landing-section" id="trainers">
      <div className="landing-container">
        <SectionTitle kicker="Huấn luyện viên" title="Đội ngũ PT" accent="chuyên nghiệp" />
        <div className="trainer-list">
          {trainers.map(([name, specialty, detail, rating, img]) => (
            <article className="trainer-card-landing" key={name}>
              <img src={img} alt={name} />
              <div>
                <h3>{name}</h3>
                <p>{specialty}</p>
                <span>{detail} · {rating}/5</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="landing-section dark-band" id="about">
      <div className="landing-container about-grid">
        <SectionTitle kicker="Về Gymster" title="Một nền tảng cho" accent="toàn bộ phòng tập" />
        <div className="about-copy">
          <p>
            Gymster kết hợp trải nghiệm fitness cao cấp với hệ thống quản lý hiện đại. Phòng tập có thể quản lý hội viên, gói tập, huấn luyện viên, thiết bị và báo cáo vận hành trong cùng một giao diện.
          </p>
          <div className="about-points">
            <span>Quản lý nhanh hơn</span>
            <span>Dữ liệu rõ ràng hơn</span>
            <span>Trải nghiệm hội viên tốt hơn</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <SectionTitle kicker="Cảm nhận" title="Hội viên nói gì" accent="về Gymster" />
        <div className="testimonial-list">
          {testimonials.map(([name, quote]) => (
            <article className="testimonial-card" key={name}>
              <p>"{quote}"</p>
              <strong>{name}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppPreviewSection() {
  return (
    <section className="landing-section dark-band">
      <div className="landing-container preview-grid">
        <div>
          <SectionTitle kicker="Ứng dụng" title="Theo dõi tiến độ" accent="mọi lúc" />
          <p className="preview-text">
            Hội viên xem lịch tập, gói tập, số buổi PT và chỉ số luyện tập. Chủ phòng tập theo dõi doanh thu, thiết bị và hiệu suất vận hành.
          </p>
        </div>
        <div className="app-preview">
          <div className="preview-row"><span>Calories</span><strong>1,240 kcal</strong></div>
          <div className="preview-row"><span>Buổi tập</span><strong>45 phút</strong></div>
          <div className="preview-row"><span>Gói tập</span><strong>Nâng cao</strong></div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="landing-cta" id="contact">
      <div className="landing-container cta-inner">
        <h2>Sẵn sàng bắt đầu cùng Gymster?</h2>
        <p>Đăng ký ngay để trải nghiệm giao diện hội viên và chuẩn bị kết nối dashboard quản trị.</p>
        <div className="hero-actions centered">
          <Link className="red-btn" to="/register">Đăng ký ngay</Link>
          <Link className="ghost-btn" to="/login">Đăng nhập</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="landing-container footer-grid">
        <Brand />
        <p>Gymster - nền tảng fitness và quản lý phòng gym hiện đại.</p>
        <span>© 2026 Gymster. All rights reserved.</span>
      </div>
    </footer>
  );
}

function LandingPage() {
  const [landingData, setLandingData] = useState({
    stats: fallbackStats,
    packages: fallbackPackages,
    trainers: fallbackTrainers,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      const { data } = await fetchLandingPageData();
      if (!isMounted || !data) return;

      setLandingData({
        stats: data.stats?.length ? data.stats : fallbackStats,
        packages: data.packages?.length ? data.packages : fallbackPackages,
        trainers: data.trainers?.length ? data.trainers : fallbackTrainers,
      });
    }

    loadLandingData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection stats={landingData.stats} />
      <FeaturesSection />
      <PackagesSection packages={landingData.packages} />
      <TrainersSection trainers={landingData.trainers} />
      <AboutSection />
      <TestimonialsSection />
      <AppPreviewSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default LandingPage;
