import { it } from "vitest"
import { gitCheck } from "./check"
import { PackageConfig } from "./config"
import { expect } from "vitest"


it("should pass", async () => {
  const result = await gitCheck(["src/check.ts", "src/check.test.ts"], "3f0ca33")
  expect(result).toBe(true)
})
