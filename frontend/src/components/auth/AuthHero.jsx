import { Link } from "react-router";

function AuthHero() {
  return (
    <aside className="auth-hero">
      <div className="auth-hero-bg">
        <img
          src="https://images.unsplash.com/photo-1645362841580-965e3171912b?w=1200&h=1080&fit=crop&auto=format"
          alt="Vận động viên đang tập luyện"
        />
      </div>

      <div className="auth-particles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className="auth-hero-inner">
        <Link className="forge-brand" to="/" aria-label="Về trang chủ Gymster">
          <span className="forge-brand-icon">G</span>
          <span>
            <span className="forge-brand-main">GYMSTER</span>
            <span className="forge-brand-sub">Quản lý phòng gym</span>
          </span>
        </Link>

        <div>
          <div className="hero-kicker">Nền tảng quản lý phòng gym</div>
          <h1 className="auth-hero-title">
            Push your
            <span>Limits</span>
          </h1>
          <p className="hero-subtitle">Quản lý hội viên, gói tập và vận hành trong một hệ thống.</p>
          <div className="hero-stats">
            <div>
              <strong>2,400+</strong>
              <span>Hội viên</span>
            </div>
            <div>
              <strong>50+</strong>
              <span>HLV</span>
            </div>
            <div>
              <strong>99%</strong>
              <span>Hài lòng</span>
            </div>
          </div>
        </div>

        <div className="hero-guarantee">An toàn dữ liệu và dễ mở rộng theo quy mô phòng tập</div>
      </div>
    </aside>
  );
}

export default AuthHero;
