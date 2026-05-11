import { Link } from "react-router";

function AuthBrand() {
  return (
    <Link className="auth-brand" to="/login" aria-label="Gymster home">
      <span className="auth-brand-mark" aria-hidden="true">
        G
      </span>
      <span className="auth-brand-text">GYMSTER</span>
    </Link>
  );
}

export default AuthBrand;
