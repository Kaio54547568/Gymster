import { useRef, useState } from "react";
import LandingHeader from "../../components/layout/LandingHeader";
import LoginForm from "../../components/auth/LoginForm";
import RegisterForm from "../../components/auth/RegisterForm";
import "./LoginPage.css";
import { useNavigate } from "react-router";

function LoginPage() {
  const [authMode, setAuthMode] = useState("login");

  const infoRef = useRef(null);
  const contactRef = useRef(null);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    e.preventDefault();
    navigate("/owner/dashboard");
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    alert("Đăng ký thành công! Bạn có thể đăng nhập ngay.");
    setAuthMode("login");
  };

  const scrollToInfo = () => {
    infoRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="login-page">
      <LandingHeader onContactClick={scrollToContact} />

      <section className="hero-section">
        <div className="overlay"></div>

        <div className="hero-container">
          <div className="hero-left">
            <p className="subtitle">WELCOME TO GYM MANAGEMENT</p>

            <h1>
              BEGIN YOUR
              <br />
              FITNESS JOURNEY
            </h1>

            <p className="desc">
              Quản lý phòng tập chuyên nghiệp, theo dõi hội viên, thiết bị, gói tập
              và vận hành toàn hệ thống trên một nền tảng hiện đại.
            </p>

            <div className="actions">
              <button className="btn-main" type="button" onClick={scrollToInfo}>
                Explore More
              </button>
              <button className="btn-light" type="button" onClick={scrollToContact}>
                Get In Touch
              </button>
            </div>
          </div>

          <div className="auth-panel">
            <div className="auth-card">
              <div className="auth-header">
                <p className="auth-tag">ADMIN ACCESS</p>
                <h2>{authMode === "login" ? "Đăng nhập" : "Đăng ký"}</h2>
                <p className="auth-desc">
                  Truy cập hệ thống để quản lý hội viên, gói tập, thiết bị và hoạt
                  động phòng gym.
                </p>
              </div>

              <div className="auth-tabs">
                <button
                  className={`auth-tab ${authMode === "login" ? "active" : ""}`}
                  type="button"
                  onClick={() => setAuthMode("login")}
                >
                  Đăng nhập
                </button>

                <button
                  className={`auth-tab ${authMode === "register" ? "active" : ""}`}
                  type="button"
                  onClick={() => setAuthMode("register")}
                >
                  Đăng ký
                </button>
              </div>

              <div className="auth-forms">
                {authMode === "login" ? (
                  <LoginForm
                    onSubmit={handleLoginSubmit}
                    onSwitchRegister={() => setAuthMode("register")}
                  />
                ) : (
                  <RegisterForm
                    onSubmit={handleRegisterSubmit}
                    onSwitchLogin={() => setAuthMode("login")}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="info-section" ref={infoRef}>
        <div className="container">
          <p className="section-kicker">ABOUT THE SYSTEM</p>
          <h2>Hệ thống quản lý phòng gym hiện đại</h2>
          <p className="section-text">
            Hệ thống hỗ trợ quản lý hội viên, gói tập, thiết bị, nhân sự và phản hồi
            khách hàng trên cùng một nền tảng. Chủ phòng tập và nhân viên có thể theo
            dõi hoạt động hằng ngày nhanh chóng, trực quan và hiệu quả hơn.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <h3>Quản lý hội viên</h3>
              <p>Theo dõi hồ sơ, gói tập, lịch sử tập luyện và tình trạng gia hạn.</p>
            </div>

            <div className="feature-card">
              <h3>Quản lý gói tập</h3>
              <p>Kiểm soát các gói 3 tháng, 6 tháng, 1 năm, gói PT và thanh toán.</p>
            </div>

            <div className="feature-card">
              <h3>Quản lý thiết bị</h3>
              <p>Ghi nhận tình trạng thiết bị, kế hoạch bảo trì và sửa chữa định kỳ.</p>
            </div>

            <div className="feature-card">
              <h3>Báo cáo thống kê</h3>
              <p>Doanh thu, hội viên mới, gia hạn và hiệu suất vận hành toàn hệ thống.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" ref={contactRef}>
        <div className="container">
          <p className="section-kicker">GET IN TOUCH</p>
          <h2>Liên hệ triển khai hệ thống</h2>
          <p className="section-text">
            Bạn có thể dùng giao diện này làm landing page đăng nhập cho hệ thống quản
            lý gym, sau đó kết nối với dashboard quản trị và các module nghiệp vụ.
          </p>

          <div className="contact-list">
            <div className="contact-item">
              <span>Email</span>
              <strong>gymmanager@example.com</strong>
            </div>

            <div className="contact-item">
              <span>Hotline</span>
              <strong>+1800-208-6835</strong>
            </div>

            <div className="contact-item">
              <span>Địa chỉ</span>
              <strong>123 Fitness Street, Ho Chi Minh City</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;