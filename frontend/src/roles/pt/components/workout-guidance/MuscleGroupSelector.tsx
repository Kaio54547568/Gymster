import { useEffect, useRef } from "react";
import MuscleBodyMap from "./MuscleBodyMap";
import {
  formatMuscleGroupValue,
  getMuscleGroupDisplayLabel,
  muscleGroups,
  parseMuscleGroupValue,
  uniqueMuscleGroups,
  type MuscleGroupId,
} from "./muscleGroups";

interface MuscleGroupSelectorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

function toggleId(selectedIds: MuscleGroupId[], id: MuscleGroupId) {
  return selectedIds.includes(id)
    ? selectedIds.filter(item => item !== id)
    : [...selectedIds, id];
}

export default function MuscleGroupSelector({ value, onChange, readOnly = false }: MuscleGroupSelectorProps) {
  const selectedIds = parseMuscleGroupValue(value);
  const latestSelectedIds = useRef<MuscleGroupId[]>(selectedIds);

  useEffect(() => {
    latestSelectedIds.current = selectedIds;
  }, [value]);

  const updateSelection = (ids: MuscleGroupId[]) => {
    latestSelectedIds.current = ids;
    onChange(formatMuscleGroupValue(ids));
  };

  const handleToggle = (id: MuscleGroupId) => {
    if (readOnly) return;
    updateSelection(toggleId(latestSelectedIds.current, id));
  };

  return (
    <div className="rounded-xl border border-white/8 bg-[#151515] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#BDBDBD]">Nhóm cơ</div>
          <p className="mt-0.5 text-[11px] text-white/35">Chọn trên bản đồ cơ thể hoặc dùng danh sách nhanh.</p>
        </div>
        <div className="rounded-full border border-[#FF3B3B]/25 bg-[#FF3B3B]/10 px-2.5 py-1 text-[11px] font-bold text-[#FFB3B3]">
          {selectedIds.length} đã chọn
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MuscleBodyMap
          title="Mặt trước"
          view="front"
          groups={muscleGroups.filter(group => group.view === "front")}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          readOnly={readOnly}
        />
        <MuscleBodyMap
          title="Mặt sau"
          view="back"
          groups={muscleGroups.filter(group => group.view === "back")}
          selectedIds={selectedIds}
          onToggle={handleToggle}
          readOnly={readOnly}
        />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {(["front", "back"] as const).map(view => (
          <div key={view} className="rounded-lg border border-white/8 bg-white/[0.02] p-2">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">
              {view === "front" ? "Chọn nhanh mặt trước" : "Chọn nhanh mặt sau"}
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueMuscleGroups
                .filter(group => muscleGroups.some(item => item.id === group.id && item.view === view))
                .map(group => {
                  const active = selectedIds.includes(group.id);
                  return (
                    <button
                      key={`${view}-${group.id}`}
                      type="button"
                      aria-pressed={active}
                      disabled={readOnly}
                      onClick={() => handleToggle(group.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        active
                          ? "border-[#FF3B3B] bg-[#FF3B3B] text-white shadow-[0_0_18px_rgba(255,59,59,0.26)]"
                          : "border-white/10 bg-black/20 text-white/65 hover:border-[#FF3B3B]/50 hover:text-white"
                      } ${readOnly ? "cursor-default disabled:opacity-100" : ""}`}
                    >
                      {group.displayLabel}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">Nhóm cơ đã chọn</div>
        {selectedIds.length ? (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map(id => {
              const label = getMuscleGroupDisplayLabel(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleToggle(id)}
                  disabled={readOnly}
                  className={`rounded-full border border-[#FF3B3B]/45 bg-[#FF3B3B]/15 px-3 py-1.5 text-xs font-bold text-[#FFD6D6] hover:bg-[#FF3B3B]/25 ${readOnly ? "cursor-default disabled:opacity-100" : ""}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-black/15 p-3 text-xs font-semibold text-white/35">
            Chưa chọn nhóm cơ nào.
          </div>
        )}
      </div>
    </div>
  );
}
