import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, Wrench } from 'lucide-react';
import { getMaintenanceReports, updateMaintenanceReport } from '../../../services/maintenanceService';

type MaintenanceStatus = 'Reported' | 'In Review' | 'In Repair' | 'Fixed' | 'Unusable';

const statuses: MaintenanceStatus[] = ['Reported', 'In Review', 'In Repair', 'Fixed', 'Unusable'];

const getStatusColor = (status: string) => {
  if (status === 'Fixed') return 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]';
  if (status === 'In Review' || status === 'In Repair') return 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]';
  if (status === 'Unusable') return 'bg-red-500/10 border-red-500/30 text-red-300';
  return 'bg-[#EF233C]/10 border-[#EF233C]/30 text-[#EF233C]';
};

const getSeverityColor = (severity: string) => {
  if (severity === 'High') return 'text-red-300 bg-red-500/10 border-red-500/25';
  if (severity === 'Medium') return 'text-amber-300 bg-amber-500/10 border-amber-500/25';
  return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
};

export default function MaintenanceTracking() {
  const [reports, setReports] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedReportId, setSelectedReportId] = useState('');
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const selectedReport = reports.find((report) => report.id === selectedReportId) || reports[0];

  const filteredReports = useMemo(() => {
    return statusFilter === 'All' ? reports : reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  const refreshReports = async () => {
    setLoading(true);
    const result = await getMaintenanceReports();
    if (result.error) {
      setWarning(result.error.message || 'Maintenance reports could not be loaded.');
      setReports([]);
    } else {
      setWarning('');
      setReports(result.data);
      setSelectedReportId((current) => current || result.data[0]?.id || '');
    }
    setLoading(false);
  };

  useEffect(() => {
    void refreshReports();
  }, []);

  const handleStatusChange = async (id: string, status: MaintenanceStatus) => {
    setReports((current) => current.map((report) => (report.id === id ? { ...report, status } : report)));
    const result = await updateMaintenanceReport(id, { status });
    if (!result.ok) setWarning(result.message);
    await refreshReports();
  };

  const handleNoteDraftChange = (id: string, maintenanceNote: string) => {
    setReports((current) => current.map((report) => (report.id === id ? { ...report, maintenanceNote } : report)));
  };

  const handleNoteSave = async (id: string, maintenanceNote: string) => {
    const result = await updateMaintenanceReport(id, { maintenanceNote });
    if (!result.ok) setWarning(result.message);
    await refreshReports();
  };

  const markFixed = async (id: string) => {
    const result = await updateMaintenanceReport(id, { status: 'Fixed', maintenanceNote: 'Equipment has been repaired, tested, and returned to service.' });
    if (!result.ok) setWarning(result.message);
    await refreshReports();
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="bebas mb-2 text-5xl tracking-wider text-white">MAINTENANCE TRACKING</h1>
        <p className="text-[#A1A1AA]">View, process, update, and close equipment maintenance reports.</p>
      </div>
      {warning && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">{warning}</div>}
      {loading && <div className="rounded-xl border border-[#EF233C]/20 bg-[#0c1014] px-4 py-3 text-sm font-semibold text-[#A1A1AA]">Loading maintenance reports...</div>}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Open reports', value: reports.filter((report) => report.status !== 'Fixed').length, icon: Clock, color: 'text-[#EF233C]' },
          { label: 'In repair', value: reports.filter((report) => report.status === 'In Repair').length, icon: Wrench, color: 'text-amber-300' },
          { label: 'Fixed', value: reports.filter((report) => report.status === 'Fixed').length, icon: CheckCircle, color: 'text-[#22C55E]' },
          { label: 'Unusable', value: reports.filter((report) => report.status === 'Unusable').length, icon: Wrench, color: 'text-red-300' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A1A1AA]">{item.label}</p>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className={`bebas text-5xl tracking-wider ${item.color}`}>{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h3 className="text-2xl font-bold text-white">Maintenance Reports</h3>
          <div className="flex flex-wrap gap-2">
            {['All', ...statuses].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${statusFilter === status ? 'bg-[#EF233C] text-white' : 'bg-[#050607] text-[#A1A1AA] hover:text-white'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#EF233C]/20">
                {['Report ID', 'Equipment name', 'Room/location', 'Issue description', 'Reported date', 'Reported by', 'Severity', 'Status', 'Maintenance note', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-4 text-left font-semibold text-[#A1A1AA]">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-[#EF233C]/10 transition-colors hover:bg-[#EF233C]/5">
                  <td className="px-4 py-4 font-semibold text-white">{report.reportCode || report.id}</td>
                  <td className="px-4 py-4 text-[#EF233C]">{report.equipmentName}</td>
                  <td className="px-4 py-4 text-[#A1A1AA]">{report.room}</td>
                  <td className="max-w-xs px-4 py-4 text-white">{report.issueDescription}</td>
                  <td className="px-4 py-4 text-[#A1A1AA]">{report.reportedDate}</td>
                  <td className="px-4 py-4 text-white">{report.reportedBy}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${getSeverityColor(report.severity)}`}>{report.severity}</span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={report.status}
                      onChange={(event) => handleStatusChange(report.id, event.target.value as MaintenanceStatus)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none ${getStatusColor(report.status)} bg-[#0c1014]`}
                    >
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      value={report.maintenanceNote}
                      onChange={(event) => handleNoteDraftChange(report.id, event.target.value)}
                      onBlur={(event) => handleNoteSave(report.id, event.target.value)}
                      placeholder="Add maintenance note..."
                      className="min-w-64 rounded-lg border border-[#EF233C]/20 bg-[#050607] px-3 py-2 text-sm text-white outline-none focus:border-[#EF233C]"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedReportId(report.id)} className="rounded-lg border border-[#EF233C]/30 bg-[#0c1014] px-3 py-2 text-sm font-bold text-white hover:bg-[#EF233C]/10">
                        View
                      </button>
                      <button onClick={() => markFixed(report.id)} className="rounded-lg bg-[#22C55E]/20 px-3 py-2 text-sm font-bold text-[#22C55E] hover:bg-[#22C55E]/30">
                        Mark Fixed
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <div className="rounded-2xl border border-[#EF233C]/20 bg-[#0c1014] p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-white">Maintenance History</h3>
              <p className="text-[#A1A1AA]">{selectedReport.equipmentName} · {selectedReport.room}</p>
            </div>
            <span className={`rounded-lg border px-3 py-1 text-xs font-semibold ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span>
          </div>

          <div className="space-y-3">
            {(selectedReport.history || []).map((event, index) => (
              <div key={`${event.date}-${index}`} className="rounded-xl border border-[#EF233C]/10 bg-[#050607] p-4">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="font-bold text-white">{event.action}</p>
                  <p className="text-xs text-[#A1A1AA]">{event.date}</p>
                </div>
                <p className="text-sm text-[#A1A1AA]">{event.note || 'No note added.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
