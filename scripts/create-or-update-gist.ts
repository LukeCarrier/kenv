// Name: Create or update Gist

import "@johnlindquist/kit";
import { readFile } from "fs/promises";
import { basename } from "path";
import shellWords from "shellwords";
import * as glob from "glob";
import { Octokit } from "@octokit/core";

type Gist = {
  name: string,
  fileGlobs: string[],
  gistId: string,
}

const gistDb = await db("./gists.json", { defaultName: "", defaultGlob: "/*", gists: [] });
await gistDb.read();

const gistOrName = await arg({
  placeholder: "Gist name",
  input: gistDb.defaultName,
  strict: false,
  choices: gistDb.data.gists,
});
let gist: Gist;
if (typeof gistOrName === "string") {
  const fileGlobs = shellWords.split(
    await arg({
      placeholder: "File globs",
      input: gistDb.defaultGlob,
      strict: false,
      async choices(input: string) {
        const globs = shellWords.split(input);
        const choices = await glob.glob(globs);
        return choices.map(c => ({ name: c, value: input }));
      },
    }, "Start typing to see matching files")
  );
  gist = { name: gistOrName, fileGlobs, gistId: null };
  gistDb.data.gists.push(gist);
} else {
  gist = gistDb.data.gists.find(g => g.name === (gistOrName as Gist).name);
}

const filePaths = await glob.glob(gist.fileGlobs);
const files = {};
for (let filePath of filePaths) {
  const filename = basename(filePath);
  files[filename] = { content: await readFile(filePath, "utf-8") };
}

const octokit = new Octokit({ auth: await env("GITHUB_SCRIPTKIT_TOKEN") });
const headers = {
  "X-GitHub-Api-Version": "2022-11-28",
};
let result;
if (gist.gistId) {
  result = await octokit.request("PATCH /gists/{gist_id}", {
    gist_id: gist.gistId,
    files,
    headers,
  });
} else {
  result = await octokit.request("POST /gists", {
    description: gist.name,
    public: false,
    files,
    headers,
  });
  gist.gistId = result.data.id;
  await gistDb.write();
}

clipboard.writeText(result.data.html_url);
