import { members } from "../../data/ownerData";

function MembersPage() {
  return (
    <div className="owner-page">
      <div className="page-header">
        <h2 className="page-title">Members Management</h2>
        <button className="primary-btn">+ Add Member</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã HV</th>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Gói tập</th>
              <th>Ngày tham gia</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.phone}</td>
                <td>{member.packageName}</td>
                <td>{member.joinDate}</td>
                <td>
                  <span
                    className={`status-badge ${
                      member.status === "Active" ? "success" : "danger"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MembersPage;