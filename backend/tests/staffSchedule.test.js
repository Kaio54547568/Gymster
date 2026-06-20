import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import server from "../server.js";
import * as staffScheduleService from "../services/staffScheduleService.js";
import * as adminStaffService from "../services/adminStaffService.js";
import * as requestAuthService from "../services/requestAuthService.js";

vi.mock("../services/staffScheduleService.js", () => ({
  listStaffSchedules: vi.fn(),
  getStaffSchedule: vi.fn(),
  replaceStaffSchedule: vi.fn(),
  listStaffSchedulesForSlot: vi.fn(),
  getStaffScheduleByUserId: vi.fn(),
}));

vi.mock("../services/adminStaffService.js", () => ({
  checkEmployeeCodeUnique: vi.fn(),
  createAdminStaff: vi.fn(),
  getAdminStaffDetail: vi.fn(),
  updateAdminStaff: vi.fn(),
}));

vi.mock("../services/requestAuthService.js", () => ({
  authenticateRequest: vi.fn(),
}));

describe("Staff Schedule & Profile Update API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestAuthService.authenticateRequest.mockResolvedValue({
      ok: true,
      client: {},
      user: { user_id: "user-1", role: "staff" },
    });
  });

  describe("GET /api/admin/staff-schedules", () => {
    it("returns list of schedules", async () => {
      const mockData = [
        {
          employeeId: "emp-1",
          fullName: "Staff John",
          schedules: [{ id: "sch-1", dayOfWeek: "monday", shiftCode: "shift_1", status: "active" }],
        },
      ];
      staffScheduleService.listStaffSchedules.mockResolvedValue({
        ok: true,
        data: mockData,
      });

      const res = await request(server).get("/api/admin/staff-schedules");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(mockData);
    });
  });

  describe("GET /api/admin/staff-schedules/slot", () => {
    it("returns active staff for a specific slot", async () => {
      const mockStaff = [{ employeeId: "emp-1", fullName: "John Doe" }];
      staffScheduleService.listStaffSchedulesForSlot.mockResolvedValue({
        ok: true,
        data: mockStaff,
      });

      const res = await request(server)
        .get("/api/admin/staff-schedules/slot")
        .query({ day: "monday", shift: "shift_1" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(mockStaff);
      expect(staffScheduleService.listStaffSchedulesForSlot).toHaveBeenCalledWith("monday", "shift_1");
    });
  });

  describe("GET /api/staff/my-work-schedule", () => {
    it("returns active schedules for logged in staff", async () => {
      const mockSchedule = [{ id: "sch-1", dayOfWeek: "monday", shiftCode: "shift_1", status: "active" }];
      staffScheduleService.getStaffScheduleByUserId.mockResolvedValue({
        ok: true,
        data: mockSchedule,
      });

      const res = await request(server)
        .get("/api/staff/my-work-schedule")
        .query({ userId: "spoofed-user" })
        .set("Authorization", "Bearer test-token");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(mockSchedule);
      expect(staffScheduleService.getStaffScheduleByUserId).toHaveBeenCalledWith("user-1", {});
    });
  });

  describe("GET /api/admin/staff/:id/schedule", () => {
    it("returns weekly schedule of employee", async () => {
      const mockSchedule = [{ id: "sch-1", dayOfWeek: "tuesday", shiftCode: "shift_2", status: "active" }];
      staffScheduleService.getStaffSchedule.mockResolvedValue({
        ok: true,
        data: mockSchedule,
      });

      const res = await request(server).get("/api/admin/staff/emp-1/schedule");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual(mockSchedule);
      expect(staffScheduleService.getStaffSchedule).toHaveBeenCalledWith("emp-1");
    });
  });

  describe("PUT /api/admin/staff/:id/schedule", () => {
    it("updates schedule of employee", async () => {
      staffScheduleService.replaceStaffSchedule.mockResolvedValue({ ok: true });
      const payload = { selections: [{ dayOfWeek: "monday", shiftCode: "shift_1" }] };

      const res = await request(server).put("/api/admin/staff/emp-1/schedule").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(staffScheduleService.replaceStaffSchedule).toHaveBeenCalledWith("emp-1", payload.selections);
    });
  });

  describe("PUT /api/admin/staff/:id", () => {
    it("updates profile and schedule of staff", async () => {
      adminStaffService.updateAdminStaff.mockResolvedValue({ ok: true });
      const payload = {
        fullName: "Jane Doe",
        phone: "0912345678",
        role: "staff",
        workingSchedule: [{ dayOfWeek: "tuesday", shiftCode: "shift_3" }],
      };

      const res = await request(server).put("/api/admin/staff/emp-1").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(adminStaffService.updateAdminStaff).toHaveBeenCalledWith("emp-1", payload);
    });
  });
});
