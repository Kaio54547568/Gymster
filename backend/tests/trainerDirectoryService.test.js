import { describe, expect, it } from "vitest";
import { applyActiveMemberCounts } from "../services/trainerDirectoryService.js";

describe("applyActiveMemberCounts", () => {
  it("uses active trainer assignment counts instead of stale trainer counters", () => {
    expect(applyActiveMemberCounts([
      {
        id: "trainer-1",
        name: "Nhi Tran",
        currentActiveMembers: 0,
        maxActiveMembers: 8,
      },
    ], {
      "trainer-1": 1,
    })).toEqual([
      expect.objectContaining({
        id: "trainer-1",
        currentActiveMembers: 1,
        maxActiveMembers: 8,
      }),
    ]);
  });
});
