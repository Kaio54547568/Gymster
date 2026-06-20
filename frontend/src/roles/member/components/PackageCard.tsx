import type { DisplayPackage } from '../domain/packageTransactionMappers';

type PackageCardProps = {
  actionLabel: string;
  disabled?: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  item: DisplayPackage;
  onSelect: (item: DisplayPackage) => void;
};

export default function PackageCard({ actionLabel, disabled = false, isCurrent, isSelected, item, onSelect }: PackageCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        isSelected ? 'border-[#EF233C] bg-[#EF233C]/10' : 'border-white/8 bg-[#222]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold text-white">{item.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {item.discountPercent > 0 && <span className="text-white/35 line-through">{item.originalPrice}</span>}
            <span className={item.discountPercent > 0 ? 'font-black text-[#EF233C]' : 'text-white/45'}>{item.duration} - {item.price}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {item.isPopular && <span className="rounded-full bg-[#EF233C]/15 px-2.5 py-1 text-[10px] font-black text-[#EF233C]">Popular</span>}
          {item.discountPercent > 0 && <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black text-emerald-300">-{item.discountPercent}%</span>}
          {isCurrent && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/70">
              Current package
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-white/55 sm:grid-cols-3">
        <div>PT: <span className="font-bold text-white">{item.hasPersonalTrainer ? 'Yes' : 'No'}</span></div>
        <div>Sessions: <span className="font-bold text-white">{item.sessionLimit}</span></div>
        <div>Duration: <span className="font-bold text-white">{item.duration}</span></div>
      </div>
      <ul className="mt-3 space-y-1 text-xs text-white/50">
        {item.benefits.map((benefit) => (
          <li key={benefit}>- {benefit}</li>
        ))}
      </ul>
      <button
        className="mt-3 rounded-lg bg-[#EF233C] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
        type="button"
        disabled={disabled}
        onClick={() => onSelect(item)}
      >
        {actionLabel}
      </button>
    </div>
  );
}
