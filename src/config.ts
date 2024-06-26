import * as yaml from "js-yaml";

export type Config = {
  packages: PackageConfig[];
};

export type PackageConfig = {
  name: string;
  scope: string;
  extraFiles?: string[];
};

export type PackageConfigInput = {
  name: string;
  scope: string;
  "extra-files"?: string[];
};

export const parseConfig = (config: string): Config => {
  const data = yaml.load(config) as Record<string, PackageConfigInput>;
  const result: Config = {
    packages: [],
  };

  for (const [key, value] of Object.entries(data)) {
    result.packages.push({
      name: value.name,
      scope: key,
      extraFiles: value["extra-files"],
    });
  }

  return result;
};

// If we
