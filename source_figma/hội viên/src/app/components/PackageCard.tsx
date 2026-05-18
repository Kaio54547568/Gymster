import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface PackageCardProps {
  package: {
    planCode: string;
    title: string;
    price: number;
    duration: string;
    type: string;
    benefits: string[];
    popular?: boolean;
    hasPT?: boolean;
  };
  onClick?: () => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ package: pkg, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`group bg-card border rounded-xl p-6 transition-all ${
        onClick ? 'cursor-pointer hover:border-primary hover:bg-white/5' : ''
      } ${pkg.popular ? 'border-primary' : 'border-white/10'}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{pkg.title}</h3>
          <p className="text-gray-400 text-sm">Mã gói: {pkg.planCode}</p>
        </div>
        <div className="flex gap-2">
          {pkg.popular && <StatusBadge status="Phổ biến" />}
          {pkg.hasPT && <StatusBadge status="Có PT" />}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-3xl font-bold text-primary mb-1">
          {pkg.price.toLocaleString('vi-VN')}đ
        </p>
        <p className="text-gray-400 text-sm">{pkg.duration}</p>
      </div>

      <div className="space-y-3 mb-6">
        {pkg.benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-300">{benefit}</span>
          </div>
        ))}
      </div>

      {onClick && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-center text-sm text-gray-400 group-hover:text-primary transition-colors">
            Click để chọn gói này →
          </p>
        </div>
      )}
    </div>
  );
};
