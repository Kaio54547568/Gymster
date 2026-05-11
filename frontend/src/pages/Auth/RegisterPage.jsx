import { Link, useNavigate } from "react-router";
import { useState } from "react";
import AuthHero from "../../components/auth/AuthHero";
import { registerUser } from "../../services/authService";
import "./Auth.css";

const PACKAGES = [
  {
    id: "basic",
    icon: "B",
    name: "CƠ BẢN",
    price: "299.000",
    duration: "3 tháng",
    features: ["Truy cập 24/7", "Thiết bị cơ bản", "Tủ đồ cá nhân", "1 buổi tư vấn"],
  },
  {
    id: "premium",
    icon: "P",
    name: "NÂNG CAO",
    price: "599.000",
    duration: "6 tháng",
    badge: "PHỔ BIẾN",
    features: ["Tất cả gói Cơ bản", "Lớp nhóm thoải mái", "2 buổi PT/tháng", "Đánh giá định kỳ", "Ứng dụng đầy đủ"],
  },
  {
    id: "vip",
    icon: "V",
    name: "VIP",
    price: "999.000",
    duration: "12 tháng",
    badge: "CAO CẤP",
    features: ["Tất cả gói Nâng cao", "PT không giới hạn", "Dinh dưỡng cá nhân", "Phòng VIP", "Áo tập thương hiệu"],
  },
];

const TRAINERS = [
  {
    id: 1,
    name: "Nguyễn Minh Đức",
    specialty: "Sức mạnh và thể hình",
    rating: "4.9",
    exp: "8 năm",
    clients: "120 HV",
    img: "https://images.unsplash.com/photo-1750698545009-679820502908?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 2,
    name: "Trần Thị Phương",
    specialty: "HIIT và Yoga",
    rating: "4.8",
    exp: "6 năm",
    clients: "95 HV",
    img: "https://images.unsplash.com/photo-1683889842937-bfd75dbc4a81?w=200&h=200&fit=crop&auto=format",
  },
  {
    id: 3,
    name: "Lê Thanh Bình",
    specialty: "Cardio và sức bền",
    rating: "4.9",
    exp: "10 năm",
    clients: "150 HV",
    img: "https://images.unsplash.com/photo-1652400744403-8f29705bd6a5?w=200&h=200&fit=crop&auto=format",
  },
];

const initialForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  dob: "",
  gender: "",
};

