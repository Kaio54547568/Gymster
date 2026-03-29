import { equipments } from "../../data/ownerData";

function EquipmentPage() {
  return (
    <div className="owner-page">
      <div className="page-header">
        <h2 className="page-title">Equipment Management</h2>
        <button className="primary-btn">+ Add Equipment</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã TB</th>
              <th>Tên thiết bị</th>
              <th>Số lượng</th>
              <th>Ngày nhập</th>
              <th>Bảo hành</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.importedDate}</td>
                <td>{item.warranty}</td>
                <td>
                  <span
                    className={`status-badge ${
                      item.status === "Good" ? "success" : "warning"
                    }`}
                  >
                    {item.status}
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

export default EquipmentPage;