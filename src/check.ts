import * as exec from "@actions/exec";
import * as core from "@actions/core";
import type { PackageConfig } from "./config";
import stream from "stream";

export const checkForChanges = async (
  pkgConfig: PackageConfig,
  commitHash: string,
): Promise<boolean> => {
  if (
    pkgConfig.extraFiles?.length &&
    (await gitCheck(pkgConfig.extraFiles, commitHash))
  ) {
    return true;
  }

  if (await turboCheck(pkgConfig.scope, commitHash)) {
    return true;
  }

  return false;
};

const turboCache = new Map<string, string[]>();

// Return true if there are changes according to turbo-ignore
export const turboCheck = async (
  packageScope: string,
  commitHash: string,
): Promise<boolean> => {
  if (!turboCache.has(commitHash)) {
    try {
      const packages = await getTurboChangedPackages(commitHash);
      turboCache.set(commitHash, packages);
    } catch (error) {
      core.warning(`Action failed with error: ${error}`);
      return true;
    }
  }

  const hasChanges = turboCache.get(commitHash)?.includes(packageScope) ?? true;
  if (hasChanges) {
    core.info(
      `Turbo detected changes for package ${packageScope} since ${commitHash}`,
    );
  } else {
    core.info(
      `Turbo did not detect changes for package ${packageScope} since ${commitHash}`,
    );
  }
  return hasChanges;
};

export const getTurboChangedPackages = async (
  commitHash: string,
): Promise<string[]> => {
  const nullStream = new stream.Writable({
    write(chunk: never, encoding: never, callback: never) {},
  });

  const command = `pnpm turbo run build --filter="...[${commitHash}]" --dry=json`;
  const options: exec.ExecOptions = {
    env: {
      TURBO_PRINT_VERSION_DISABLED: '1',
      ...process.env
    },
    outStream: nullStream,
    failOnStdErr: true,
  };

  try {
    const { exitCode, stdout } = await exec.getExecOutput(command, [], options);
    if (exitCode !== 0) {
    }

    const data = JSON.parse(stdout);
    return data.packages;
  } catch (error) {
    throw new Error(`Action failed with error: ${error}`);
  }
};

// Returns true if there are changes according to git
export const gitCheck = async (
  paths: string[] | undefined,
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
      ["diff", "--name-only", commitHash, "HEAD", "--", ...(paths || [])],
      options,
    );

    // If output is not empty, it means there are file changes
    changed = output.trim() !== "";
  } catch (error) {
    core.warning(`Action failed with error: ${error}`);
    return true;
  }

  return changed;
};
