import { execFileSync, spawnSync } from "node:child_process";

const BIOME_VERSION = "2.5.6";
const SUPPORTED = /\.(?:[cm]?[jt]sx?|json)$/i;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function lines(value) {
  return value ? value.split("\n").filter(Boolean) : [];
}

function changedFiles() {
  const base = process.env.LINT_BASE_SHA?.trim();

  if (base && !/^0+$/.test(base)) {
    try {
      return lines(git(["diff", "--name-only", "--diff-filter=ACMR", `${base}...HEAD`]));
    } catch (error) {
      console.warn(`Unable to diff from LINT_BASE_SHA=${base}; falling back to local changes.`);
    }
  }

  const tracked = lines(git(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]));
  const untracked = lines(git(["ls-files", "--others", "--exclude-standard"]));
  return [...tracked, ...untracked];
}

const files = [...new Set(changedFiles())].filter((file) => SUPPORTED.test(file));

if (files.length === 0) {
  console.log("No changed JavaScript/TypeScript/JSON files to lint.");
  process.exit(0);
}

console.log(`Linting ${files.length} changed file(s):`);
for (const file of files) console.log(`  ${file}`);

const write = process.argv.includes("--write");
const command = write ? ["check", "--write"] : ["lint"];
const result = spawnSync(
  "npx",
  ["--yes", `@biomejs/biome@${BIOME_VERSION}`, ...command, "--max-diagnostics=200", ...files],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
