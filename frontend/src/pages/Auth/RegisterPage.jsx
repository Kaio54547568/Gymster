import { Link, useNavigate } from "react-router";
import { useState } from "react";
import AuthHero from "../../components/auth/AuthHero";
import ThemeToggle from "../../components/theme/ThemeToggle";
import { setCurrentUser, signInWithOAuthProvider } from "../../services/authService";
import { resetOnboardingState } from "../../services/onboardingService";
import { createPendingMemberAccount } from "../../services/userApi";
import "./Auth.css";

const initialForm = {
  firstName: "",
  lastName: "",
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/.test(username);
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    if (Object.values(form).some((value) => !String(value).trim())) {
      return "Please enter all required account information.";
    }

    if (!isValidEmail(form.email)) {
      return "Please enter a valid email address.";
    }

    if (!isValidUsername(form.username.trim())) {
      return "Username must be 6-30 characters, use only A-Z, a-z, 0-9, _, ., -, and cannot start or end with _, ., or -.";
    }

    if (!isStrongPassword(form.password)) {
      return "Password must be at least 8 characters and include an uppercase letter, a number, and a special character.";
    }

    if (form.password !== form.confirmPassword) {
      return "Password confirmation does not match.";
    }

    if (!isValidPhone(form.phone)) {
      return "Phone number must contain 10 to 11 digits.";
    }

    if (!isValidBirthDate(form.dob)) {
      return "Date of birth is not valid.";
    }

    if (!acceptedTerms) {
      return "Please agree to the terms of service and privacy policy.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setIsSubmitting(true);

    const supabaseResult = await createPendingMemberAccount({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      dob: form.dob,
      gender: form.gender,
    });

    setIsSubmitting(false);

    if (!supabaseResult.ok) {
      setStatus({ type: "error", message: supabaseResult.message });
      return;
    }

    setCurrentUser(supabaseResult.user);
    resetOnboardingState();
    setStatus({ type: "success", message: "Account created. Opening member setup..." });
    window.setTimeout(() => navigate("/member", { replace: true }), 700);
  };

  const handleOAuthRegister = async (provider) => {
    setStatus({ type: "", message: "" });

    const result = await signInWithOAuthProvider(provider);
    if (!result.ok) {
      setStatus({ type: "error", message: result.message });
    }
  };

  return (
    <main className="auth-page">
      <ThemeToggle className="auth-theme-toggle" />
      <AuthHero />

      <section className="auth-main">
        <div className="auth-main-inner register">
          <Link className="mobile-brand" to="/" aria-label="Go to Gymster home">
            <span className="mobile-brand-icon">G</span>
            <span className="mobile-brand-text">GYMSTER</span>
          </Link>

          <div className="auth-card">
            <div className="card-head">
              <div className="card-icon">G</div>
              <h1>Create Member Account</h1>
              <p>Create your Gymster account first, then complete package, trainer, and payment setup in onboarding.</p>
            </div>

            <p className="form-section-title">Account Information</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="firstName">First name</label>
                  <div className="field-with-icon">
                    <span className="field-icon">N</span>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Alex"
                      value={form.firstName}
                      onChange={updateField("firstName")}
                      autoComplete="given-name"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">Last name</label>
                  <div className="field-with-icon">
                    <span className="field-icon">N</span>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Nguyen"
                      value={form.lastName}
                      onChange={updateField("lastName")}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="username">Username</label>
                  <div className="field-with-icon">
                    <span className="field-icon">U</span>
                    <input
                      id="username"
                      type="text"
                      placeholder="alex-nguyen01"
                      value={form.username}
                      onChange={updateField("username")}
                      autoComplete="username"
                      maxLength={30}
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>
                <div className="field-with-icon">
                  <span className="field-icon">@</span>
                  <input id="email" type="email" placeholder="member@example.com" value={form.email} onChange={updateField("email")} autoComplete="email" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <div className="field-with-icon">
                    <span className="field-icon">#</span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={form.password}
                      onChange={updateField("password")}
                      autoComplete="new-password"
                    />
                    <button className="field-eye" type="button" onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? "hide" : "show"}
                    </button>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div className="field-with-icon">
                    <span className="field-icon">#</span>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={updateField("confirmPassword")}
                      autoComplete="new-password"
                    />
                    <button className="field-eye" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                      {showConfirmPassword ? "hide" : "show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="phone">Phone number</label>
                  <div className="field-with-icon">
                    <span className="field-icon">T</span>
                    <input id="phone" type="tel" placeholder="0901234567" value={form.phone} onChange={updateField("phone")} autoComplete="tel" />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="dob">Date of birth</label>
                  <div className="field-with-icon">
                    <span className="field-icon">D</span>
                    <input id="dob" type="date" value={form.dob} onChange={updateField("dob")} />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="gender">Gender</label>
                <div className="field-with-icon">
                  <span className="field-icon">G</span>
                  <select id="gender" value={form.gender} onChange={updateField("gender")}>
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="register-submit-card">
                <label className="check-field" htmlFor="terms">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                  />
                  <span>
                    I agree to Gymster's <span className="switch-link">Terms of Service</span> and{" "}
                    <span className="switch-link">Privacy Policy</span>.
                  </span>
                </label>

                {status.message && (
                  <p className={`auth-message ${status.type}`}>{status.message}</p>
                )}

                <button className="auth-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>

                <div className="divider">or</div>

                <div className="social-grid">
                  <button className="social-btn" type="button" onClick={() => handleOAuthRegister("google")}>
                    Google
                  </button>
                  <button className="social-btn" type="button" onClick={() => handleOAuthRegister("facebook")}>
                    Facebook
                  </button>
                </div>

                <p className="switch-text">
                  Already have an account?{" "}
                  <Link className="switch-link" to="/login">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <button className="back-home" type="button" onClick={() => navigate("/")}>
            Back to home
          </button>
        </div>
      </section>
    </main>
  );
}

export default RegisterPage;
