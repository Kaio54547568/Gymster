import { revenueData } from "../../data/ownerData";

function ReportsPage() {
  return (
    <div className="owner-page">
      <h2 className="page-title">Reports</h2>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tháng</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {revenueData.map((item) => (
              <tr key={item.period}>
                <td>{item.period}</td>
                <td>{item.revenue.toLocaleString("vi-VN")} đ</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportsPage;