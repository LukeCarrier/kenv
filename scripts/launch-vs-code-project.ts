// Name: Launch VS Code Project

import { spawn } from "child_process";
import { PathLike } from "fs";
import "path";
import { homedir, platform } from "os";
import { fileURLToPath } from "url";

import "@johnlindquist/kit";
import sqlite3 from "sqlite3";

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
    case "darwin": return path.join(homedir(), "Library/Application Support/Code/User/globalStorage/state.vscdb");
    default:       throw new Error(`Unsupported platform: ${platform}`);
  }
}

const dbPath = findVsCodeStateDb(platform());
const db = new sqlite3.Database(dbPath);
db.get("SELECT value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList'", async (_err, row) => {
  const recents = JSON.parse(row.value) as RecentPaths;
  const projects = recents.entries.flatMap((r) => {
    if (r.folderUri && r.folderUri.startsWith("file://")) {
      return [fileURLToPath(r.folderUri)];
    } else if (r.workspace) {
      return [fileURLToPath(r.workspace.configPath)];
    } else {
      return [];
    }
  });

  const project = await arg("Open project", projects);
  await spawn("code", [project]);
});