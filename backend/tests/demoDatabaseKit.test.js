import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { validateResetConfirmation } from "../scripts/resetDemoAuthUsers.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const demoDir = path.join(root, "database", "demo");

describe("demo database kit", () => {
  it("contains the four standalone SQL files", () => {
    expect([
      "00_reset_public.sql",
      "01_complete_schema.sql",
      "02_demo_seed.sql",
      "03_verify_demo.sql",
    ].every((name) => fs.existsSync(path.join(demoDir, name)))).toBe(true);
  });

  it("requires the exact destructive reset confirmation", () => {
    expect(validateResetConfirmation(["--confirm", "wrong"])).toBe(false);
    expect(validateResetConfirmation(["--confirm", "RESET_GYMSTER_DEMO"])).toBe(true);
  });

  it("auth sync secures seeded plaintext passwords after provisioning", () => {
    const script = fs.readFileSync(path.join(root, "backend", "scripts", "syncSupabaseAuthUsers.js"), "utf8");
    expect(script).toContain("bcrypt.hash");
    expect(script).toContain("password_hash: passwordHash");
  });

  it("is standalone and contains the required consolidated features", () => {
    const schema = fs.readFileSync(path.join(demoDir, "01_complete_schema.sql"), "utf8");
    const seed = fs.readFileSync(path.join(demoDir, "02_demo_seed.sql"), "utf8");
    expect(schema).not.toMatch(/\\i[r]?\s/);
    expect(seed).not.toMatch(/\\i[r]?\s/);
    for (const required of [
      "package_promotions",
      "trainer_slot_reservations",
      "performance_reviews",
      "member_usage_history",
      "gymster_complete_package_purchase",
      "gymster_add_workout_rpc",
    ]) {
      expect(schema).toContain(required);
    }
    expect((seed.match(/\.demo@gymster\.local/g) || []).length).toBeGreaterThanOrEqual(12);
  });
});
