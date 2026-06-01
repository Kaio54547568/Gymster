import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { completeOAuthLogin, getUserHome } from "../../services/authService";
import "./Auth.css";

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing social login...");

  useEffect(() => {
    let isActive = true;

    async function completeLogin() {
      const result = await completeOAuthLogin();
      if (!isActive) return;

      if (!result.ok) {
        setMessage(result.message);
        window.setTimeout(() => navigate("/login", { replace: true }), 1800);
        return;
      }

      if (result.needsProfileCompletion) {
        setMessage("Please complete your Gymster profile...");
        window.setTimeout(() => navigate("/auth/complete-profile", { replace: true }), 300);
        return;
      }

      setMessage("Login successful. Opening your dashboard...");
      window.setTimeout(() => navigate(getUserHome(result.user), { replace: true }), 300);
    }

    completeLogin();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  return (
    <main className="auth-page">
      <section className="auth-main auth-callback-main">
        <div className="auth-card auth-callback-card">
          <div className="card-head">
            <div className="card-icon">G</div>
            <h1>Social Login</h1>
            <p>{message}</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AuthCallbackPage;
