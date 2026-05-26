import { useEffect, useState } from 'react';
import { AlertCircle, Eye, Filter, MessageSquare } from 'lucide-react';
import { getStaffFeedbackItems, updateStaffFeedbackItem } from '../../../services/staffOperationsApi';

type FeedbackStatus = 'Submitted' | 'In Review' | 'Resolved' | 'Rejected';

interface Feedback {
  feedbackId: string;
  kind: 'Feedback' | 'Complaint';
  memberId: string;
  memberName: string;
  category: string;
  target: string;
  content: string;
  date: string;
  status: FeedbackStatus;
  priority: 'Low' | 'Medium' | 'High';
  response?: string;
  sourceId?: string;
  sourceTable?: 'service_feedback' | 'complaints';
}

export function FeedbackManagement() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [saveError, setSaveError] = useState('');
  const selectedFeedback = feedbacks.find((feedback) => feedback.feedbackId === selectedFeedbackId);

  const loadFeedbacks = async () => {
    setLoading(true);
    const result = await getStaffFeedbackItems();
    if (result.error) {
      setWarning('Some feedback data could not be loaded.');
      setFeedbacks([]);
    } else {
      setWarning('');
      setFeedbacks(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  const filteredFeedback = statusFilter === 'all' ? feedbacks : feedbacks.filter((feedback) => feedback.status === statusFilter);

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles = {
      Submitted: 'bg-destructive/20 text-destructive border-destructive/30',
      'In Review': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      Resolved: 'bg-primary/20 text-primary border-primary/30',
      Rejected: 'bg-muted text-muted-foreground border-muted',
    };

    return <span className={`rounded-full border px-3 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      High: 'bg-destructive/20 text-destructive',
      Medium: 'bg-yellow-500/20 text-yellow-500',
      Low: 'bg-muted text-muted-foreground',
    };

    return <span className={`rounded px-2 py-1 text-xs font-medium ${styles[priority as keyof typeof styles]}`}>{priority}</span>;
  };

  const updateSelectedFeedback = (updates: Partial<Feedback>) => {
    if (!selectedFeedback) return;
    setFeedbacks((current) => current.map((feedback) => (feedback.feedbackId === selectedFeedback.feedbackId ? { ...feedback, ...updates } : feedback)));
  };

  const handleSaveResponse = async () => {
    if (!selectedFeedback) return;
    if (!selectedFeedback.sourceId || !selectedFeedback.sourceTable) {
      setSelectedFeedbackId(null);
      return;
    }
    const result = await updateStaffFeedbackItem(selectedFeedback);
    if (!result.ok) {
      setSaveError(result.message);
      return;
    }
    setSaveError('');
    setSelectedFeedbackId(null);
    await loadFeedbacks();
  };

  return (
    <div className="relative">
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBjb21tdW5pdHl8ZW58MHx8fHwxNzM4MDAwMDAwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gym Community"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60" />
        <div className="relative flex h-full items-center px-6">
          <div className="mx-auto w-full max-w-7xl">
            <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Member feedback operations</p>
            <h1 className="mb-4 text-6xl font-black tracking-tight">
              <span className="text-primary">FEEDBACK</span>
              <br />
              <span className="text-white">MANAGEMENT</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/70">
              Review member ratings and complaints. Staff can add an optional response and update the handling status.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {warning && <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-300">{warning}</div>}
          {loading && <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">Loading feedback...</div>}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Submitted', count: feedbacks.filter((item) => item.status === 'Submitted').length, color: 'text-destructive' },
              { label: 'In Review', count: feedbacks.filter((item) => item.status === 'In Review').length, color: 'text-yellow-500' },
              { label: 'Resolved', count: feedbacks.filter((item) => item.status === 'Resolved').length, color: 'text-primary' },
              { label: 'Rejected', count: feedbacks.filter((item) => item.status === 'Rejected').length, color: 'text-muted-foreground' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <p className="mb-1 text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Filter by Status</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'Submitted', 'In Review', 'Resolved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-4 py-2 font-medium transition-all ${statusFilter === status ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'bg-input hover:bg-secondary'}`}
                >
                  {status === 'all' ? 'All' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    {['ID', 'Type', 'Member', 'Category', 'Target', 'Content', 'Date', 'Priority', 'Status', 'Actions'].map((heading) => (
                      <th key={heading} className="px-6 py-4 text-left font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFeedback.map((feedback, index) => (
                    <tr key={feedback.feedbackId} className={`border-b border-border transition-colors hover:bg-secondary/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'}`}>
                      <td className="px-6 py-4"><span className="font-mono text-primary">{feedback.feedbackId}</span></td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${feedback.kind === 'Complaint' ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>{feedback.kind}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium">{feedback.memberName}</p>
                        <p className="font-mono text-sm text-muted-foreground">{feedback.memberId}</p>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{feedback.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">{feedback.target}</td>
                      <td className="max-w-md px-6 py-4"><p className="truncate">{feedback.content}</p></td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(feedback.date).toLocaleDateString('en-US')}</td>
                      <td className="px-6 py-4">{getPriorityBadge(feedback.priority)}</td>
                      <td className="px-6 py-4">{getStatusBadge(feedback.status)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedFeedbackId(feedback.feedbackId)} className="inline-flex items-center gap-1 rounded-lg bg-primary/20 px-3 py-1.5 text-primary transition-colors hover:bg-primary/30">
                          <Eye className="h-4 w-4" />
                          Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredFeedback.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">No feedback found</h3>
                <p className="text-muted-foreground">No feedback matches the selected filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-primary/40 bg-card p-6 shadow-[0_0_50px_rgba(255,0,0,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Staff Response</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedFeedback.kind} · {selectedFeedback.category} · {selectedFeedback.target}</p>
              </div>
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>

            <div className="mb-4 rounded-xl border border-border bg-input p-4">
              <p className="text-sm leading-6">{selectedFeedback.content}</p>
            </div>

            {saveError && <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{saveError}</div>}

            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-muted-foreground">Status</label>
              <select
                value={selectedFeedback.status}
                onChange={(event) => updateSelectedFeedback({ status: event.target.value as FeedbackStatus })}
                className="w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary"
              >
                {['Submitted', 'In Review', 'Resolved', 'Rejected'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-muted-foreground">Optional staff response</label>
              <textarea
                value={selectedFeedback.response || ''}
                onChange={(event) => updateSelectedFeedback({ response: event.target.value })}
                className="min-h-32 w-full rounded-xl border border-border bg-input px-4 py-3 outline-none focus:border-primary"
                placeholder="Write an optional response to the member..."
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSaveResponse} className="flex-1 rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-destructive">
                Save Response
              </button>
              <button onClick={() => setSelectedFeedbackId(null)} className="rounded-xl border border-border px-5 py-3 font-bold hover:bg-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
