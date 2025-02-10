import * as exec from "@actions/exec";
import * as core from "@actions/core";
import type { PackageConfig } from "./config";
import stream from "stream";



export const checkForChanges = async (
  pkgConfig: PackageConfig,
  commitHash: string,
): Promise<string[]> => {
  const packages = await turboCheck(pkgConfig.scope, commitHash);
  if (packages.includes(pkgConfig.name)) {
    return packages
  }

  if (pkgConfig.extraFiles?.length) {
    const hasChanges = await gitCheck(pkgConfig.extraFiles, commitHash);
    if (hasChanges) {
      return [pkgConfig.name]
    }
  }
  return []
};

const turboCache = new Map<string, string[]>();

// Return a list of package names that are modified since the given commitHash
export const turboCheck = async (
  packageScope: string,
  commitHash: string,
): Promise<string[]> => {
  if (!turboCache.has(commitHash)) {
    try {
      const packages = await getTurboChangedPackages(commitHash);
      turboCache.set(commitHash, packages);
    } catch (error) {
      core.warning(`Action failed with error: ${error}`);
      return [packageScope]
    }
  }

  const packages = turboCache.get(commitHash) ?? []
  if (packages.length > 0) {
    core.info(
      `Turbo detected package changes since ${commitHash}: ${packages.join(", ")}`,
    );
  } else {
    core.info(`Turbo did not detect changes since ${commitHash}`);
  }
  return packages;
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
      TURBO_TELEMETRY_DISABLED: '1', // disable printing telemetry message which breaks the json output
      TURBO_PRINT_VERSION_DISABLED: '1', // disable printing turbo version which breaks the json output
      ...process.env
    },
    outStream: nullStream,
    failOnStdErr: true,
  };

  try {
    const { exitCode, stdout } = await exec.getExecOutput(command, [], options);
    if (exitCode !== 0) {
      throw new Error(`Failed to run turbo: ${stdout}`);
    }

    const data = JSON.parse(stdout);
    const packages: string[] = data.packages;

    // Ignore the root package
    return packages.filter((pkg: string) => pkg !== "//");
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
