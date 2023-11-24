import * as exec from "@actions/exec";
import * as core from "@actions/core";
import type { PackageConfig } from "./config";

export const checkForChanges = async (
  pkgConfig: PackageConfig,
  commitHash: string,
): Promise<boolean> => {
  if (await gitCheck(pkgConfig.extraFiles, commitHash)) {
    return true;
  }

  if (await turboCheck(pkgConfig.scope, commitHash)) {
    return true;
  }

  return false;
};

export const turboCheck = async (
  packageScope: string,
  commitHash: string,
): Promise<boolean> => {
  try {
    const exitCode = await exec.exec(
      "./dist/turbo-ignore.cjs",
      [packageScope, `--fallback=${commitHash}`],
      {
        cwd: process.cwd(),
        ignoreReturnCode: true,
        listeners: {
          stdline: (data: string) => {
            core.info(data);
          },
        },
      },
    );

    return exitCode !== 0;
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
    return false;
  }
};

export const gitCheck = async (
  paths: string[],
  commitHash: string,
): Promise<boolean> => {
  let changed = false;

  try {
    let output = "";
    const options: exec.ExecOptions = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    };

    // Run the git diff command to get the list of files changed since the given commit hash
    await exec.exec(
      "git",
      ["diff", "--name-only", commitHash, "HEAD", "--", ...paths],
      options,
    );

    // If output is not empty, it means there are file changes
    changed = output.trim() !== "";
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }

  return changed;
};
