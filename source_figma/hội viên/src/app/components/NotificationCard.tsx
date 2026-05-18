import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

interface NotificationCardProps {
  message: string;
  type: 'warning' | 'info';
  date: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ message, type, date }) => {
  const isWarning = type === 'warning';

  return (
    <div
      className={`border rounded-lg p-4 ${
        isWarning
          ? 'bg-orange-500/10 border-orange-500/50'
          : 'bg-blue-500/10 border-blue-500/50'
      }`}
    >
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={`text-sm ${isWarning ? 'text-orange-400' : 'text-blue-400'}`}>
            {message}
          </p>
          <p className="text-xs text-gray-500 mt-1">{date}</p>
        </div>
      </div>
    </div>
  );
};
