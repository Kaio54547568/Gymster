import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

export const ChangePasswordForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const passwordRequirements = [
    { label: 'Ít nhất 8 ký tự', test: (pw: string) => pw.length >= 8 },
    { label: 'Có chữ hoa', test: (pw: string) => /[A-Z]/.test(pw) },
    { label: 'Có chữ thường', test: (pw: string) => /[a-z]/.test(pw) },
    { label: 'Có số', test: (pw: string) => /[0-9]/.test(pw) },
    { label: 'Có ký tự đặc biệt', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    const allRequirementsMet = passwordRequirements.every(req => req.test(formData.newPassword));
    if (!allRequirementsMet) {
      alert('Mật khẩu mới không đáp ứng đủ yêu cầu!');
      return;
    }

    alert('Đổi mật khẩu thành công!');
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Đổi mật khẩu</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-white font-medium mb-2">
            Mật khẩu hiện tại <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">
            Mật khẩu mới <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">
            Xác nhận mật khẩu mới <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <p className="text-white font-medium mb-3">Yêu cầu mật khẩu:</p>
          <div className="space-y-2">
            {passwordRequirements.map((req, index) => {
              const isMet = req.test(formData.newPassword);
              return (
                <div key={index} className="flex items-center gap-2">
                  {isMet ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <X className="w-4 h-4 text-gray-600" />
                  )}
                  <span className={`text-sm ${isMet ? 'text-green-400' : 'text-gray-400'}`}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
        >
          Cập nhật mật khẩu
        </button>
      </form>
    </div>
  );
};
