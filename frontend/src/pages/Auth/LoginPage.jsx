import { Link, useNavigate } from "react-router";
import { useState, useRef } from "react";
import AuthHero from "../../components/auth/AuthHero";
import ThemeToggle from "../../components/theme/ThemeToggle";
import LanguageToggle from "../../components/theme/LanguageToggle";
import { useRoleTranslationEffect } from "../../roles/shared/LanguageContext";
import { getUserHome, loginUser, signInWithOAuthProvider } from "../../services/authService";
import "./Auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "", rememberLogin: false });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setStatus({ type: "", message: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.identifier.trim() || !form.password) {
      setStatus({ type: "error", message: "Vui lòng nhập tên đăng nhập/email và mật khẩu." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "info", message: "Đang xác thực tài khoản..." });

    try {
      const result = await loginUser(form.identifier, form.password, {
        rememberLogin: form.rememberLogin,
      });
      if (!result.ok) {
        setStatus({ type: "error", message: result.message });
        return;
      }

      setStatus({ type: "success", message: `Đăng nhập thành công với tài khoản ${result.user.username}.` });
      navigate(getUserHome(result.user), { replace: true });
    } catch {
      setStatus({ type: "error", message: "Không thể kết nối máy chủ. Vui lòng thử lại." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setStatus({ type: "", message: "" });

    const result = await signInWithOAuthProvider(provider, {
      rememberLogin: form.rememberLogin,
    });

    if (!result.ok) {
      setStatus({ type: "error", message: result.message });
    }
  };

  const pageRef = useRef(null);
  useRoleTranslationEffect(pageRef);

  return (
    <main className="auth-page" ref={pageRef}>
      <div className="auth-theme-toggle" style={{ display: "flex", gap: "10px" }}>
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <AuthHero />

      <section className="auth-main">
        <div className="auth-main-inner">
          <Link className="mobile-brand" to="/" aria-label="Về trang chủ Gymster">
            <span className="mobile-brand-icon">
              <img src="/assets/brand/gymster-icon.svg" alt="" />
            </span>
            <span className="mobile-brand-text">GYMSTER</span>
          </Link>

          <div className="auth-card">
            <div className="card-head">
              <div className="card-icon">
                <img src="/assets/brand/gymster-icon.svg" alt="Gymster" />
              </div>
              <h1>Chào mừng trở lại</h1>
              <p>Đăng nhập bằng tên đăng nhập hoặc email Gymster của bạn</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="identifier">Tên đăng nhập hoặc email</label>
                <div className="field-with-icon">
                  <span className="field-icon">@</span>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="Tên đăng nhập hoặc email"
                    value={form.identifier}
                    onChange={updateField("identifier")}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="field-with-icon">
                  <span className="field-icon">#</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={updateField("password")}
                    autoComplete="current-password"
                  />
                  <button
                    className="field-eye"
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? "Ẩn" : "Xem"}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="check-field" htmlFor="remember">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={form.rememberLogin}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, rememberLogin: event.target.checked }));
                    }}
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                >
                  Quên mật khẩu?
                </button>
              </div>

              {status.message && (
                <p className={`auth-message ${status.type}`}>{status.message}</p>
              )}

              <button className="auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            <div className="divider">hoặc</div>

            <div className="social-grid">
              <button className="social-btn" type="button" onClick={() => handleOAuthLogin("google")}>
                Google
              </button>
              <button className="social-btn" type="button" onClick={() => handleOAuthLogin("facebook")}>
                Facebook
              </button>
            </div>

            <p className="switch-text">
              Chưa có tài khoản?{" "}
              <Link className="switch-link" to="/register">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <button className="back-home" type="button" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
