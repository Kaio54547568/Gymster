import { NavLink } from "react-router";

function OwnerSidebar() {
  const navItems = [
    { to: "/owner/dashboard", label: "Dashboard" },
    { to: "/owner/members", label: "Members" },
    { to: "/owner/equipment", label: "Equipment" },
    { to: "/owner/staff", label: "Staff" },
    { to: "/owner/feedback", label: "Feedback" },
    { to: "/owner/reports", label: "Reports" },
  ];

  return (
    <aside className="owner-sidebar">
      <div className="owner-sidebar__brand">GYMSTER</div>

      <nav className="owner-sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `owner-sidebar__link ${isActive ? "active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default OwnerSidebar;