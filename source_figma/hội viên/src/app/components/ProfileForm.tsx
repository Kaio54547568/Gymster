import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { currentMember } from '../data/mockData';

export const ProfileForm: React.FC = () => {
  const [formData, setFormData] = useState(currentMember);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thông tin cá nhân đã được cập nhật thành công!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={formData.avatar}
              alt={formData.name}
              className="w-24 h-24 rounded-full"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{formData.name}</h3>
            <p className="text-gray-400">Mã hội viên: {formData.memberId}</p>
            <p className="text-sm text-gray-400">User ID: {formData.userId}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-card border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Thông tin cá nhân</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-medium mb-2">Họ tên</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Số điện thoại</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Ngày sinh</label>
            <input
              type="text"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Giới tính</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Gói hiện tại</label>
            <input
              type="text"
              value={formData.packageId}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
              disabled
            />
          </div>

          <div className="col-span-2">
            <label className="block text-white font-medium mb-2">Địa chỉ</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Trạng thái tài khoản</label>
            <input
              type="text"
              value={formData.status}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
              disabled
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Ngày đăng ký</label>
            <input
              type="text"
              value={formData.registrationDate}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 text-gray-400 cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium mt-6"
        >
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
};
