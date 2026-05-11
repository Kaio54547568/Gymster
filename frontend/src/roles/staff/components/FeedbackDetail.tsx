import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MessageSquare, User, Calendar, CheckCircle, Image as ImageIcon } from 'lucide-react';

export function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('Pending');
  const [response, setResponse] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const feedback = {
    feedbackId: id || 'FB001',
    memberId: 'M00123',
    memberName: 'Nguyễn Hoàng Anh',
    memberPhone: '0912345678',
    content: 'Máy chạy bộ số 5 bị lỗi, dừng đột ngột khi đang tập. Rất nguy hiểm và cần được kiểm tra sớm.',
    date: '2026-05-06 14:30',
    status: 'Pending',
    priority: 'High',
    category: 'Equipment Issue',
    imageAttached: true,
    resolutionHistory: [
      { date: '2026-05-06 15:00', action: 'Feedback received', staff: 'System' },
      { date: '2026-05-06 15:30', action: 'Assigned to technical team', staff: 'Nguyễn Staff' }
    ]
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/staff/feedback');
    }, 2000);
  };

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/staff/feedback')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feedback List
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Feedback Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-destructive rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,0,0,0.3)]">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Feedback Detail</h1>
                    <p className="text-sm text-muted-foreground">ID: <span className="text-primary font-mono">{feedback.feedbackId}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-destructive/20 text-destructive rounded-full text-sm font-medium">
                    {feedback.priority}
                  </span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-medium">
                    {status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{feedback.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">{feedback.date}</p>
                </div>
              </div>
            </div>

            {/* Member Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Member Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Member ID</p>
                  <p className="font-medium font-mono">{feedback.memberId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{feedback.memberName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{feedback.memberPhone}</p>
                </div>
              </div>
            </div>

            {/* Feedback Content */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Complaint Content</h3>
              <p className="text-foreground leading-relaxed mb-4">{feedback.content}</p>

              {feedback.imageAttached && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Attached Image
                  </p>
                  <div className="w-full h-64 bg-secondary/30 rounded-lg border border-border flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Treadmill #5 Error Image</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Staff Response */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Staff Response</h3>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full bg-input px-4 py-3 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[150px]"
                placeholder="Enter your response to the member..."
              />
            </div>

            {/* Update Status */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Update Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Pending', 'Processing', 'Resolved', 'Rejected'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatus(st)}
                    className={`px-4 py-3 rounded-lg font-medium border-2 transition-all ${
                      status === st
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-primary to-destructive text-white px-6 py-3 rounded-lg font-medium hover:shadow-[0_0_30px_rgba(255,0,0,0.4)] transition-all"
              >
                Save Response & Update Status
              </button>
              <button
                onClick={() => navigate('/staff/feedback')}
                className="px-8 py-3 border border-border hover:bg-secondary rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right - Resolution History */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Resolution Timeline
              </h3>
              <div className="space-y-4">
                {feedback.resolutionHistory.map((event, index) => (
                  <div key={index} className="relative pl-6 pb-4 border-l-2 border-primary/30 last:border-transparent last:pb-0">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(255,0,0,0.5)]"></div>
                    <p className="text-xs text-muted-foreground mb-1">{event.date}</p>
                    <p className="font-medium text-sm">{event.action}</p>
                    <p className="text-xs text-muted-foreground">by {event.staff}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border border-primary rounded-xl p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(255,0,0,0.5)]">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-destructive rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Feedback Updated!</h3>
                <p className="text-muted-foreground">Response saved and status updated successfully</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
