import type { KnipConfig } from "knip";

const config: KnipConfig = {
	// Some source files are directly imported by other projects, so we consider
	// them entry points to disable warnings about unused exports.
	entry: ["src/**/*.ts"],
	ignoreDependencies: ["tsx"],
	tags: ["-lintignore"],
};

export default config;
