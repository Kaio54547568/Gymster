import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Dumbbell, Plus, Wrench } from 'lucide-react';
import { createStaffMaintenanceReport, getStaffEquipmentStatus, markStaffEquipmentMaintained } from '../../../services/staffOperationsApi';

type EquipmentStatusValue = 'Active' | 'Broken' | 'Under Maintenance' | 'Replaced';

interface Equipment {
  equipmentUuid?: string;
  equipmentId: string;
  equipmentName: string;
  room: string;
  roomId?: string;
  status: EquipmentStatusValue;
  lastMaintenance: string;
}

interface MaintenanceReport {
  id: string;
  equipmentUuid?: string;
  equipmentName: string;
  room: string;
  issueDescription: string;
  priority?: string;
  status: string;
  createdAt?: string;
  reportedDate?: string;
}

const severityOptions = ['Low', 'Medium', 'High'];

export function EquipmentStatus() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [reportForm, setReportForm] = useState({
    equipmentUuid: '',
    equipmentName: '',
    room: '',
    roomId: '',
    issueDescription: '',
    severity: 'Medium',
  });

  const loadEquipment = async () => {
    setLoading(true);
    const result = await getStaffEquipmentStatus();
    if (result.error) {
      setWarning('Some equipment data could not be loaded.');
      setEquipment([]);
      setReports([]);
    } else {
      setWarning('');
      setEquipment(result.data.equipment);
      setReports(result.data.reports);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadEquipment();
  }, []);

  const filteredEquipment = statusFilter === 'all' ? equipment : equipment.filter((eq) => eq.status === statusFilter);
  const staffReports = useMemo(() => reports.slice(0, 4), [reports]);

  const getStatusBadge = (status: string) => {
    const styles = {
      Active: 'bg-primary/20 text-primary border-primary/30',
      Broken: 'bg-destructive/20 text-destructive border-destructive/30',
      'Under Maintenance': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      Replaced: 'bg-muted text-muted-foreground border-muted',
    };
    const icons = { Active: CheckCircle, Broken: AlertTriangle, 'Under Maintenance': Wrench, Replaced: CheckCircle };
    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  const openReportModal = (item?: Equipment) => {
    setReportForm({
      equipmentUuid: item?.equipmentUuid ?? '',
      equipmentName: item?.equipmentName ?? '',
      room: item?.room ?? '',
      roomId: item?.roomId ?? '',
      issueDescription: '',
      severity: 'Medium',
    });
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportForm.equipmentName || !reportForm.room || !reportForm.issueDescription.trim()) return;

    const result = await createStaffMaintenanceReport({
      ...reportForm,
      priority: reportForm.severity.toLowerCase(),
    });
    if (!result.ok) {
      setWarning(result.message);
    } else {
      await loadEquipment();
    }
    setShowReportModal(false);
  };

  const handleMarkMaintained = async (payload: { equipmentUuid?: string; reportId?: string }) => {
    const result = await markStaffEquipmentMaintained(payload);
    if (!result.ok) {
      setWarning(result.message);
      return;
    }
    setWarning('');
    await loadEquipment();
  };

  return (
    <div className="relative">
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1775993719568-290840203239?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxneW0lMjBlcXVpcG1lbnQlMjBtb2Rlcm58ZW58MXx8fHwxNzc4MDgzNDE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gym Equipment"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60" />
        <div className="relative flex h-full items-center px-6">
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-primary">Equipment issue reporting</p>
                <h1 className="mb-4 text-6xl font-black tracking-tight">
                  <span className="text-primary">EQUIPMENT</span>
                  <br />
                  <span className="text-white">STATUS</span>
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-white/70">
                  Monitor equipment condition and report broken equipment for the manager or admin maintenance team to process.
                </p>
              </div>
              <button
                onClick={() => openReportModal()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-destructive px-6 py-4 font-bold text-white transition-all hover:shadow-[0_0_30px_rgba(179,0,0,0.6)]"
              >
                <AlertTriangle className="h-5 w-5" />
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {warning && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-300">{warning}</div>}
          {loading && <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">Loading equipment...</div>}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Active', count: equipment.filter((item) => item.status === 'Active').length, color: 'text-primary', icon: CheckCircle },
              { label: 'Broken', count: equipment.filter((item) => item.status === 'Broken').length, color: 'text-destructive', icon: AlertTriangle },
              { label: 'Maintenance', count: equipment.filter((item) => item.status === 'Under Maintenance').length, color: 'text-yellow-500', icon: Wrench },
              { label: 'Reports', count: reports.length, color: 'text-primary', icon: Dumbbell },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <h3 className="mb-3 font-medium">Filter by Status</h3>
            <div className="flex flex-wrap gap-2">
              {['all', 'Active', 'Broken', 'Under Maintenance', 'Replaced'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-xl px-4 py-3 font-bold transition-all ${
                    statusFilter === status ? 'bg-gradient-to-r from-primary to-destructive text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]' : 'bg-input hover:bg-secondary'
                  }`}
                >
                  {status === 'all' ? 'All Equipment' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="px-6 py-4 text-left font-medium">Equipment ID</th>
                    <th className="px-6 py-4 text-left font-medium">Equipment Name</th>
                    <th className="px-6 py-4 text-left font-medium">Room</th>
                    <th className="px-6 py-4 text-left font-medium">Status</th>
                    <th className="px-6 py-4 text-left font-medium">Last Maintenance</th>
                    <th className="px-6 py-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((eq, index) => (
                    <tr key={eq.equipmentId} className={`border-b border-border transition-colors hover:bg-secondary/20 ${index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'}`}>
                      <td className="px-6 py-4"><span className="font-mono text-primary">{eq.equipmentId}</span></td>
                      <td className="px-6 py-4 font-medium">{eq.equipmentName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{eq.room}</td>
                      <td className="px-6 py-4">{getStatusBadge(eq.status)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString('en-US') : '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => openReportModal(eq)} className="rounded-lg bg-destructive/20 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/30">
                            Report Issue
                          </button>
                          {eq.status !== 'Active' && (
                            <button onClick={() => handleMarkMaintained({ equipmentUuid: eq.equipmentUuid })} className="rounded-lg bg-primary/20 px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary/30">
                              Mark Maintained
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/80 p-6">
            <h3 className="mb-4 text-xl font-black">Recent Issue Reports</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {staffReports.map((report) => (
                <article key={report.id} className="rounded-xl border border-border bg-input/60 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{report.equipmentName}</p>
                      <p className="text-sm text-muted-foreground">{report.room} - {report.reportedDate || (report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US') : '-')}</p>
                    </div>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{report.status}</span>
                  </div>
                  <p className="text-sm text-white/70">{report.issueDescription}</p>
                  {report.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleMarkMaintained({ reportId: report.id, equipmentUuid: report.equipmentUuid })}
                      className="mt-4 rounded-lg bg-primary/20 px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/30"
                    >
                      Maintenance Complete
                    </button>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl border-2 border-primary bg-card/90 p-8 shadow-[0_0_60px_rgba(255,0,0,0.5)] backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black">Report Equipment Issue</h2>
              <Plus className="h-6 w-6 rotate-45 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">Equipment name</label>
                <select
                  value={reportForm.equipmentName}
                  onChange={(event) => {
                    const item = equipment.find((eq) => eq.equipmentName === event.target.value);
                    setReportForm({
                      ...reportForm,
                      equipmentName: event.target.value,
                      equipmentUuid: item?.equipmentUuid || '',
                      room: item?.room || reportForm.room,
                      roomId: item?.roomId || '',
                    });
                  }}
                  className="w-full rounded-xl border-2 border-border bg-input px-4 py-4 font-medium outline-none focus:border-primary"
                >
                  <option value="">Select equipment...</option>
                  {equipment.map((eq) => <option key={eq.equipmentId} value={eq.equipmentName}>{eq.equipmentName}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">Room/location</label>
                <input value={reportForm.room} onChange={(event) => setReportForm({ ...reportForm, room: event.target.value })} className="w-full rounded-xl border-2 border-border bg-input px-4 py-4 font-medium outline-none focus:border-primary" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">Issue description</label>
                <textarea
                  value={reportForm.issueDescription}
                  onChange={(event) => setReportForm({ ...reportForm, issueDescription: event.target.value })}
                  className="min-h-[120px] w-full rounded-xl border-2 border-border bg-input px-4 py-4 font-medium outline-none focus:border-primary"
                  placeholder="Describe the issue..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-muted-foreground">Severity</label>
                <div className="grid grid-cols-3 gap-3">
                  {severityOptions.map((severity) => (
                    <button
                      key={severity}
                      onClick={() => setReportForm({ ...reportForm, severity })}
                      className={`rounded-xl border-2 px-4 py-3 font-bold transition-all ${
                        reportForm.severity === severity ? 'border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button onClick={handleSubmitReport} disabled={!reportForm.equipmentName || !reportForm.room || !reportForm.issueDescription.trim()} className="flex-1 rounded-2xl bg-gradient-to-r from-primary to-destructive px-8 py-5 text-lg font-black text-white transition-all hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] disabled:cursor-not-allowed disabled:opacity-40">
                Submit Report
              </button>
              <button onClick={() => setShowReportModal(false)} className="rounded-2xl border-2 border-border px-10 py-5 text-lg font-bold transition-all hover:bg-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
