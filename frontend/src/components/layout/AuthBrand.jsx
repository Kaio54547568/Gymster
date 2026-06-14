import { Link } from "react-router";

function AuthBrand() {
  return (
    <Link className="auth-brand" to="/login" aria-label="Gymster home">
      <span className="auth-brand-mark" aria-hidden="true">
        <img src="/assets/brand/gymster-icon.svg" alt="" />
      </span>
      <span className="auth-brand-text">GYMSTER</span>
    </Link>
  );
}

export default AuthBrand;
