const { execSync } = require("child_process");
const readline = require("readline");

const parseArgs = () => {
  const a = process.argv.slice(2);
  const modSlug = a.find((v) => !v.startsWith("--"));
  const i = a.indexOf(modSlug) + 1;
  const version = a[i] && !a[i].startsWith("--") ? a[i] : null;
  const reason = a[i + 1] && !a[i + 1].startsWith("--") ? a[i + 1] : null;
  return { modSlug, version, reason, dryRun: a.includes("--dry-run") };
};

const confirm = (msg) => new Promise((res) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(msg, (a) => {
    rl.close();
    res(["yes", "y", "confirm"].includes(a.trim().toLowerCase()));
  });
});

const runCommands = (cmds) => {
  for (const cmd of cmds) {
    console.log(`> ${cmd}`);
    const out = execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    if (out?.toString().trim()) console.log(out.toString().trim());
  }
};

const validate = (cmds) => {
  const bad = ["--force", "reset --hard", "clean", "rebase", "rm ", "checkout"];
  for (const c of cmds) for (const b of bad)
    if (c.includes(b)) {
      console.error(`\n[BLOCK] "${b}" detected in "${c}"`);
      process.exit(1);
    }
};

(async () => {
  const { modSlug, version, reason, dryRun } = parseArgs();
  if (!modSlug || !version) {
    console.error("Usage: node release.js <modSlug> <version> [reason] [--dry-run]");
    process.exit(1);
  }
  const tag = `${modSlug}-v${version}`;
  const cmds = [
    `npm run zip -- ${modSlug}`,
    `git add ${modSlug} ${modSlug}.zip`,
    `git commit -m "${modSlug} v${version}"`,
    `git push`,
    `git tag ${tag}`,
    `git push origin ${tag}`,
  ];
  const optional = [
    `gh release create ${tag} ${modSlug}.zip --title "${modSlug} v${version}" --notes "${reason ?? "Auto release."}" || gh release upload ${tag} ${modSlug}.zip --clobber`
  ];
  validate(cmds);
  console.log("\nGit Actions:\n");
  cmds.forEach((c) => console.log(` * ${c}`));
  console.log("\n---------------------------------");
  if (dryRun) return console.log("\nDry run activated.");
  let executed = false;
  if (await confirm('Type "yes" or "confirm" to execute: ')) {
    try {
      console.log("\nExecuting...\n");
      runCommands(cmds);
      console.log("\nRelease completed!");
      executed = true;
    } catch (e) {
      console.error("\nExecution Failed!");
      console.error(`\nCommand: ${e.cmd}`);
      console.error(e.stderr ? e.stderr.toString().trim() : e.message);
      process.exit(1);
    }
  } else {
    console.log("\nSkipped git step.");
  }
  if (!executed) return console.log("\nSkipping optional (no git step).");
  if (!(await confirm('Run optional release step? ')))
    return console.log("\nSkipped optional.");
  try {
    console.log("\nExecuting optional...\n");
    runCommands(optional);
    console.log("\nOptional completed!");
  } catch (e) {
    console.error("\nOptional Failed!");
    console.error(`\nCommand: ${e.cmd}`);
    console.error(e.stderr ? e.stderr.toString().trim() : e.message);
    process.exit(1);
  }
})();