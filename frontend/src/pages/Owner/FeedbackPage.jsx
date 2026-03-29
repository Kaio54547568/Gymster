import { feedbacks } from "../../data/ownerData";

function FeedbackPage() {
  return (
    <div className="owner-page">
      <h2 className="page-title">Feedback Management</h2>

      <div className="feedback-grid">
        {feedbacks.map((item) => (
          <div key={item.id} className="feedback-card">
            <div className="feedback-card__top">
              <strong>{item.memberName}</strong>
              <span
                className={`status-badge ${
                  item.status === "Resolved" ? "success" : "warning"
                }`}
              >
                {item.status}
              </span>
            </div>

            <p className="feedback-card__target">{item.target}</p>
            <p className="feedback-card__content">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeedbackPage;