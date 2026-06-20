import { describe, expect, it } from "vitest";
import {
  buildStaffMemberUsername,
  prepareStaffMemberCredentials,
  validateStaffMemberCredentials,
} from "../services/memberOperationsService.js";

describe("prepareStaffMemberCredentials", () => {
  it("uses Member@123 when staff leaves the password empty", () => {
    expect(prepareStaffMemberCredentials({
      fullName: "Nguyen Van A",
      email: "member@example.com",
      phoneNumber: "0912345678",
      password: "",
    }).password).toBe("Member@123");
  });

  it("requires staff to provide a valid member email", () => {
    expect(validateStaffMemberCredentials({ email: "" })).toBe("Email is required.");
  });

  it("rejects an invalid member email", () => {
    expect(validateStaffMemberCredentials({ email: "not-an-email" })).toBe("Please enter a valid email address.");
  });

  it("rejects a provided password shorter than eight characters", () => {
    expect(validateStaffMemberCredentials({
      email: "member@example.com",
      password: "short",
    })).toBe("Password must be at least 8 characters.");
  });

  it("generates a database-safe username for long member names", () => {
    expect(buildStaffMemberUsername({
      fullName: "Codex Login Verification With A Very Long Name",
      phoneNumber: "0912345678",
    })).toMatch(/^[A-Za-z0-9][A-Za-z0-9._-]{4,28}[A-Za-z0-9]$/);
  });
});
