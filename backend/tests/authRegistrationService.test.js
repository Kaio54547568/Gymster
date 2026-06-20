import { describe, expect, it } from "vitest";
import { getIdentifierLookupColumn } from "../services/authRegistrationService.js";

describe("getIdentifierLookupColumn", () => {
  it("uses only the username column for a username login", () => {
    expect(getIdentifierLookupColumn("owner01")).toBe("username");
  });

  it("uses only the email column for an email login", () => {
    expect(getIdentifierLookupColumn("owner@gymster.local")).toBe("email");
  });
});
