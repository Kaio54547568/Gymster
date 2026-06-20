import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import server from "../server.js";
import * as equipmentService from "../services/equipmentService.js";

vi.mock("../services/equipmentService.js", () => ({
  listEquipments: vi.fn(),
  getEquipmentStats: vi.fn(),
  createEquipment: vi.fn(),
  updateEquipment: vi.fn(),
  deleteEquipment: vi.fn(),
  retireEquipment: vi.fn(),
}));

describe("Equipment API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/equipments", () => {
    it("returns list of equipments", async () => {
      equipmentService.listEquipments.mockResolvedValue({
        ok: true,
        data: [{ id: "eq-1", equipmentName: "Treadmill", origin: "Italy", warrantyExpiryDate: "2026-10-10" }],
      });

      const res = await request(server).get("/api/equipments");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data[0].origin).toBe("Italy");
    });
  });

  describe("POST /api/equipments", () => {
    it("creates a new equipment item", async () => {
      const payload = {
        equipmentCode: "EQ-001",
        equipmentName: "Treadmill",
        category: "Cardio",
        location: "Cardio Zone",
        purchaseDate: "2024-02-10",
        origin: "Italy",
        warrantyExpiryDate: "2026-02-10",
      };

      equipmentService.createEquipment.mockResolvedValue({
        ok: true,
        data: { ...payload, id: "eq-1" },
      });

      const res = await request(server).post("/api/equipments").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.origin).toBe("Italy");
    });

    it("returns 400 if validation fails", async () => {
      equipmentService.createEquipment.mockResolvedValue({
        ok: false,
        status: 400,
        message: "Missing required equipment fields.",
      });

      const res = await request(server).post("/api/equipments").send({});
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe("POST /api/equipments/:id/retire", () => {
    it("retires an equipment item and returns status retired", async () => {
      equipmentService.retireEquipment.mockResolvedValue({
        ok: true,
        data: { id: "eq-1", status: "Retired", rawStatus: "retired" },
      });

      const res = await request(server).post("/api/equipments/eq-1/retire");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe("Retired");
      expect(res.body.data.rawStatus).toBe("retired");
    });
  });
});
