import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthHero from "../../components/auth/AuthHero";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { requestPasswordResetCode, verifyPasswordResetCode, resetPasswordWithCode } from "../../services/userApi";
import "./Auth.css";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("request"); // 'request' | 'reset'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [codeSent, setCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus({ type: "error", message: "Vui lòng nhập địa chỉ email." });
      return;
    }

    setIsSendingCode(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await requestPasswordResetCode(email.trim());
      if (result.ok) {
        setCodeSent(true);
        const devMsg = result.devCode ? ` (Mã thử nghiệm: ${result.devCode})` : "";
        setStatus({
          type: "success",
          message: (result.message || "Mã xác thực đã được gửi.") + devMsg,
        });
      } else {
        setStatus({ type: "error", message: result.message || "Không thể gửi mã xác thực." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Đã xảy ra lỗi, vui lòng thử lại." });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      setStatus({ type: "error", message: "Vui lòng nhập email và mã xác thực." });
      return;
    }
    if (code.trim().length !== 6) {
      setStatus({ type: "error", message: "Mã xác thực phải gồm 6 chữ số." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await verifyPasswordResetCode(email.trim(), code.trim());
      if (result.ok) {
        setStatus({ type: "success", message: "Xác thực thành công. Vui lòng nhập mật khẩu mới." });
        setStage("reset");
      } else {
        setStatus({ type: "error", message: result.message || "Mã xác thực không chính xác." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Đã xảy ra lỗi khi xác thực mã." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setStatus({ type: "error", message: "Mật khẩu mới phải từ 6 ký tự trở lên." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", message: "Mật khẩu xác nhận không trùng khớp." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await resetPasswordWithCode(email.trim(), code.trim(), newPassword);
      if (result.ok) {
        setStatus({ type: "success", message: "Đổi mật khẩu thành công. Đang chuyển hướng về trang đăng nhập..." });
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setStatus({ type: "error", message: result.message || "Không thể đổi mật khẩu." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Đã xảy ra lỗi khi đặt lại mật khẩu." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <ThemeToggle className="auth-theme-toggle" />
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
              <h1>
                {stage === "request" ? "Quên mật khẩu" : "Đặt lại mật khẩu"}
              </h1>
              <p>
                {stage === "request"
                  ? "Nhập email của bạn để nhận mã xác thực đặt lại mật khẩu"
                  : "Nhập mật khẩu mới cho tài khoản của bạn"}
              </p>
            </div>

            {stage === "request" ? (
              <form className="auth-form" onSubmit={handleVerifyCode}>
                <div className="form-field">
                  <label htmlFor="email">Địa chỉ Email</label>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div className="field-with-icon" style={{ flex: 1 }}>
                      <span className="field-icon">@</span>
                      <input
                        id="email"
                        type="email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setStatus({ type: "", message: "" });
                        }}
                        disabled={codeSent || isSendingCode || isSubmitting}
                        required
                        style={{ paddingRight: "14px" }}
                      />
                    </div>
                    <button
                      type="button"
                      className="social-btn"
                      style={{
                        minWidth: "100px",
                        minHeight: "48px",
                        borderColor: codeSent ? "var(--border)" : "var(--primary)",
                        color: codeSent ? "var(--text-muted)" : "#ff3b3b",
                        fontWeight: "800",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        cursor: (isSendingCode || codeSent) ? "not-allowed" : "pointer"
                      }}
                      onClick={handleSendCode}
                      disabled={isSendingCode || codeSent}
                    >
                      {isSendingCode ? "Đang gửi..." : codeSent ? "Đã gửi" : "Gửi mã"}
                    </button>
                  </div>
                </div>

                {codeSent && (
                  <div className="form-field" style={{ marginTop: "16px" }}>
                    <label htmlFor="verificationCode">Mã xác thực (6 chữ số)</label>
                    <div className="field-with-icon">
                      <span className="field-icon">#</span>
                      <input
                        id="verificationCode"
                        className="verification-code-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setStatus({ type: "", message: "" });
                        }}
                        autoComplete="one-time-code"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {status.message && (
                  <p className={`auth-message ${status.type}`} style={{ marginTop: "16px" }}>
                    {status.message}
                  </p>
                )}

                {codeSent && (
                  <button className="auth-submit" type="submit" style={{ marginTop: "24px" }} disabled={isSubmitting}>
                    {isSubmitting ? "Đang xác nhận..." : "Tiếp tục"}
                  </button>
                )}
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="form-field">
                  <label htmlFor="newPassword">Mật khẩu mới</label>
                  <div className="field-with-icon">
                    <span className="field-icon">#</span>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setStatus({ type: "", message: "" });
                      }}
                      required
                      disabled={isSubmitting}
                      autoComplete="new-password"
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

                <div className="form-field" style={{ marginTop: "16px" }}>
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                  <div className="field-with-icon">
                    <span className="field-icon">#</span>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setStatus({ type: "", message: "" });
                      }}
                      required
                      disabled={isSubmitting}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {status.message && (
                  <p className={`auth-message ${status.type}`} style={{ marginTop: "16px" }}>
                    {status.message}
                  </p>
                )}

                <button className="auth-submit" type="submit" style={{ marginTop: "24px" }} disabled={isSubmitting}>
                  {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
              </form>
            )}

            <p className="switch-text">
              Quay lại{" "}
              <Link className="switch-link" to="/login">
                Đăng nhập
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

export default ForgotPasswordPage;
