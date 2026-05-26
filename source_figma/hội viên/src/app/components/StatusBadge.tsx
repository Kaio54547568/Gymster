import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Đang hoạt động':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Hết hạn':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Sắp tới':
        return 'bg-primary/20 text-primary border-primary/50';
      case 'Đã hoàn thành':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'Đã hủy':
        return 'bg-gray-700/20 text-gray-500 border-gray-700/50';
      case 'Chờ xác nhận':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'Phổ biến':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Có PT':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Còn lịch trống':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Kín lịch':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Sắp hết hạn':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()} ${className}`}
    >
      {status}
    </span>
  );
};
