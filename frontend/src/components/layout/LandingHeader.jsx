function LandingHeader({ onContactClick }) {
  return (
    <header className="hero-header-wrap">
      <div className="hero-header">
        <div className="brand">
          <div className="brand-dot"></div>
          <span>GYMSTER</span>
        </div>

        <nav className="nav">
          <a href="#">Home</a>
          <a href="#">Pages</a>
          <a href="#">Portfolio</a>
          <a href="#">Blog</a>
        </nav>

        <button className="top-btn" type="button" onClick={onContactClick}>
          Get In Touch
        </button>
      </div>
    </header>
  );
}

export default LandingHeader;