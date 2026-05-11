import { useState } from 'react';
import { Link } from 'react-router';
import { MessageSquare, Eye, Filter, AlertCircle } from 'lucide-react';

interface Feedback {
  feedbackId: string;
  memberId: string;
  memberName: string;
  content: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Resolved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High';
}

export function FeedbackManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const feedbacks: Feedback[] = [
    {
      feedbackId: 'FB001',
      memberId: 'M00123',
      memberName: 'Nguyễn Hoàng Anh',
      content: 'Máy chạy bộ số 5 bị lỗi, dừng đột ngột khi đang tập',
      date: '2026-05-06',
      status: 'Pending',
      priority: 'High'
    },
    {
      feedbackId: 'FB002',
      memberId: 'M00124',
      memberName: 'Trần Minh Đức',
      content: 'Điều hòa phòng gym quá lạnh, mong điều chỉnh nhiệt độ',
      date: '2026-05-05',
      status: 'Processing',
      priority: 'Medium'
    },
    {
      feedbackId: 'FB003',
      memberId: 'M00125',
      memberName: 'Lê Quốc Bảo',
      content: 'PT Minh Tuấn hỗ trợ rất tốt và chuyên nghiệp',
      date: '2026-05-04',
      status: 'Resolved',
      priority: 'Low'
    },
    {
      feedbackId: 'FB004',
      memberId: 'M00126',
      memberName: 'Phạm Thị Mai',
      content: 'Tủ khóa bị hỏng, không mở được',
      date: '2026-05-03',
      status: 'Processing',
      priority: 'High'
    },
    {
      feedbackId: 'FB005',
      memberId: 'M00127',
      memberName: 'Võ Văn Nam',
      content: 'Muốn có thêm lớp Yoga buổi tối',
      date: '2026-05-02',
      status: 'Rejected',
      priority: 'Low'
    }
  ];

  const filteredFeedback = statusFilter === 'all'
    ? feedbacks
    : feedbacks.filter(fb => fb.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-destructive/20 text-destructive border-destructive/30',
      Processing: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      Resolved: 'bg-primary/20 text-primary border-primary/30',
      Rejected: 'bg-muted text-muted-foreground border-muted'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      High: 'bg-destructive/20 text-destructive',
      Medium: 'bg-yellow-500/20 text-yellow-500',
      Low: 'bg-muted text-muted-foreground'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBjb21tdW5pdHl8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gym Community"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div>
              <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">QUẢN LÝ PHẢN HỒI</p>
              <h1 className="text-6xl font-black tracking-tight mb-4">
                <span className="text-primary">PHẢN HỒI</span>
                <br />
                <span className="text-white">HỘI VIÊN</span>
              </h1>
              <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                Tiếp nhận, xử lý và theo dõi phản hồi từ hội viên, quản lý khiếu nại và cải thiện chất lượng dịch vụ.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending', count: feedbacks.filter(f => f.status === 'Pending').length, color: 'text-destructive' },
            { label: 'Processing', count: feedbacks.filter(f => f.status === 'Processing').length, color: 'text-yellow-500' },
            { label: 'Resolved', count: feedbacks.filter(f => f.status === 'Resolved').length, color: 'text-primary' },
            { label: 'Rejected', count: feedbacks.filter(f => f.status === 'Rejected').length, color: 'text-muted-foreground' }
          ].map((stat, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-medium">Filter by Status</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'Pending', 'Processing', 'Resolved', 'Rejected'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                    : 'bg-input hover:bg-secondary'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 font-medium">Feedback ID</th>
                  <th className="text-left px-6 py-4 font-medium">Member</th>
                  <th className="text-left px-6 py-4 font-medium">Content</th>
                  <th className="text-left px-6 py-4 font-medium">Date</th>
                  <th className="text-left px-6 py-4 font-medium">Priority</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((feedback, index) => (
                  <tr
                    key={feedback.feedbackId}
                    className={`border-b border-border hover:bg-secondary/20 transition-colors ${
                      index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-primary">{feedback.feedbackId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{feedback.memberName}</p>
                        <p className="text-sm text-muted-foreground font-mono">{feedback.memberId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="truncate">{feedback.content}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(feedback.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(feedback.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(feedback.status)}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/feedback/${feedback.feedbackId}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFeedback.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No feedback found</h3>
              <p className="text-muted-foreground">No feedback matches the selected filter</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
