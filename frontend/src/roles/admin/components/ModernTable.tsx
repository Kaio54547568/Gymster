import { ReactNode } from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => ReactNode;
}

interface ModernTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  actions?: ReactNode;
}

export default function ModernTable({ columns, data, title, actions }: ModernTableProps) {
  return (
    <div className="glass border border-white/10 rounded-[2rem] p-8 shadow-float">
      {(title || actions) && (
        <div className="flex items-center justify-between mb-8">
          {title && <h3 className="text-3xl font-bold text-white tracking-tight">{title}</h3>}
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="grid gap-4 px-6 py-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column, idx) => (
            <div key={idx} className="text-white/50 text-sm font-bold uppercase tracking-wider">
              {column.header}
            </div>
          ))}
        </div>

        {/* Rows */}
        {data.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="grid gap-4 px-6 py-5 glass border border-white/5 rounded-2xl hover:border-[#EF233C]/30 hover:shadow-glow-red transition-all duration-300 group cursor-pointer"
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
          >
            {columns.map((column, colIdx) => (
              <div key={colIdx} className="flex items-center text-white/90 text-sm font-medium">
                {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
