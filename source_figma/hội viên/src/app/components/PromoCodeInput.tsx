import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';

interface PromoCodeInputProps {
  onApply: (code: string, discount: number) => void;
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({ onApply }) => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleApply = () => {
    if (!code.trim()) {
      setStatus('error');
      setMessage('Vui lòng nhập mã khuyến mãi');
      return;
    }

    // Mock validation
    if (code === 'GYM2026' || code === 'SAVE10') {
      setStatus('success');
      setMessage('Áp dụng mã giảm giá thành công! Giảm 10%');
      onApply(code, 0.1);
    } else {
      setStatus('error');
      setMessage('Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
    }
  };

  return (
    <div className="bg-card border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold text-white">Mã khuyến mãi</h3>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setStatus('idle');
            setMessage('');
          }}
          placeholder="Nhập mã khuyến mãi (VD: GYM2026)"
          className="flex-1 bg-input-background border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleApply}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors font-medium"
        >
          Áp dụng
        </button>
      </div>

      {status === 'success' && (
        <div className="mt-3 flex items-start gap-2 bg-green-500/10 border border-green-500/50 rounded-lg p-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/50 rounded-lg p-3">
          <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{message}</p>
        </div>
      )}

      <div className="mt-4 bg-white/5 rounded-lg p-3">
        <p className="text-sm text-gray-400">
          💡 Mã khuyến mãi hợp lệ: <span className="text-primary font-mono">GYM2026</span> hoặc{' '}
          <span className="text-primary font-mono">SAVE10</span>
        </p>
      </div>
    </div>
  );
};
