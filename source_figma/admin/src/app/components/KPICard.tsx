import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = '#EF233C',
  onClick
}: KPICardProps) {
  const changeColors = {
    positive: 'text-[#22C55E]',
    negative: 'text-[#EF233C]',
    neutral: 'text-[#A1A1AA]'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      onClick={onClick}
      className={`glass border border-white/10 rounded-3xl p-7 shadow-float hover:shadow-glow-red transition-all duration-500 group relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Glow Effect */}
      <div
        className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"
        style={{ background: `linear-gradient(135deg, ${iconColor}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex-1">
          <p className="text-white/50 text-sm font-medium mb-3 tracking-wide uppercase">{title}</p>
          <h3 className="bebas text-4xl text-white tracking-wider">{value}</h3>
        </div>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: `linear-gradient(135deg, ${iconColor}30, ${iconColor}15)`,
            border: `1px solid ${iconColor}40`,
            boxShadow: `0 8px 24px ${iconColor}30`
          }}
        >
          <Icon className="w-8 h-8" style={{ color: iconColor }} />
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-2 relative z-10">
          <span className={`text-sm font-bold ${changeColors[changeType]}`}>
            {change}
          </span>
          <span className="text-xs text-white/40">vs tháng trước</span>
        </div>
      )}
    </motion.div>
  );
}
