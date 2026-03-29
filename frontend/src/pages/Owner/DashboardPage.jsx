import { dashboardStats } from "../../data/ownerData";

function DashboardPage() {
  const cards = [
    { label: "Tổng hội viên", value: dashboardStats.totalMembers },
    { label: "Gói tập đang hoạt động", value: dashboardStats.activePackages },
    { label: "Tổng thiết bị", value: dashboardStats.totalEquipment },
    { label: "Nhân sự", value: dashboardStats.staffCount },
    {
      label: "Doanh thu tháng",
      value: dashboardStats.monthlyRevenue.toLocaleString("vi-VN") + " đ",
    },
    { label: "Phản hồi chờ xử lý", value: dashboardStats.pendingFeedback },
  ];

  return (
    <div className="owner-page">
      <h2 className="page-title">Dashboard</h2>

      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <p className="stat-card__label">{card.label}</p>
            <h3 className="stat-card__value">{card.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;