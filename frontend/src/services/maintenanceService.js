const MAINTENANCE_REPORTS_KEY = "gymster_maintenance_reports";

const seedReports = [
  {
    id: "MR-001",
    equipmentName: "Treadmill X12 #5",
    room: "Cardio Area",
    issueDescription: "Belt stops suddenly during running speed changes.",
    reportedDate: "2026-05-12",
    reportedBy: "Le Quoc Bao",
    severity: "High",
    status: "In Repair",
    maintenanceNote: "Motor belt inspected. Replacement part ordered.",
    history: [
      { date: "2026-05-12", action: "Reported by staff", note: "Marked as high severity." },
      { date: "2026-05-13", action: "Moved to repair", note: "Technician assigned." },
    ],
  },
  {
    id: "MR-002",
    equipmentName: "Lat Pulldown Machine",
    room: "Strength Zone A",
    issueDescription: "Cable feels stuck and does not return smoothly.",
    reportedDate: "2026-05-14",
    reportedBy: "Nguyen Van Minh",
    severity: "Medium",
    status: "In Review",
    maintenanceNote: "Waiting for technical inspection.",
    history: [
      { date: "2026-05-14", action: "Reported by PT", note: "Member reported resistance issue." },
    ],
  },
  {
    id: "MR-003",
    equipmentName: "Rowing Machine #3",
    room: "Cardio Area",
    issueDescription: "Display panel is not turning on.",
    reportedDate: "2026-05-09",
    reportedBy: "Admin",
    severity: "Low",
    status: "Fixed",
    maintenanceNote: "Battery connector replaced and tested.",
    history: [
      { date: "2026-05-09", action: "Reported", note: "Display panel issue logged." },
      { date: "2026-05-10", action: "Fixed", note: "Battery connector replaced." },
    ],
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getMaintenanceReports() {
  if (!canUseStorage()) return seedReports;

  const storedReports = window.localStorage.getItem(MAINTENANCE_REPORTS_KEY);
  if (storedReports) return JSON.parse(storedReports);

  window.localStorage.setItem(MAINTENANCE_REPORTS_KEY, JSON.stringify(seedReports));
  return seedReports;
}

export function saveMaintenanceReports(reports) {
  if (canUseStorage()) {
    window.localStorage.setItem(MAINTENANCE_REPORTS_KEY, JSON.stringify(reports));
  }
}

export function createMaintenanceReport(payload) {
  const reports = getMaintenanceReports();
  const today = new Date().toISOString().slice(0, 10);
  const nextReport = {
    id: `MR-${Date.now().toString().slice(-6)}`,
    reportedDate: today,
    status: "Reported",
    maintenanceNote: "",
    history: [{ date: today, action: "Reported", note: payload.issueDescription }],
    ...payload,
  };

  saveMaintenanceReports([nextReport, ...reports]);
  return nextReport;
}

export function updateMaintenanceReport(id, updates) {
  const today = new Date().toISOString().slice(0, 10);
  const reports = getMaintenanceReports();
  const nextReports = reports.map((report) => {
    if (report.id !== id) return report;

    const history = [
      ...(report.history || []),
      {
        date: today,
        action: updates.status ? `Status updated to ${updates.status}` : "Maintenance note updated",
        note: updates.maintenanceNote || report.maintenanceNote || "",
      },
    ];

    return { ...report, ...updates, history };
  });

  saveMaintenanceReports(nextReports);
  return nextReports;
}
