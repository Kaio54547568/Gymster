function RegisterForm({ onSubmit }) {
  return (
    <form className="auth-form" autoComplete="on" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="fullName">Họ và tên</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="phone">Số điện thoại</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="0901 234 567"
            autoComplete="tel"
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="registerEmail">Email</label>
        <input
          id="registerEmail"
          name="registerEmail"
          type="email"
          placeholder="member@gymster.vn"
          autoComplete="email"
          required
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
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

        <div className="form-field">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="membership">Gói tập</label>
        <select id="membership" name="membership" defaultValue="premium">
          <option value="basic">Cơ bản - 299.000đ/tháng</option>
          <option value="premium">Nâng cao - 599.000đ/tháng</option>
          <option value="vip">VIP - 999.000đ/tháng</option>
        </select>
      </div>

      <label className="check-field check-field-wide" htmlFor="acceptTerms">
        <input id="acceptTerms" name="acceptTerms" type="checkbox" required />
        <span>Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật.</span>
      </label>

      <button className="auth-submit" type="submit">
        Tạo tài khoản
      </button>
    </form>
  );
}

export default RegisterForm;
