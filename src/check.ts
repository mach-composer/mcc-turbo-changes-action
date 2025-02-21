import * as exec from "@actions/exec";
import * as core from "@actions/core";
import type { PackageConfig } from "./config";
import stream from "stream";


type TurboPlan = {
  packages: string[]
  tasks: {
    package: string;
    dependencies: string[];
  }[]
}


export const checkForChanges = async (
  pkgConfig: PackageConfig,
  commitHash: string,
): Promise<string[]> => {
  const packages = await turboCheck(pkgConfig.scope, commitHash);
  if (packages.includes(pkgConfig.scope)) {
    return [pkgConfig.scope]
  }

  if (pkgConfig.extraFiles?.length) {
    const hasChanges = await gitCheck(pkgConfig.extraFiles, commitHash);
    if (hasChanges) {
      return [pkgConfig.scope]
    }
  }
  return []
};

const turboPlanCache = new Map<string, TurboPlan>();

// Return a list of package names that are modified since the given commitHash
export const turboCheck = async (
  packageScope: string,
  commitHash: string,
): Promise<string[]> => {
  try {
    const packages = await getTurboChangedPackages(commitHash, packageScope);
    if (packages.length > 0) {
      core.info(
        `Turbo detected package changes since ${commitHash}: ${packages.join(", ")}`,
      );
    }
    return packages;
  } catch (error) {
    core.warning(`Action failed with error: ${error}`);
    return [packageScope]
  }
};

export const getTurboChangedPackages = async (
  commitHash: string,
  packageScope: string,
): Promise<string[]> => {
  const plan = await getTurboPlan(commitHash);
  const affectedPackages = new Set<string>(plan.packages);

  if (!affectedPackages.has(packageScope)) {
    return [];
  }

  const task = plan.tasks.find((task) => task.package === packageScope);
  if (!task) {
    return [packageScope];
  }

  // TODO: need to check if we need to do this recursively
  const dependencies = task.dependencies.map((dep) => dep.split("#")[0]).filter((dep) => affectedPackages.has(dep));

  return [packageScope, ...dependencies];
};


export const getTurboPlan = async (
  commitHash: string,
): Promise<TurboPlan> => {
  const cachedPlan = turboPlanCache.get(commitHash);
  if (cachedPlan) {
    return cachedPlan;
  }

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

    const data = JSON.parse(stdout) as TurboPlan
    turboPlanCache.set(commitHash, data )
    return data
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

/**
 * Returns the intersection of two sets.
 *
 * Note that Node 22 has this built-in, see
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set/intersection
 */
function intersectSets<T>(set1: Set<T>, set2: Set<T>): Set<T> {
	const intersection = new Set<T>();
	for (const item of set1) {
		if (set2.has(item)) {
			intersection.add(item);
		}
	}
	return intersection;
}
