import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  completeOAuthProfile,
  getPendingOAuthProfile,
  getUserHome,
} from "../../services/authService";
import "./Auth.css";

const initialForm = {
  email: "",
  firstName: "",
  lastName: "",
  username: "",
  phone: "",
  dob: "",
  gender: "",
};

function isValidUsername(username) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/.test(username);
}

function isValidPhone(phone) {
  return /^\d{10,11}$/.test(phone);
}

function isValidBirthDate(value) {
  if (!value) return false;

  const birthDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  const minDate = new Date("1900-01-01T00:00:00");
  return !Number.isNaN(birthDate.getTime()) && birthDate >= minDate && birthDate < now;
}

function SocialProfilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      const result = await getPendingOAuthProfile();
      if (!isActive) return;

      if (!result.ok) {
        setStatus({ type: "error", message: result.message });
        setIsLoading(false);
        window.setTimeout(() => navigate("/login", { replace: true }), 1800);
        return;
      }

      if (result.user) {
        navigate(getUserHome(result.user), { replace: true });
        return;
      }

      setForm((current) => ({ ...current, ...result.profile }));
      setIsLoading(false);
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setStatus({ type: "", message: "" });
  };

  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.username.trim() || !form.phone.trim() || !form.dob || !form.gender) {
      return "Please enter all required account information.";
    }

    if (!isValidUsername(form.username.trim())) {
      return "Username must be 6-30 characters, use only A-Z, a-z, 0-9, _, ., -, and cannot start or end with _, ., or -.";
    }

    if (!isValidPhone(form.phone.trim())) {
      return "Phone number must contain 10 to 11 digits.";
    }

    if (!isValidBirthDate(form.dob)) {
      return "Date of birth is not valid.";
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
    const result = await completeOAuthProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      username: form.username.trim(),
      phone: form.phone.trim(),
      dob: form.dob,
      gender: form.gender,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setStatus({ type: "error", message: result.message });
      return;
    }

    setStatus({ type: "success", message: "Profile completed. Opening your dashboard..." });
    window.setTimeout(() => navigate(getUserHome(result.user), { replace: true }), 500);
  };

  return (
    <main className="auth-page">
      <section className="auth-main">
        <div className="auth-main-inner register">
          <div className="auth-card">
            <div className="card-head">
              <div className="card-icon">G</div>
              <h1>Complete Profile</h1>
              <p>Fill in the missing details so Gymster can finish creating your account.</p>
            </div>

            {isLoading ? (
              <p className="auth-message success">Loading social profile...</p>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="socialEmail">Email</label>
                  <div className="field-with-icon">
                    <span className="field-icon">@</span>
                    <input id="socialEmail" type="email" value={form.email} disabled />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="socialFirstName">First name</label>
                    <div className="field-with-icon">
                      <span className="field-icon">N</span>
                      <input id="socialFirstName" type="text" value={form.firstName} onChange={updateField("firstName")} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="socialLastName">Last name</label>
                    <div className="field-with-icon">
                      <span className="field-icon">N</span>
                      <input id="socialLastName" type="text" value={form.lastName} onChange={updateField("lastName")} />
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="socialUsername">Username</label>
                    <div className="field-with-icon">
                      <span className="field-icon">U</span>
                      <input id="socialUsername" type="text" value={form.username} onChange={updateField("username")} maxLength={30} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="socialPhone">Phone number</label>
                    <div className="field-with-icon">
                      <span className="field-icon">T</span>
                      <input id="socialPhone" type="tel" value={form.phone} onChange={updateField("phone")} />
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="socialDob">Date of birth</label>
                    <div className="field-with-icon">
                      <span className="field-icon">D</span>
                      <input id="socialDob" type="date" value={form.dob} onChange={updateField("dob")} />
                    </div>
                  </div>
                  <div className="form-field">
                    <label htmlFor="socialGender">Gender</label>
                    <div className="field-with-icon">
                      <span className="field-icon">G</span>
                      <select id="socialGender" value={form.gender} onChange={updateField("gender")}>
                        <option value="" disabled>
                          Select gender
                        </option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {status.message && (
                  <p className={`auth-message ${status.type}`}>{status.message}</p>
                )}

                <button className="auth-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving Profile..." : "Continue"}
                </button>
              </form>
            )}
          </div>

          <button className="back-home" type="button" onClick={() => navigate("/login")}>
            Back to login
          </button>
        </div>
      </section>
    </main>
  );
}

export default SocialProfilePage;
