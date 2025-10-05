#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";
import readline from "readline";

const cmd = "pnpm";
const args = ["exec", "vite", "--clearScreen=false"];

const vite = spawn(cmd, args, {
  cwd: process.cwd(),
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

// Match "FILE  path:line" or "FILE  path:line:col"
const fileRegex =
  /FILE\s+(([A-Za-z]:[\\/][^\s:]+|\.[\\/][^\s:]+|\/[^\s:]+)):(\d+)(?::(\d+))?/g;

function stripAnsi(s) {
  return s.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
}

function linkify(raw) {
  const line = stripAnsi(raw);

  return line.replace(fileRegex, (match, filePath, _win, lineNum, colNum) => {
    // Build absolute URI
    const abs = path.resolve(filePath).replace(/\\/g, "/");
    const loc = colNum ? `${abs}:${lineNum}:${colNum}` : `${abs}:${lineNum}`;
    const uri = `file:///${loc}`;

    // ANSI helpers
    const OSC = "\u001b]8;;";
    const ST = "\u001b\\";
    const BLUE = "\u001b[34m";
    const RESET = "\u001b[39m";

    // What text to show — including the "FILE " prefix
    const display = colNum
      ? `FILE ${filePath}:${lineNum}:${colNum}`
      : `FILE ${filePath}:${lineNum}`;

    // OSC8 start, link, OSC8 end, blue text, reset color, OSC8 close
    return OSC + uri + ST + BLUE + display + RESET + OSC + ST;
  });
}

// Pipe stdout
readline
  .createInterface({ input: vite.stdout })
  .on("line", (l) => console.log(linkify(l)));

// Pipe stderr
readline
  .createInterface({ input: vite.stderr })
  .on("line", (l) => console.error(linkify(l)));

vite.on("close", (code) => process.exit(code));
