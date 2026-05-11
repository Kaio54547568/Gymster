import { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

export default function MaintenanceReport() {
  const [formData, setFormData] = useState({ equipment: '', issue: '', priority: 'medium' });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="bebas text-5xl text-white tracking-wider mb-2">MAINTENANCE REPORT</h1>
        <p className="text-[#A1A1AA]">Báo cáo sự cố thiết bị</p>
      </div>

      <div className="bg-[#0c1014] border border-[#EF233C]/20 rounded-2xl p-8 max-w-3xl">
        <h3 className="text-2xl font-bold text-white mb-6">Báo Cáo Sự Cố Thiết Bị</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-white mb-2">Chọn thiết bị</label>
            <select
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C]"
            >
              <option value="">-- Chọn thiết bị --</option>
              <option>Treadmill X12 Pro (TB001)</option>
              <option>Bench Press Machine (TB002)</option>
              <option>Lat Pulldown Machine (TB003)</option>
              <option>Rowing Machine Elite (TB004)</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Mô tả lỗi</label>
            <textarea
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              rows={6}
              placeholder="Mô tả chi tiết sự cố..."
              className="w-full bg-[#050607] border border-[#EF233C]/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#EF233C] resize-none"
            />
          </div>

          <div>
            <label className="block text-white mb-2">Mức độ khẩn cấp</label>
            <div className="grid grid-cols-3 gap-4">
              {['low', 'medium', 'high'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, priority: level })}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    formData.priority === level
                      ? level === 'high' ? 'bg-[#EF233C] text-white' :
                        level === 'medium' ? 'bg-[#F97316] text-white' :
                        'bg-[#22C55E] text-white'
                      : 'bg-[#050607] border border-[#EF233C]/30 text-[#A1A1AA]'
                  }`}
                >
                  {level === 'low' ? 'Thấp' : level === 'medium' ? 'Trung bình' : 'Cao'}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full px-6 py-4 bg-[#EF233C] text-white rounded-xl hover:bg-[#990000] transition-colors font-semibold flex items-center justify-center gap-2">
            <Send className="w-5 h-5" />
            Gửi Báo Cáo
          </button>
        </div>
      </div>
    </div>
  );
}
