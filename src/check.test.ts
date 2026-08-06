import * as exec from "@actions/exec";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { gitCheck, turboCheck } from "./check";

vi.mock("@actions/exec");

describe("gitCheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("gitCheck", async () => {
		vi.mocked(exec.exec).mockImplementation((_cmd, _args, options) => {
			options?.listeners?.stdout?.(Buffer.from("src/check.ts\n"));
			return Promise.resolve(0);
		});

		const result = await gitCheck(
			["src/check.ts", "src/check.test.ts"],
			"3f0ca33",
		);

		expect(result).toBe(true);

		expect(exec.exec).toHaveBeenCalledWith(
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
		vi.mocked(exec.exec).mockImplementation((_cmd, _args, options) => {
			options?.listeners?.stdout?.(Buffer.from("src/check.ts\n"));
			return Promise.resolve(0);
		});

		const result = await gitCheck(undefined, "3f0ca33");

		expect(result).toBe(true);

		expect(exec.exec).toHaveBeenCalledWith(
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
