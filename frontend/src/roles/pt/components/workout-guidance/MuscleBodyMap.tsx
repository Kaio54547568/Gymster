import type { KeyboardEvent } from "react";
import type { MuscleGroupDefinition, MuscleGroupId, MuscleView } from "./muscleGroups";

interface MuscleBodyMapProps {
  groups: MuscleGroupDefinition[];
  selectedIds: MuscleGroupId[];
  title: string;
  view: MuscleView;
  onToggle: (id: MuscleGroupId) => void;
  readOnly?: boolean;
}

function handleKeyboardToggle(event: KeyboardEvent<SVGGElement>, onToggle: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onToggle();
}

function BodyOutline({ view }: { view: MuscleView }) {
  const back = view === "back";

  return (
    <g pointerEvents="none" fill="none" stroke="rgba(255,255,255,0.56)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M96 38 C96 21 124 21 124 38 C124 55 119 65 110 65 C101 65 96 55 96 38 Z" strokeWidth="1.8" />
      <path d="M100 62 L96 78 M120 62 L124 78" strokeWidth="1.4" />
      <path d="M96 75 C85 78 75 84 67 96 C62 120 60 148 64 176 C67 192 80 200 93 203" strokeWidth="1.7" />
      <path d="M124 75 C135 78 145 84 153 96 C158 120 160 148 156 176 C153 192 140 200 127 203" strokeWidth="1.7" />
      <path d="M78 94 C71 118 71 145 77 183 C82 196 92 200 110 201 C128 200 138 196 143 183 C149 145 149 118 142 94" strokeWidth="1.6" />
      <path d="M69 101 C55 111 48 130 44 151 C40 170 35 190 31 211" strokeWidth="1.7" />
      <path d="M151 101 C165 111 172 130 176 151 C180 170 185 190 189 211" strokeWidth="1.7" />
      <path d="M31 211 C27 224 33 233 42 225 M189 211 C193 224 187 233 178 225" strokeWidth="1.6" />
      <path d="M92 202 C83 223 75 255 75 294 C75 321 71 339 65 351" strokeWidth="1.7" />
      <path d="M128 202 C137 223 145 255 145 294 C145 321 149 339 155 351" strokeWidth="1.7" />
      <path d="M101 205 C96 244 96 284 97 332 C92 343 84 352 72 350" strokeWidth="1.3" />
      <path d="M119 205 C124 244 124 284 123 332 C128 343 136 352 148 350" strokeWidth="1.3" />
      <path d="M88 224 C99 238 104 257 101 281" strokeWidth="0.9" opacity="0.55" />
      <path d="M132 224 C121 238 116 257 119 281" strokeWidth="0.9" opacity="0.55" />
      {back ? (
        <>
          <path d="M90 86 C98 101 102 125 101 187" strokeWidth="0.9" opacity="0.55" />
          <path d="M130 86 C122 101 118 125 119 187" strokeWidth="0.9" opacity="0.55" />
          <path d="M80 96 C94 112 103 129 110 190 C117 129 126 112 140 96" strokeWidth="0.9" opacity="0.5" />
        </>
      ) : (
        <>
          <path d="M110 92 L110 186" strokeWidth="0.9" opacity="0.55" />
          <path d="M91 123 C100 129 120 129 129 123" strokeWidth="0.9" opacity="0.55" />
          <path d="M94 147 C102 153 118 153 126 147" strokeWidth="0.9" opacity="0.55" />
          <path d="M97 170 C104 176 116 176 123 170" strokeWidth="0.9" opacity="0.55" />
        </>
      )}
    </g>
  );
}

export default function MuscleBodyMap({ groups, selectedIds, title, view, onToggle, readOnly = false }: MuscleBodyMapProps) {
  const gradientId = `muscle-selected-${view}`;
  const glowId = `muscle-glow-${view}`;

  return (
    <section className="rounded-xl border border-white/8 bg-[#111]/80 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[#BDBDBD]">{title}</h4>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#FF3B3B]">Rê chuột / chọn</span>
      </div>
      <svg
        viewBox="0 0 220 360"
        className="mx-auto block h-[330px] w-full max-w-[300px]"
        role="img"
        aria-label={`${title} selectable muscle map`}
      >
        <defs>
          <radialGradient id={gradientId} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#FFB3B3" stopOpacity="0.95" />
            <stop offset="58%" stopColor="#FF3B3B" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#B40020" stopOpacity="0.72" />
          </radialGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 1 0 0 0 0 0.1 0 0 0 0 0.16 0 0 0 0.72 0"
              result="redGlow"
            />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {groups.map(group => {
          const selected = selectedIds.includes(group.id);
          return (
            <g
              key={`${view}-${group.id}`}
              role="button"
              tabIndex={readOnly ? -1 : 0}
              aria-label={`Chọn nhóm cơ ${group.displayLabel}`}
              aria-pressed={selected}
              aria-disabled={readOnly}
              className={`group outline-none ${readOnly ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => {
                if (!readOnly) onToggle(group.id);
              }}
              onKeyDown={(event) => {
                if (!readOnly) handleKeyboardToggle(event, () => onToggle(group.id));
              }}
            >
              <title>{group.displayLabel}</title>
              {group.areas.map((area, index) => (
                <path
                  key={`${group.id}-${index}`}
                  d={area.d}
                  fill={selected ? `url(#${gradientId})` : "rgba(255,255,255,0.035)"}
                  stroke={selected ? "#FF8A8A" : "rgba(255,255,255,0.16)"}
                  strokeWidth={selected ? 1.5 : 1}
                  filter={selected ? `url(#${glowId})` : undefined}
                  className={`transition duration-150 group-focus:stroke-[#FFB3B3] ${
                    selected ? "opacity-100" : "group-hover:fill-[#FF3B3B] group-hover:opacity-80"
                  }`}
                />
              ))}
            </g>
          );
        })}

        <BodyOutline view={view} />
      </svg>
    </section>
  );
}
