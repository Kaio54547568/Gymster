import { describe, expect, it } from "vitest";
import { validateAddMemberAccount } from "./addMemberForm";

describe("validateAddMemberAccount", () => {
  it("requires an email address", () => {
    expect(validateAddMemberAccount({ email: "", password: "" })).toEqual({
      email: "Email is required",
    });
  });

  it("rejects an invalid email address", () => {
    expect(validateAddMemberAccount({ email: "member", password: "" })).toEqual({
      email: "Please enter a valid email address",
    });
  });

  it("allows an empty password but rejects a short custom password", () => {
    expect(validateAddMemberAccount({
      email: "member@example.com",
      password: "short",
    })).toEqual({
      password: "Password must be at least 8 characters",
    });
  });
});
