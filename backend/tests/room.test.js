import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import server from "../server.js";
import * as roomService from "../services/roomService.js";

vi.mock("../services/roomService.js", () => ({
  listRooms: vi.fn(),
  getRoomStats: vi.fn(),
  createRoom: vi.fn(),
  updateRoom: vi.fn(),
  deleteRoom: vi.fn(),
}));

describe("Room API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/rooms", () => {
    it("returns list of rooms", async () => {
      roomService.listRooms.mockResolvedValue({
        ok: true,
        data: [{ id: "room-1", roomCode: "ROOM-01", roomName: "Yoga Room", roomType: "yoga", capacity: 20, status: "active", equipmentCount: 2 }],
      });

      const res = await request(server).get("/api/rooms");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data[0].roomName).toBe("Yoga Room");
    });
  });

  describe("GET /api/rooms/stats", () => {
    it("returns room stats", async () => {
      roomService.getRoomStats.mockResolvedValue({
        ok: true,
        data: { total: 5, active: 4, maintenance: 1, inactive: 0 },
      });

      const res = await request(server).get("/api/rooms/stats");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.active).toBe(4);
    });
  });

  describe("POST /api/rooms", () => {
    it("creates a new room", async () => {
      const payload = {
        roomCode: "ROOM-01",
        roomName: "Yoga Room",
        roomType: "yoga",
        capacity: 20,
        status: "active",
      };

      roomService.createRoom.mockResolvedValue({
        ok: true,
        data: { ...payload, id: "room-1", equipmentCount: 0 },
      });

      const res = await request(server).post("/api/rooms").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.roomCode).toBe("ROOM-01");
    });

    it("returns 400 when missing fields or capacity is negative", async () => {
      roomService.createRoom.mockResolvedValue({
        ok: false,
        status: 400,
        message: "Capacity must be a non-negative integer.",
      });

      const res = await request(server).post("/api/rooms").send({ capacity: -1 });
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
    });
  });

  describe("PUT /api/rooms/:id", () => {
    it("updates an existing room", async () => {
      const payload = {
        roomName: "Updated Name",
        roomType: "strength",
        capacity: 25,
        status: "active",
      };

      roomService.updateRoom.mockResolvedValue({
        ok: true,
        data: { id: "room-1", roomCode: "ROOM-01", ...payload, equipmentCount: 0 },
      });

      const res = await request(server).put("/api/rooms/room-1").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.roomName).toBe("Updated Name");
    });
  });

  describe("DELETE /api/rooms/:id", () => {
    it("deletes a room with no equipment", async () => {
      roomService.deleteRoom.mockResolvedValue({ ok: true });

      const res = await request(server).delete("/api/rooms/room-1");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns 409 when room has associated equipment/reports", async () => {
      roomService.deleteRoom.mockResolvedValue({
        ok: false,
        status: 409,
        message: "Room is in use by gym equipment. Please change room status to Inactive instead.",
      });

      const res = await request(server).delete("/api/rooms/room-1");
      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.message).toContain("Inactive");
    });
  });
});
