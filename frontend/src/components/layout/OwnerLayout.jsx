import { Outlet } from "react-router";
import OwnerSidebar from "./OwnerSidebar";

function OwnerLayout() {
  return (
    <div className="owner-layout">
      <OwnerSidebar />

      <div className="owner-layout__content">
        <header className="owner-topbar">
          <div>
            <h1 className="owner-topbar__title">Owner Panel</h1>
            <p className="owner-topbar__subtitle">
              Quản lý toàn bộ hệ thống phòng gym
            </p>
          </div>
        </header>

        <main className="owner-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default OwnerLayout;