function isStrongPassword(password) {
  return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function isValidPhone(phone) {
  return /^\d{10,11}$/.test(phone);
}

function isValidBirthDate(value) {
  if (!value) {
    return false;
  }

  const birthDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  const minDate = new Date("1900-01-01T00:00:00");
  return !Number.isNaN(birthDate.getTime()) && birthDate >= minDate && birthDate < now;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [selectedPackage, setSelectedPackage] = useState("premium");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const isVip = selectedPackage === "vip";

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    if (Object.values(form).some((value) => !String(value).trim())) {
      return "Vui lòng nhập đầy đủ thông tin đăng ký.";
    }

    if (!isStrongPassword(form.password)) {
      return "Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ số và ký tự đặc biệt.";
    }

    if (form.password !== form.confirmPassword) {
      return "Mật khẩu xác nhận không khớp.";
    }

    if (!isValidPhone(form.phone)) {
      return "Số điện thoại phải gồm 10 đến 11 chữ số.";
    }

    if (!isValidBirthDate(form.dob)) {
      return "Ngày tháng năm sinh không hợp lệ.";
    }

    if (!acceptedTerms) {
      return "Vui lòng đồng ý điều khoản dịch vụ và chính sách bảo mật.";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    const result = registerUser({
      fullName: form.fullName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      dob: form.dob,
      gender: form.gender,
      membership: selectedPackage,
      trainerId: isVip ? selectedTrainer : null,
    });

    if (!result.ok) {
      setStatus({ type: "error", message: result.message });
      return;
    }

    setStatus({ type: "success", message: "Tạo tài khoản thành công. Đang chuyển sang đăng nhập..." });
    window.setTimeout(() => navigate("/login"), 700);
  };

  return (
    <main className="auth-page">
      <AuthHero />

      <section className="auth-main">
        <div className="auth-main-inner register">
          <Link className="mobile-brand" to="/" aria-label="Về trang chủ Gymster">
            <span className="mobile-brand-icon">G</span>
            <span className="mobile-brand-text">GYMSTER</span>
          </Link>

          <div className="auth-card">
            <div className="card-head">
              <div className="card-icon">G</div>
              <h1>Đăng ký hội viên</h1>
              <p>Tạo tài khoản Gymster để bắt đầu quản lý lịch tập và gói tập</p>
            </div>

            <p className="form-section-title">Thông tin cá nhân</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="fullName">Họ và tên</label>
                  <div className="field-with-icon">
                    <span className="field-icon">N</span>
                    <input id="fullName" type="text" placeholder="Nguyễn Văn A" value={form.fullName} onChange={updateField("fullName")} />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="username">Tên đăng nhập</label>
                  <div className="field-with-icon">
                    <span className="field-icon">U</span>
                    <input id="username" type="text" placeholder="nguyenvana" value={form.username} onChange={updateField("username")} autoComplete="username" />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <div className="field-with-icon">
                  <span className="field-icon">@</span>
                  <input id="email" type="email" placeholder="ten@example.com" value={form.email} onChange={updateField("email")} autoComplete="email" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="password">Mật khẩu</label>
                  <div className="field-with-icon">
                    <span className="field-icon">#</span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tạo mật khẩu"
                      value={form.password}
                      onChange={updateField("password")}
                      autoComplete="new-password"
                    />
                    <button className="field-eye" type="button" onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? "ẩn" : "xem"}
                    </button>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <div className="field-with-icon">
                    <span className="field-icon">#</span>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu"
                      value={form.confirmPassword}
                      onChange={updateField("confirmPassword")}
                      autoComplete="new-password"
                    />
                    <button className="field-eye" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                      {showConfirmPassword ? "ẩn" : "xem"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="phone">Số điện thoại</label>
                  <div className="field-with-icon">
                    <span className="field-icon">T</span>
                    <input id="phone" type="tel" placeholder="0901234567" value={form.phone} onChange={updateField("phone")} autoComplete="tel" />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="dob">Ngày sinh</label>
                  <div className="field-with-icon">
                    <span className="field-icon">D</span>
                    <input id="dob" type="date" value={form.dob} onChange={updateField("dob")} />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="gender">Giới tính</label>
                <div className="field-with-icon">
                  <span className="field-icon">G</span>
                  <select id="gender" value={form.gender} onChange={updateField("gender")}>
                    <option value="" disabled>
                      Chọn giới tính
                    </option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="package-divider">Chọn gói tập</div>
              <div className="package-grid">
                {PACKAGES.map((pkg) => {
                  const active = selectedPackage === pkg.id;
                  return (
                    <button
                      className={`package-card ${active ? "active" : ""}`}
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.badge && <span className="package-badge">{pkg.badge}</span>}
                      <div className="pkg-top">
                        <span>{pkg.icon}</span>
                        {active && <span className="pkg-check">Chọn</span>}
                      </div>
                      <h3>{pkg.name}</h3>
                      <div className="pkg-price">
                        {pkg.price}
                        <span>đ</span>
                      </div>
                      <div className="pkg-duration">{pkg.duration}</div>
                      <ul className="pkg-features">
                        {pkg.features.map((feature) => (
                          <li key={feature}>- {feature}</li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              {isVip && (
                <div className="vip-section">
                  <div className="package-divider">Chọn huấn luyện viên</div>
                  <div className="trainer-grid">
                    {TRAINERS.map((trainer) => {
                      const active = selectedTrainer === trainer.id;
                      return (
                        <button
                          className={`trainer-card ${active ? "active" : ""}`}
                          key={trainer.id}
                          type="button"
                          onClick={() => setSelectedTrainer(active ? null : trainer.id)}
                        >
                          <div className="trainer-avatar">
                            <img src={trainer.img} alt={trainer.name} />
                          </div>
                          <div className="trainer-name">{trainer.name}</div>
                          <div className="trainer-meta">{trainer.specialty}</div>
                          <div className="rating">5 sao - {trainer.rating}</div>
                          <div className="trainer-small">
                            {trainer.exp} - {trainer.clients}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="register-submit-card">
                <label className="check-field" htmlFor="terms">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                  />
                  <span>
                    Tôi đồng ý với <span className="switch-link">Điều khoản dịch vụ</span> và{" "}
                    <span className="switch-link">Chính sách bảo mật</span> của Gymster
                  </span>
                </label>

                {status.message && (
                  <p className={`auth-message ${status.type}`}>{status.message}</p>
                )}

                <button className="auth-submit" type="submit">
                  Tạo tài khoản
                </button>

                <p className="switch-text">
                  Đã có tài khoản?{" "}
                  <Link className="switch-link" to="/login">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <button className="back-home" type="button" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
