import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-gray-500" />
      </div>
      <p className="text-gray-400 text-center mb-6">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
