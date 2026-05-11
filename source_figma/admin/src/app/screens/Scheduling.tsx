import { useState } from 'react';
import { Calendar, Clock, User, MapPin, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const shifts = [
  { maCa: 'CA1', startTime: '06:00', endTime: '14:00', name: 'Ca sáng' },
  { maCa: 'CA2', startTime: '14:00', endTime: '22:00', name: 'Ca chiều' },
  { maCa: 'CA3', startTime: '18:00', endTime: '23:00', name: 'Ca tối' }
];

const schedule = [
  { day: 'T2', date: '05/05', shifts: [
    { shift: 'CA1', employee: 'Nguyễn Minh PT', room: 'Weight Training' },
    { shift: 'CA2', employee: 'Lê Thị Hằng', room: 'Yoga Studio' },
    { shift: 'CA3', employee: 'Phạm Văn Dũng', room: 'Cardio Zone' }
  ]},
  { day: 'T3', date: '06/05', shifts: [
    { shift: 'CA1', employee: 'Trần Hoàng', room: 'Reception' },
    { shift: 'CA2', employee: 'Nguyễn Minh PT', room: 'Weight Training' },
    { shift: 'CA3', employee: 'Lê Thị Hằng', room: 'Yoga Studio' }
  ]},
  { day: 'T4', date: '07/05', shifts: [
    { shift: 'CA1', employee: 'Phạm Văn Dũng', room: 'Cardio Zone' },
    { shift: 'CA2', employee: 'Hoàng Văn Nam', room: 'Reception' },
    { shift: 'CA3', employee: 'Nguyễn Minh PT', room: 'Weight Training' }
  ]},
  { day: 'T5', date: '08/05', shifts: [
    { shift: 'CA1', employee: 'Lê Thị Hằng', room: 'Yoga Studio' },
    { shift: 'CA2', employee: 'Phạm Văn Dũng', room: 'Cardio Zone' },
    { shift: 'CA3', employee: 'Trần Hoàng', room: 'Reception' }
  ]},
  { day: 'T6', date: '09/05', shifts: [
    { shift: 'CA1', employee: 'Hoàng Văn Nam', room: 'Reception' },
    { shift: 'CA2', employee: 'Lê Thị Hằng', room: 'Yoga Studio' },
    { shift: 'CA3', employee: 'Phạm Văn Dũng', room: 'Cardio Zone' }
  ]},
  { day: 'T7', date: '10/05', shifts: [
    { shift: 'CA1', employee: 'Nguyễn Minh PT', room: 'Weight Training' },
    { shift: 'CA2', employee: 'Trần Hoàng', room: 'Reception' },
    { shift: 'CA3', employee: 'Lê Thị Hằng', room: 'Yoga Studio' }
  ]},
  { day: 'CN', date: '11/05', shifts: [
    { shift: 'CA1', employee: 'Phạm Văn Dũng', room: 'Cardio Zone' },
    { shift: 'CA2', employee: 'Nguyễn Minh PT', room: 'Weight Training' },
    { shift: 'CA3', employee: 'Hoàng Văn Nam', room: 'Reception' }
  ]}
];

export default function Scheduling() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bebas text-5xl text-white tracking-wider mb-2">EMPLOYEE SCHEDULING</h1>
          <p className="text-[#A1A1AA]">Quản lý lịch làm việc nhân viên</p>
        </div>
        <button
          onClick={() => setShowAssignModal(true)}
          className="px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Phân Ca Mới
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-6">
        <button className="p-2 text-[#EF233C] hover:bg-[#EF233C]/10 rounded-lg transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-1">Tuần 19 - Tháng 5, 2026</h3>
          <p className="text-[#A1A1AA]">05/05/2026 - 11/05/2026</p>
        </div>
        <button className="p-2 text-[#EF233C] hover:bg-[#EF233C]/10 rounded-lg transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Shift Legend */}
      <div className="grid grid-cols-3 gap-4">
        {shifts.map((shift) => (
          <div
            key={shift.maCa}
            className="bg-[#0c1014] border border-[#EF233C]/20 rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#EF233C] to-[#990000] rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold">{shift.name}</h4>
              <p className="text-[#A1A1AA] text-sm">
                {shift.startTime} - {shift.endTime}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Calendar */}
      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#050607]">
                <th className="text-left py-4 px-6 text-[#EF233C] font-bold min-w-[120px]">Ca làm việc</th>
                {schedule.map((day) => (
                  <th key={day.day} className="text-center py-4 px-4 min-w-[150px]">
                    <div className="text-white font-bold text-lg">{day.day}</div>
                    <div className="text-[#A1A1AA] text-sm">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.maCa} className="border-t border-[#EF233C]/10">
                  <td className="py-4 px-6">
                    <div className="font-bold text-white">{shift.name}</div>
                    <div className="text-[#A1A1AA] text-sm">{shift.startTime} - {shift.endTime}</div>
                  </td>
                  {schedule.map((day) => {
                    const assignedShift = day.shifts.find(s => s.shift === shift.maCa);
                    return (
                      <td key={day.day} className="py-4 px-4">
                        {assignedShift ? (
                          <div className="bg-gradient-to-br from-[#EF233C]/20 to-[#990000]/10 border border-[#EF233C]/30 rounded-xl p-3 hover:border-[#EF233C] transition-colors cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-4 h-4 text-[#EF233C]" />
                              <span className="text-white font-semibold text-sm">{assignedShift.employee}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-[#A1A1AA]" />
                              <span className="text-[#A1A1AA] text-xs">{assignedShift.room}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[#050607] border border-dashed border-[#EF233C]/20 rounded-xl p-3 hover:border-[#EF233C]/50 transition-colors cursor-pointer flex items-center justify-center h-full">
                            <Plus className="w-5 h-5 text-[#A1A1AA]" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Shift Modal */}
      {showAssignModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="bg-[#0c1014] border border-[#EF233C]/30 rounded-3xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="bebas text-4xl text-white tracking-wider mb-6">PHÂN CA LÀM VIỆC</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[#A1A1AA] mb-2">Chọn nhân viên</label>
                <select className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]">
                  <option>Nguyễn Minh PT</option>
                  <option>Trần Hoàng</option>
                  <option>Lê Thị Hằng</option>
                  <option>Phạm Văn Dũng</option>
                  <option>Hoàng Văn Nam</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-2">Chọn ca làm việc</label>
                <select className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]">
                  <option>Ca sáng (06:00 - 14:00)</option>
                  <option>Ca chiều (14:00 - 22:00)</option>
                  <option>Ca tối (18:00 - 23:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-2">Chọn phòng</label>
                <select className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]">
                  <option>Cardio Zone</option>
                  <option>Weight Training</option>
                  <option>Yoga Studio</option>
                  <option>Reception</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A1A1AA] mb-2">Ngày làm việc</label>
                <input
                  type="date"
                  className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-6 py-3 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold">
                Phân ca
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-3 bg-[#050607] text-white rounded-xl hover:bg-[#0c1014] transition-colors font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
