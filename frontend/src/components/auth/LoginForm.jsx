function LoginForm({ onSubmit }) {
  return (
    <form className="auth-form" autoComplete="on" onSubmit={onSubmit}>
      <div className="form-field">
        <label htmlFor="loginEmail">Email hoặc tên đăng nhập</label>
        <input
          id="loginEmail"
          name="loginEmail"
          type="text"
          placeholder="member@gymster.vn"
          autoComplete="username"
          required
        />
      </div>

      <div className="form-field">
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

      <div className="form-row">
        <label className="check-field" htmlFor="rememberLogin">
          <input id="rememberLogin" name="rememberLogin" type="checkbox" />
          <span>Ghi nhớ tôi</span>
        </label>
        <a className="text-link" href="#forgot-password">
          Quên mật khẩu?
        </a>
      </div>

      <button className="auth-submit" type="submit">
        Đăng nhập
      </button>
    </form>
  );
}

export default LoginForm;
