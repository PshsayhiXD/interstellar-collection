const { execSync } = require('child_process');
const readline = require('readline');

const args = process.argv.slice(2);
const modSlug = args.find(a => !a.startsWith('--'));
const versionIndex = args.indexOf(modSlug) + 1;
const version = args[versionIndex] && !args[versionIndex].startsWith('--') ? args[versionIndex] : null;
const dryRun = args.includes('--dry-run');

if (!modSlug || !version) {
    console.error('Usage: node release.js <modSlug> <version> [--dry-run]');
    console.error('Example: node release.js oneko 1.1.0');
    process.exit(1);
}

const commands = [
    `git add .`,
    `git commit -m "${modSlug} v${version}"`,
    `git push`,
    `git tag ${modSlug}-v${version}`,
    `git push origin ${modSlug}-v${version}`
];

const destructiveWords = [
    '--force',
    'reset --hard',
    'clean',
    'rebase',
    'rm ',
    'checkout'
];

for (const cmd of commands) {
    for (const bad of destructiveWords) {
        if (cmd.includes(bad)) {
            console.error(`\n[BLOCK] Destructive operation detected in command: "${cmd}"`);
            console.error(`Matched phrase: "${bad}"`);
            console.error('Execution strictly blocked for safety.');
            process.exit(1);
        }
    }
}

console.log('\n## Planned Git Actions:\n');
commands.forEach(cmd => console.log(` * ${cmd}`));
console.log(`\n---------------------------------`);

if (dryRun) {
    console.log('\nDry run activated. Exiting without execution.');
    process.exit(0);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Type "yes" or "confirm" to execute these commands: ', (answer) => {
    rl.close();
    const confirmed = ['yes', 'confirm'].includes(answer.trim().toLowerCase());
    
    if (!confirmed) {
        console.log('\nExecution cancelled by user.');
        process.exit(0);
    }

    console.log('\nExecuting commands...\n');
    try {
        for (const cmd of commands) {
            console.log(`> ${cmd}`);
            const output = execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] });
            if (output && output.toString().trim()) {
                console.log(output.toString().trim());
            }
        }
        console.log('\nRelease successfully completed!');
    } catch (error) {
        console.error('\nExecution Failed!');
        console.error(`\nCommand that failed: ${error.cmd}`);
        console.error('\nError output:');
        console.error(error.stderr ? error.stderr.toString().trim() : error.message);
        process.exit(1);
    }
});
