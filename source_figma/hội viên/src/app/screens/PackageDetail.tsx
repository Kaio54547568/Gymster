import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { MemberHeader } from '../components/MemberHeader';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { packages } from '../data/mockData';

export const PackageDetail: React.FC = () => {
  const { planCode } = useParams<{ planCode: string }>();
  const navigate = useNavigate();

  const pkg = packages.find((p) => p.planCode === planCode);

  if (!pkg) {
    return (
      <>
        <MemberHeader title="Không tìm thấy gói tập" />
        <div className="p-8">
          <p className="text-gray-400">Gói tập không tồn tại.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MemberHeader title="Chi tiết gói tập" />

      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Package Header */}
          <div className="bg-card border border-white/10 rounded-xl p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold text-white">{pkg.title}</h2>
                  {pkg.popular && <StatusBadge status="Phổ biến" />}
                  {pkg.hasPT && <StatusBadge status="Có PT" />}
                </div>
                <p className="text-gray-400 mb-2">Mã gói: {pkg.planCode}</p>
                <p className="text-gray-400">Loại gói: {pkg.type}</p>
              </div>

              <div className="text-right">
                <p className="text-4xl font-bold text-primary mb-2">
                  {pkg.price.toLocaleString('vi-VN')}đ
                </p>
                <p className="text-gray-400">Thời lượng: {pkg.duration}</p>
                {pkg.hasPT && <p className="text-blue-400">Số buổi PT: {pkg.sessions} buổi</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <StatusBadge status="Đang mở đăng ký" />
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Quyền lợi</h3>
              <div className="grid grid-cols-2 gap-3">
                {pkg.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            {pkg.terms && (
              <div className="bg-white/5 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Điều kiện sử dụng</h3>
                <div className="space-y-2">
                  {pkg.terms.map((term, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400 text-sm">{term}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/buy-package')}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Quay lại danh sách
            </button>
            <button
              onClick={() => alert('Đăng ký gói tập thành công!')}
              className="flex-1 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Đăng ký gói này
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
