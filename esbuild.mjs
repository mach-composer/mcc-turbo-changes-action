import { build } from "esbuild";

await build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: ["node20"],
  outdir: "./dist",
  banner: {
    // Needed to fix a bug in esbuild around using ESM only, see: https://github.com/evanw/esbuild/pull/2067 for more information
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});
