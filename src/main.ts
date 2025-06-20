import * as core from "@actions/core";
import {Config, parseConfig} from "./config";
import {checkForChanges} from "./check";
import {Client} from "./mcc";

type Inputs = {
  branch: string;
  config: Config;
  mccClientID: string;
  mccClientSecret: string;
  mccOrganization: string;
  mccProject: string;
  fallbackReference?: string;
  allowComponentNotFound: boolean;
};

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const inputs = readInputs();
    const result: string[] = [];

    const client = new Client({
      clientID: inputs.mccClientID,
      clientSecret: inputs.mccClientSecret,
      organization: inputs.mccOrganization,
      project: inputs.mccProject,
    });

    core.info(
      "Checking for changes: \n" +
      inputs.config.packages.map((pkg) => ` - ${pkg.name}`).join("\n"),
    );

    for (const pkgConfig of inputs.config.packages) {
      core.info(`Processing ${pkgConfig.name}`);
      const commitHash = await client.getLatestVersion(
        pkgConfig.name,
        inputs.branch,
        inputs.allowComponentNotFound,
      );

      // We default to an empty array for affected packages. This indicates that no changes were detected.
      let affectedPackages: string[] = [];

      if (commitHash) {
        // If a commit hash is found, we can check for changes since this commit.
        affectedPackages = await checkForChanges(pkgConfig, commitHash);
      } else if (
        inputs.fallbackReference &&
        inputs.fallbackReference != inputs.branch
      ) {
        // When a fallback reference is given (this can be branch name, a commit or a git tag),
        // we can check for changes using this reference instead.
        affectedPackages = await checkForChanges(
          pkgConfig,
          inputs.fallbackReference,
        );
      } else if (inputs.allowComponentNotFound) {
        // If no commit hash is found and no fallback reference is given, we assume the package has changed.
        affectedPackages = [pkgConfig.scope]
      }

      for (const pkg of affectedPackages) {
        if (!result.includes(pkg)) {
          result.push(pkg);
        }
      }
    }

    core.setOutput("changes", result);
    for (const scope of result) {
      core.info(`Changes detected for ${scope}`);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

const readInputs = (): Inputs => {
  return {
    branch: core.getInput("branch"),
    config: parseConfig(core.getInput("config")),
    mccClientID: core.getInput("mcc_client_id"),
    mccClientSecret: core.getInput("mcc_client_secret"),
    mccOrganization: core.getInput("mcc_organization"),
    mccProject: core.getInput("mcc_project"),
    allowComponentNotFound: core.getBooleanInput("allow_component_not_found"),
  };
};
