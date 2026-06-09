export type MuscleView = "front" | "back";

export type MuscleGroupId =
  | "neck"
  | "shoulders"
  | "chest"
  | "biceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "calves"
  | "traps"
  | "upper_back"
  | "lats"
  | "lower_back"
  | "triceps"
  | "glutes"
  | "hamstrings";

export interface MuscleArea {
  d: string;
}

export interface MuscleGroupDefinition {
  id: MuscleGroupId;
  label: string;
  displayLabel: string;
  view: MuscleView;
  aliases?: string[];
  areas: MuscleArea[];
}

export const muscleGroups: MuscleGroupDefinition[] = [
  {
    id: "neck",
    label: "Neck",
    displayLabel: "Cổ",
    view: "front",
    aliases: ["Cổ"],
    areas: [{ d: "M98 43 C105 50 115 50 122 43 L120 62 C113 68 107 68 100 62 Z" }],
  },
  {
    id: "shoulders",
    label: "Shoulders",
    displayLabel: "Vai",
    view: "front",
    aliases: ["Vai"],
    areas: [
      { d: "M70 76 C58 80 47 89 43 102 C56 104 67 99 77 88 Z" },
      { d: "M150 76 C162 80 173 89 177 102 C164 104 153 99 143 88 Z" },
    ],
  },
  {
    id: "chest",
    label: "Chest",
    displayLabel: "Ngực",
    view: "front",
    aliases: ["Ngực"],
    areas: [
      { d: "M79 84 C93 80 104 85 108 96 L108 120 C91 119 79 110 75 96 Z" },
      { d: "M112 96 C116 85 127 80 141 84 L145 96 C141 110 129 119 112 120 Z" },
    ],
  },
  {
    id: "biceps",
    label: "Biceps",
    displayLabel: "Tay trước",
    view: "front",
    aliases: ["Tay trước"],
    areas: [
      { d: "M48 106 C57 104 63 111 62 127 C60 139 53 150 45 153 C41 139 42 119 48 106 Z" },
      { d: "M172 106 C163 104 157 111 158 127 C160 139 167 150 175 153 C179 139 178 119 172 106 Z" },
    ],
  },
  {
    id: "forearms",
    label: "Forearms",
    displayLabel: "Cẳng tay",
    view: "front",
    aliases: ["Cẳng tay"],
    areas: [
      { d: "M42 155 C50 156 56 165 54 181 L45 222 C38 217 34 208 35 197 Z" },
      { d: "M178 155 C170 156 164 165 166 181 L175 222 C182 217 186 208 185 197 Z" },
    ],
  },
  {
    id: "abs",
    label: "Abs",
    displayLabel: "Bụng",
    view: "front",
    aliases: ["Bụng"],
    areas: [{ d: "M94 123 C103 127 117 127 126 123 L130 180 C120 187 100 187 90 180 Z" }],
  },
  {
    id: "obliques",
    label: "Obliques",
    displayLabel: "Cơ liên sườn",
    view: "front",
    aliases: ["Side Abs", "Bụng bên", "Cơ liên sườn"],
    areas: [
      { d: "M76 120 C83 126 88 144 89 178 C81 171 74 153 70 131 Z" },
      { d: "M144 120 C137 126 132 144 131 178 C139 171 146 153 150 131 Z" },
    ],
  },
  {
    id: "quads",
    label: "Quads",
    displayLabel: "Đùi trước",
    view: "front",
    aliases: ["Quadriceps", "Đùi trước"],
    areas: [
      { d: "M80 188 C95 190 103 205 100 233 L94 283 C81 272 75 240 76 210 Z" },
      { d: "M140 188 C125 190 117 205 120 233 L126 283 C139 272 145 240 144 210 Z" },
    ],
  },
  {
    id: "calves",
    label: "Calves",
    displayLabel: "Bắp chân",
    view: "front",
    aliases: ["Bắp chân"],
    areas: [
      { d: "M78 280 C91 283 96 301 92 325 C89 340 81 345 75 332 C72 312 72 293 78 280 Z" },
      { d: "M142 280 C129 283 124 301 128 325 C131 340 139 345 145 332 C148 312 148 293 142 280 Z" },
    ],
  },
  {
    id: "traps",
    label: "Traps",
    displayLabel: "Cầu vai",
    view: "back",
    aliases: ["Cầu vai"],
    areas: [{ d: "M91 64 C101 75 119 75 129 64 L136 91 C122 101 98 101 84 91 Z" }],
  },
  {
    id: "upper_back",
    label: "Upper Back",
    displayLabel: "Lưng trên",
    view: "back",
    aliases: ["Lưng trên"],
    areas: [
      { d: "M77 89 C92 94 102 106 107 130 L89 143 C79 132 73 113 72 98 Z" },
      { d: "M143 89 C128 94 118 106 113 130 L131 143 C141 132 147 113 148 98 Z" },
    ],
  },
  {
    id: "lats",
    label: "Lats",
    displayLabel: "Xô",
    view: "back",
    aliases: ["Xô", "Cơ xô"],
    areas: [
      { d: "M72 117 C86 130 93 148 92 177 C80 169 71 151 65 132 Z" },
      { d: "M148 117 C134 130 127 148 128 177 C140 169 149 151 155 132 Z" },
    ],
  },
  {
    id: "lower_back",
    label: "Lower Back",
    displayLabel: "Lưng dưới",
    view: "back",
    aliases: ["Lưng dưới"],
    areas: [{ d: "M91 144 C102 150 118 150 129 144 L128 187 C116 194 104 194 92 187 Z" }],
  },
  {
    id: "triceps",
    label: "Triceps",
    displayLabel: "Tay sau",
    view: "back",
    aliases: ["Tay sau"],
    areas: [
      { d: "M47 107 C58 105 64 116 61 136 C58 148 52 158 45 160 C41 144 41 121 47 107 Z" },
      { d: "M173 107 C162 105 156 116 159 136 C162 148 168 158 175 160 C179 144 179 121 173 107 Z" },
    ],
  },
  {
    id: "glutes",
    label: "Glutes",
    displayLabel: "Mông",
    view: "back",
    aliases: ["Mông"],
    areas: [
      { d: "M83 188 C97 184 108 190 109 204 C104 219 92 226 80 217 C75 205 76 195 83 188 Z" },
      { d: "M137 188 C123 184 112 190 111 204 C116 219 128 226 140 217 C145 205 144 195 137 188 Z" },
    ],
  },
  {
    id: "hamstrings",
    label: "Hamstrings",
    displayLabel: "Đùi sau",
    view: "back",
    aliases: ["Đùi sau"],
    areas: [
      { d: "M79 218 C92 222 98 239 96 263 L92 293 C80 285 74 255 75 233 Z" },
      { d: "M141 218 C128 222 122 239 124 263 L128 293 C140 285 146 255 145 233 Z" },
    ],
  },
  {
    id: "calves",
    label: "Calves",
    displayLabel: "Bắp chân",
    view: "back",
    aliases: ["Bắp chân"],
    areas: [
      { d: "M78 286 C90 288 95 306 92 329 C88 343 81 347 75 335 C72 315 72 298 78 286 Z" },
      { d: "M142 286 C130 288 125 306 128 329 C132 343 139 347 145 335 C148 315 148 298 142 286 Z" },
    ],
  },
];

export const uniqueMuscleGroups = Array.from(
  new Map(muscleGroups.map(group => [group.id, group])).values()
);

export function getMuscleGroupLabel(id: MuscleGroupId) {
  return uniqueMuscleGroups.find(group => group.id === id)?.label || id;
}

export function getMuscleGroupDisplayLabel(id: MuscleGroupId) {
  const group = uniqueMuscleGroups.find(item => item.id === id);
  return group?.displayLabel || group?.label || id;
}

export function parseMuscleGroupValue(value: string): MuscleGroupId[] {
  const selected = String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  return Array.from(new Set(selected.flatMap(item => {
    const normalized = item.toLowerCase();
    const match = uniqueMuscleGroups.find(group => (
      group.id === normalized ||
      group.label.toLowerCase() === normalized ||
      group.displayLabel.toLowerCase() === normalized ||
      group.aliases?.some(alias => alias.toLowerCase() === normalized)
    ));
    return match ? [match.id] : [];
  })));
}

export function formatMuscleGroupValue(ids: MuscleGroupId[]) {
  return ids.map(getMuscleGroupLabel).join(", ");
}
