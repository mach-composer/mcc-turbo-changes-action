import * as exec from "@actions/exec";
import * as core from "@actions/core";
import type { PackageConfig } from "./config";

export const checkForChanges = async (
  pkgConfig: PackageConfig,
  commitHash: string
): Promise<boolean> => {
  if (await gitCheck(pkgConfig.extraFiles, commitHash)) {
    return true;
  }

  if (await turboCheck(pkgConfig.scope, commitHash)) {
    return true;
  }

  return false;
};

// Return true if there are changes according to turbo-ignore
export const turboCheck = async (
  packageScope: string,
  commitHash: string
): Promise<boolean> => {
  const command = `pnpm turbo run build --filter="...[${commitHash}]" --dry=json`;
  const options = {
    listeners: {
      stdout: (data: Buffer) => {},
    },
  };

  try {
    const { exitCode, stdout } = await exec.getExecOutput(command, [], options);
    if (exitCode !== 0) {
      core.warning(`Action failed with exit code: ${exitCode}`);
      return true;
    }

    const data = JSON.parse(stdout);
    return data.packages.includes(packageScope);
  } catch (error) {
    core.warning(`Action failed with error: ${error}`);
    return true;
  }
};

// Returns true if there are changes according to git
export const gitCheck = async (
  paths: string[],
  commitHash: string
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
      options
    );

    // If output is not empty, it means there are file changes
    changed = output.trim() !== "";
  } catch (error) {
    core.warning(`Action failed with error: ${error}`);
    return true;
  }

  return changed;
};
