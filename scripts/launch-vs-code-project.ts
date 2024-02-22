// Name: Launch VS Code Project
// Description: Launch a recently opened VS Code workspace or folder

import { spawn } from "child_process";
import { promises as fsp, PathLike } from "fs";
import "path";
import { platform } from "os";
import { fileURLToPath } from "url";

import "@johnlindquist/kit";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

type RecentPaths = { entries: RecentPath[] };
type RecentPath = {
  folderUri?: string,
  workspace?: {
    id: string,
    configPath: string,
  },
  fileUri?: string,
  label?: string,
};

function findVsCodeStateDb(platform: string): PathLike {
  switch (platform) {
    case "darwin": return home("Library", "Application Support", "Code", "User", "globalStorage", "state.vscdb");
    case "win32":  return home("AppData", "Roaming", "Code", "User", "globalStorage", "state.vscdb");
    default:       throw new Error(`Unsupported platform: ${platform}`);
  }
}

const dbPath = findVsCodeStateDb(platform());
const db = await open({ filename: dbPath as string, driver: sqlite3.Database });
const rawRecents = await db.get("SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList'");
const recents = JSON.parse(rawRecents.value) as RecentPaths;

const projects = recents.entries.flatMap((r) => {;
  if (r.folderUri && r.folderUri.startsWith("file://")) {
    return [fileURLToPath(r.folderUri)];
  } else if (r.workspace) {
    return [fileURLToPath(r.workspace.configPath)];
  } else {
    return [];
  }
});

const project = await arg("Open project", projects);
console.log(project);
const rootDir = (await fsp.lstat(project)).isDirectory() ? project : path.dirname(project);
// This ridiculous incantation ensures the spawned process inherits the
// shell's environment.
await spawn("code", [project], { cwd: rootDir, shell: 'bash' });
