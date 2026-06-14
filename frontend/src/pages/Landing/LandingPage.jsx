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
  ["Quản lý hội viên", "Theo dõi hồ sơ, gói tập, lịch tập và trạng thái thanh toán trong một hệ thống."],
  ["Đặt lịch PT", "Kết nối hội viên với huấn luyện viên và cập nhật tiến độ tập luyện."],
  ["Bảo trì thiết bị", "Nhận report từ nhân viên và theo dõi trạng thái xử lý của từng thiết bị."],
  ["Báo cáo vận hành", "Tổng hợp doanh thu, hội viên, nhân sự và phản hồi dựa trên dữ liệu hệ thống."],
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Brand() {
  return (
    <Link className="landing-brand" to="/">
      <span>
        <img src="/assets/brand/gymster-icon.svg" alt="" />
      </span>
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

function EmptyState({ label }) {
  return <p className="preview-text">{label}</p>;
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
            Chuyển đổi trải nghiệm phòng tập bằng dữ liệu vận hành thực tế: hội viên, PT, gói tập,
            thanh toán và bảo trì đều nằm trong một hệ thống.
          </p>
          <div className="hero-actions">
            <button className="red-btn" type="button" onClick={() => navigate("/register")}>
              Tham gia ngay <span>-&gt;</span>
            </button>
            <button className="ghost-btn" type="button" onClick={() => scrollToSection("membership")}>
              Xem gói tập
            </button>
          </div>
          {stats.length > 0 && (
            <div className="hero-metrics">
              {stats.map(([value, label]) => (
                <div key={label}><strong>{value}</strong><span>{label}</span></div>
              ))}
            </div>
          )}
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=760&h=920&fit=crop&auto=format"
            alt="Hội viên Gymster tập luyện"
          />
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
              <div className="feature-icon">
                <img src="/assets/brand/gymster-icon.svg" alt="" />
              </div>
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
        <SectionTitle kicker="Membership" title="Gói tập hội viên" />
        {packages.length ? (
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
        ) : (
          <EmptyState label="Chưa có gói tập đang hoạt động." />
        )}
      </div>
    </section>
  );
}

function TrainersSection({ trainers }) {
  return (
    <section className="landing-section" id="trainers">
      <div className="landing-container">
        <SectionTitle kicker="Huấn luyện viên" title="Đội ngũ PT chuyên nghiệp" />
        {trainers.length ? (
          <div className="trainer-list">
            {trainers.map(([name, specialty, detail, rating, img]) => (
              <article className="trainer-card-landing" key={name}>
                <img src={img} alt={name} />
                <div>
                  <h3>{name}</h3>
                  <p>{specialty}</p>
                  <span>{detail} - {rating}/5</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState label="Chưa có huấn luyện viên đang hoạt động." />
        )}
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
            Gymster kết hợp công cụ quản lý hội viên, gói tập, huấn luyện viên, thiết bị và báo cáo
            trong cùng một giao diện.
          </p>
          <div className="about-points">
            <span>Dữ liệu tập trung</span>
            <span>Quy trình rõ ràng</span>
            <span>Trạng thái cập nhật liên tục</span>
          </div>
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
            Hội viên xem lịch tập, gói tập, buổi PT và chỉ số luyện tập. Admin theo dõi doanh thu,
            thiết bị và hiệu suất vận hành bằng dữ liệu hệ thống.
          </p>
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
        <p>Đăng ký để sử dụng luồng onboarding và dashboard quản lý.</p>
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
    stats: [],
    packages: [],
    trainers: [],
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      const { data } = await fetchLandingPageData();
      if (!isMounted || !data) return;

      setLandingData({
        stats: data.stats || [],
        packages: data.packages || [],
        trainers: data.trainers || [],
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
      <AppPreviewSection />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default LandingPage;
