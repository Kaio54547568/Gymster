import { staffs } from "../../data/ownerData";

function StaffPage() {
  return (
    <div className="owner-page">
      <div className="page-header">
        <h2 className="page-title">Staff Management</h2>
        <button className="primary-btn">+ Add Staff</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Ca làm</th>
              <th>Hiệu suất</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td>{staff.name}</td>
                <td>{staff.role}</td>
                <td>{staff.shift}</td>
                <td>{staff.performance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StaffPage;