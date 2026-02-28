#!/usr/bin/env node
// scripts/install.js — Advise Bun users to skip unnecessary native deps

const isBun =
    !!process.versions.bun ||
    (process.env.npm_config_user_agent || '').startsWith('bun');

if (isBun) {
    console.log(
        '\n\x1b[36mℹ paeanclaw:\x1b[0m Bun detected — ' +
        'better-sqlite3 is not needed (bun:sqlite is used instead).\n' +
        '  Tip: install with \x1b[1mbun install --no-optional\x1b[0m to skip native compilation.\n'
    );
}
