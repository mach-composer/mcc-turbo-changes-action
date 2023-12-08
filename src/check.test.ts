import { it } from "vitest";
import { gitCheck, turboCheck } from "./check";
import { expect } from "vitest";

it("gitCheck", async () => {
  const result = await gitCheck(
    ["src/check.ts", "src/check.test.ts"],
    "3f0ca33",
  );
  expect(result).toBe(true);
});

it("should pass turbocheck", async () => {
  const result = await turboCheck("foo", "d9203bb9");
  expect(result).toBe(true);
});
