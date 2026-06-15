import { test, expect } from "vitest";

import { getAllowedLeaveDaysForPackage } from "./packageEntitlement.js";

test("allows two valid leave days per package month", () => {
  expect(getAllowedLeaveDaysForPackage({ packageDurationMonths: 1 })).toBe(2);
  expect(getAllowedLeaveDaysForPackage({ packageDurationMonths: 12 })).toBe(24);
});

test("falls back to one package month when duration is missing", () => {
  expect(getAllowedLeaveDaysForPackage({})).toBe(2);
});
