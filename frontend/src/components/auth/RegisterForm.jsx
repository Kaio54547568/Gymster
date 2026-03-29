function RegisterForm({ onSubmit, onSwitchLogin }) {
  return (
    <form className="auth-form" autoComplete="on" onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="fullName">Họ và tên</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Nhập họ và tên"
          autoComplete="name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Nhập email"
          autoComplete="email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="registerUsername">Tên đăng nhập</label>
        <input
          id="registerUsername"
          name="registerUsername"
          type="text"
          placeholder="Tạo tên đăng nhập"
          autoComplete="username"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="registerPassword">Mật khẩu</label>
        <input
          id="registerPassword"
          name="registerPassword"
          type="password"
          placeholder="Tạo mật khẩu"
          autoComplete="new-password"
          required
        />
      </div>

      <button type="submit" className="submit-btn">
        Đăng ký
      </button>

      <p className="switch-text">
        Đã có tài khoản?{" "}
        <button type="button" className="switch-link" onClick={onSwitchLogin}>
          Đăng nhập
        </button>
      </p>
    </form>
  );
}

export default RegisterForm;