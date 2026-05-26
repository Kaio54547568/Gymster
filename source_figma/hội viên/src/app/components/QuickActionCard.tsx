import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, icon: Icon, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-card border border-white/10 rounded-xl p-4 hover:border-primary hover:bg-primary/5 transition-all group"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-white">{title}</p>
      </div>
    </button>
  );
};
