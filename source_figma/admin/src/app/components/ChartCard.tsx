import { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function ChartCard({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass border border-white/10 rounded-3xl p-8 shadow-float hover:shadow-glow-red transition-all duration-500 group relative overflow-hidden"
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EF233C]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{title}</h3>
          {subtitle && <p className="text-sm text-white/50 font-medium">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="w-full relative z-10">{children}</div>
    </motion.div>
  );
}
