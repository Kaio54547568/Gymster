import React from 'react';
import { currentMember } from '../data/mockData';
import { NotificationDropdown } from './NotificationDropdown';

interface MemberHeaderProps {
  title: string;
  subtitle?: string;
}

export const MemberHeader: React.FC<MemberHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="bg-card border-b border-white/10 px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {title === "Trang chủ" ? `Xin chào, ${currentMember.name}` : title}
          </h1>
          {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
          {title === "Trang chủ" && !subtitle && (
            <p className="text-gray-400 mt-1">Sẵn sàng cho buổi tập hôm nay chưa?</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationDropdown />

          {/* Member Avatar */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <img
              src={currentMember.avatar}
              alt={currentMember.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-sm font-medium text-white">{currentMember.name}</p>
              <p className="text-xs text-gray-400">{currentMember.memberId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
