import { useState } from 'react';
import { Dumbbell, AlertTriangle, Wrench, CheckCircle, Plus } from 'lucide-react';

interface Equipment {
  equipmentId: string;
  equipmentName: string;
  room: string;
  status: 'Active' | 'Broken' | 'Under Maintenance' | 'Replaced';
  lastMaintenance: string;
}

export function EquipmentStatus() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState({
    equipment: '',
    issue: '',
    priority: 'Medium',
    technician: '',
    expectedDate: ''
  });

  const equipment: Equipment[] = [
    { equipmentId: 'EQ001', equipmentName: 'Treadmill X12 #1', room: 'Cardio Area', status: 'Active', lastMaintenance: '2026-04-15' },
    { equipmentId: 'EQ002', equipmentName: 'Treadmill X12 #5', room: 'Cardio Area', status: 'Broken', lastMaintenance: '2026-03-20' },
    { equipmentId: 'EQ003', equipmentName: 'Bench Press Machine', room: 'Weight Room', status: 'Active', lastMaintenance: '2026-04-10' },
    { equipmentId: 'EQ004', equipmentName: 'Lat Pulldown Machine', room: 'Weight Room', status: 'Under Maintenance', lastMaintenance: '2026-05-01' },
    { equipmentId: 'EQ005', equipmentName: 'Leg Press Machine', room: 'Weight Room', status: 'Active', lastMaintenance: '2026-04-25' },
    { equipmentId: 'EQ006', equipmentName: 'Rowing Machine #3', room: 'Cardio Area', status: 'Replaced', lastMaintenance: '2026-02-10' }
  ];

  const filteredEquipment = statusFilter === 'all'
    ? equipment
    : equipment.filter(eq => eq.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const styles = {
      Active: 'bg-primary/20 text-primary border-primary/30',
      Broken: 'bg-destructive/20 text-destructive border-destructive/30',
      'Under Maintenance': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      Replaced: 'bg-muted text-muted-foreground border-muted'
    };

    const icons = {
      Active: CheckCircle,
      Broken: AlertTriangle,
      'Under Maintenance': Wrench,
      Replaced: CheckCircle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const handleReportIssue = (equipmentId: string) => {
    setSelectedEquipment(equipmentId);
    setShowReportModal(true);
  };

  const handleCreateMaintenance = (equipmentId: string) => {
    setSelectedEquipment(equipmentId);
    setShowMaintenanceModal(true);
  };

  const handleSubmitReport = () => {
    setShowReportModal(false);
    setReportForm({ equipment: '', issue: '', priority: 'Medium', technician: '', expectedDate: '' });
  };

  return (
    <div className="relative">
      {/* Hero Banner */}
      <div className="relative h-[280px] overflow-hidden bg-black">
        <img
          src="https://images.unsplash.com/photo-1775993719568-290840203239?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxneW0lMjBlcXVpcG1lbnQlMjBtb2Rlcm58ZW58MXx8fHwxNzc4MDgzNDE1fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Gym Equipment"
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black to-black/60"></div>
        <div className="relative h-full flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary text-sm font-bold tracking-widest mb-3 uppercase">QUẢN LÝ THIẾT BỊ</p>
                <h1 className="text-6xl font-black tracking-tight mb-4">
                  <span className="text-primary">TRẠNG THÁI</span>
                  <br />
                  <span className="text-white">THIẾT BỊ</span>
                </h1>
                <p className="text-white/70 text-base max-w-2xl leading-relaxed">
                  Giám sát tình trạng thiết bị tập luyện, báo cáo sự cố, lên lịch bảo trì và quản lý yêu cầu sửa chữa.
                </p>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-6 py-4 bg-destructive text-white rounded-2xl hover:shadow-[0_0_30px_rgba(179,0,0,0.6)] transition-all font-bold"
              >
                <AlertTriangle className="w-5 h-5" />
                Báo Cáo Sự Cố
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
      <div className="max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 mt-6">
          {[
            { label: 'Active', count: equipment.filter(e => e.status === 'Active').length, color: 'text-primary', icon: CheckCircle },
            { label: 'Broken', count: equipment.filter(e => e.status === 'Broken').length, color: 'text-destructive', icon: AlertTriangle },
            { label: 'Maintenance', count: equipment.filter(e => e.status === 'Under Maintenance').length, color: 'text-yellow-500', icon: Wrench },
            { label: 'Replaced', count: equipment.filter(e => e.status === 'Replaced').length, color: 'text-muted-foreground', icon: CheckCircle }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h3 className="font-medium mb-3">Filter by Status</h3>
          <div className="flex flex-wrap gap-2">
            {['all', 'Active', 'Broken', 'Under Maintenance', 'Replaced'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 rounded-xl font-bold transition-all ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-primary to-destructive text-white shadow-[0_0_30px_rgba(255,0,0,0.5)]'
                    : 'bg-input hover:bg-secondary'
                }`}
              >
                {status === 'all' ? 'All Equipment' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Table */}
        <div className="backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-6 py-4 font-medium">Equipment ID</th>
                  <th className="text-left px-6 py-4 font-medium">Equipment Name</th>
                  <th className="text-left px-6 py-4 font-medium">Room</th>
                  <th className="text-left px-6 py-4 font-medium">Status</th>
                  <th className="text-left px-6 py-4 font-medium">Last Maintenance</th>
                  <th className="text-left px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq, index) => (
                  <tr
                    key={eq.equipmentId}
                    className={`border-b border-border hover:bg-secondary/20 transition-colors ${
                      index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-primary">{eq.equipmentId}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{eq.equipmentName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{eq.room}</td>
                    <td className="px-6 py-4">{getStatusBadge(eq.status)}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(eq.lastMaintenance).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReportIssue(eq.equipmentId)}
                          className="px-3 py-1.5 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors text-sm"
                        >
                          Report Issue
                        </button>
                        <button
                          onClick={() => handleCreateMaintenance(eq.equipmentId)}
                          className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
                        >
                          Maintenance
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Issue Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
            <div className="backdrop-blur-xl bg-card/90 border-2 border-primary rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-[0_0_60px_rgba(255,0,0,0.5)]">
              <h2 className="text-3xl font-black mb-6">Report Equipment Issue</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">Equipment</label>
                  <select
                    value={reportForm.equipment}
                    onChange={(e) => setReportForm({ ...reportForm, equipment: e.target.value })}
                    className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-medium"
                  >
                    <option value="">Select equipment...</option>
                    {equipment.map(eq => (
                      <option key={eq.equipmentId} value={eq.equipmentId}>{eq.equipmentName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">Issue Description</label>
                  <textarea
                    value={reportForm.issue}
                    onChange={(e) => setReportForm({ ...reportForm, issue: e.target.value })}
                    className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none min-h-[120px] font-medium"
                    placeholder="Describe the issue..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-muted-foreground">Priority</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Low', 'Medium', 'High'].map(priority => (
                      <button
                        key={priority}
                        onClick={() => setReportForm({ ...reportForm, priority })}
                        className={`px-4 py-3 rounded-xl font-bold border-2 transition-all ${
                          reportForm.priority === priority
                            ? 'border-primary bg-primary/20 text-primary shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {priority}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-muted-foreground">Assign Technician</label>
                    <input
                      type="text"
                      value={reportForm.technician}
                      onChange={(e) => setReportForm({ ...reportForm, technician: e.target.value })}
                      className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-medium"
                      placeholder="Technician name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-muted-foreground">Expected Repair Date</label>
                    <input
                      type="date"
                      value={reportForm.expectedDate}
                      onChange={(e) => setReportForm({ ...reportForm, expectedDate: e.target.value })}
                      className="w-full bg-input px-4 py-4 rounded-xl border-2 border-border focus:border-primary focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSubmitReport}
                  className="flex-1 bg-gradient-to-r from-primary to-destructive text-white px-8 py-5 rounded-2xl font-black text-lg hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-10 py-5 border-2 border-border hover:bg-secondary rounded-2xl transition-all font-bold text-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
