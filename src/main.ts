import * as core from "@actions/core";
import { Config, parseConfig } from "./config";
import { checkForChanges } from "./check";
import { Client } from "./mcc";

type Inputs = {
  config: Config;
  mccClientID: string;
  mccClientSecret: string;
  mccOrganization: string;
  mccProject: string;
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
      const commitHash = await client.getLatestVersion(pkgConfig.name);
      const hasChanges = commitHash
        ? await checkForChanges(pkgConfig, commitHash)
        : true;

      if (hasChanges) {
        core.info(`Changes detected in ${pkgConfig.scope}`);
        result.push(pkgConfig.scope);
      }
    }

    core.setOutput("changes", result);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

const readInputs = (): Inputs => {
  return {
    config: parseConfig(core.getInput("config")),
    mccClientID: core.getInput("mcc_client_id"),
    mccClientSecret: core.getInput("mcc_client_secret"),
    mccOrganization: core.getInput("mcc_organization"),
    mccProject: core.getInput("mcc_project"),
  };
};
