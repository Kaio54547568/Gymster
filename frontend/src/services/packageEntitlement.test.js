import test from "node:test";
import assert from "node:assert/strict";

import { getAllowedLeaveDaysForPackage } from "./packageEntitlement.js";

test("allows two valid leave days per package month", () => {
  assert.equal(getAllowedLeaveDaysForPackage({ packageDurationMonths: 1 }), 2);
  assert.equal(getAllowedLeaveDaysForPackage({ packageDurationMonths: 12 }), 24);
});

test("falls back to one package month when duration is missing", () => {
  assert.equal(getAllowedLeaveDaysForPackage({}), 2);
});
