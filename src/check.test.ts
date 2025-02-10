import { describe, it, vi } from "vitest";
import { gitCheck, turboCheck } from "./check";
import { expect } from "vitest";
import * as exec from "@actions/exec";
import { listeners } from "process";

describe("gitCheck", () => {
  it("gitCheck", async () => {
    const spy = vi.spyOn(exec, "exec");

    const result = await gitCheck(
      ["src/check.ts", "src/check.test.ts"],
      "3f0ca33",
    );

    expect(result).toBe(true);

    expect(spy).toHaveBeenCalledWith(
      "git",
      [
        "diff",
        "--name-only",
        "3f0ca33",
        "HEAD",
        "--",
        "src/check.ts",
        "src/check.test.ts",
      ],
      {
        listeners: {
          stdout: expect.any(Function),
        },
      },
    );
  });

  it("should handle undefined paths", async () => {
    const spy = vi.spyOn(exec, "exec");

    const result = await gitCheck(undefined, "3f0ca33");

    expect(result).toBe(true);

    expect(spy).toHaveBeenCalledWith(
      "git",
      ["diff", "--name-only", "3f0ca33", "HEAD", "--"],
      {
        listeners: {
          stdout: expect.any(Function),
        },
      },
    );
  });

  it("should pass turbocheck", async () => {
    const result = await turboCheck("foo", "d9203bb9");
    expect(result).toEqual(["foo"]);
  });
});
