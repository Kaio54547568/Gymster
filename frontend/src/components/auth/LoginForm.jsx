function LoginForm({ onSubmit, onSwitchRegister }) {
  return (
    <form className="auth-form" autoComplete="on" onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="loginUsername">Tên đăng nhập</label>
        <input
          id="loginUsername"
          name="loginUsername"
          type="text"
          placeholder="Nhập tên đăng nhập"
          autoComplete="username"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="loginPassword">Mật khẩu</label>
        <input
          id="loginPassword"
          name="loginPassword"
          type="password"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          required
        />
      </div>

      <div className="form-options">
        <label className="remember" htmlFor="rememberLogin">
          <input id="rememberLogin" type="checkbox" />
          <span>Ghi nhớ đăng nhập</span>
        </label>
        <a href="#" className="link-text">
          Quên mật khẩu?
        </a>
      </div>

      <button type="submit" className="submit-btn">
        Đăng nhập
      </button>

      <p className="switch-text">
        Chưa có tài khoản?{" "}
        <button type="button" className="switch-link" onClick={onSwitchRegister}>
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}

export default LoginForm;