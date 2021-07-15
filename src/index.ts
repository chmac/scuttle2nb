#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs/promises";
import { join } from "path";
import * as dsv from "d3-dsv";
import slugify from "slugify";
import execa from "execa";

const program = new Command();

program
  .requiredOption("-d --data-path <path>", "Path to the scuttle .txt files")
  .option("-p --prefix <path>", "Database table (and text filename) prefix", "")
  .option(
    "-o --offline",
    "Perform all operations offline (bypasses nb commands)"
  )
  .option("-v --verbose", "Log more messages as the script proceeds")
  .option("--dry-run", "Show the operations without performing them");

program.parse(process.argv);

const options = program.opts();

const NOISY = options.verbose;
const TABLE_PREFIX = options.prefix || "";
const OFFLINE_MODE = options.offline || false;
const DATA_PATH = options.dataPath;
const DRY_RUN = options.dryRun || false;

const loadFile = async (path: string) => {
  const text = await fs.readFile(path, { encoding: "utf8" });
  const rows = dsv.tsvParseRows(text);
  return rows;
};

const parseUser = (row: string[]) => {
  return {
    id: row[0],
    username: row[1],
    name: row[5],
    email: row[6],
    homepage: row[7],
  };
};

const parseBookmark = (row: string[]) => {
  return {
    id: row[0],
    userId: row[1],
    status: row[3],
    createdAt: row[4],
    updatedAt: row[5],
    title: row[6],
    url: row[7],
    description: row[8] || "",
  };
};

const parseTag = (row: string[]) => {
  return {
    id: row[0],
    bookmarkId: row[1],
    tag: row[2],
  };
};

const isEmpty = (input: string) => {
  if (input === "") {
    return true;
  }
  if (input === `\n`) {
    return true;
  }
  if (input === "\\N") {
    return true;
  }
  return false;
};

const backslashSpaces = (input: string) => {
  return input.replaceAll(" ", `\ `);
};

const loadRawData = async () => {
  const users = await loadFile(join(DATA_PATH, `${TABLE_PREFIX}users.txt`));
  const bookmarks = await loadFile(
    join(DATA_PATH, `${TABLE_PREFIX}bookmarks.txt`)
  );
  const tags = await loadFile(join(DATA_PATH, `${TABLE_PREFIX}tags.txt`));
  return { users, bookmarks, tags };
};

type Bookmark = ReturnType<typeof parseBookmark> & {
  tags: string[];
};

const createBookmarkWithNb = async (bookmark: Bookmark) => {
  const args = [bookmark.url, "--skip-content"];

  if (!isEmpty(bookmark.description)) {
    args.push("--comment", backslashSpaces(bookmark.description));
  }

  if (bookmark.tags.length > 0) {
    args.push("--tags", bookmark.tags.join(","));
  }

  args.push("--title", backslashSpaces(bookmark.title));

  if (NOISY) console.log("nb arguments #OU0uPy", args);

  if (!DRY_RUN) {
    await execa("nb", args);
  }
};

const createBookmarkOffline = async (bookmark: Bookmark) => {
  const { title, url, description, createdAt, tags } = bookmark;

  const descriptionMarkdown = isEmpty(description)
    ? ""
    : `
## Description

${description}

`;
  const tagsMarkdown =
    tags.length === 0 ? "" : `## Tags\n\n#${tags.join(" #")}`;

  const markdown = `# ${title}

<${url}>
${descriptionMarkdown}${tagsMarkdown}`;

  const filename =
    createdAt.replace(" ", "_").replaceAll(":", "-") + ".bookmark.md";

  await fs.writeFile(filename, markdown, { encoding: "utf8" });
  execa("echo", [filename, ">>", ".index"], { shell: true });

  execa("git", ["add", filename]);
  execa("git", ["add", ".index"]);
  execa("git", [
    "commit",
    "--message=[scuttle2nb] Importing bookmark",
    `--date=${createdAt} +0000`,
  ]);
};

(async function () {
  const stat = await fs.stat(DATA_PATH);
  if (!stat.isDirectory()) {
    throw new Error("--data-path is not a directory #EFsfLw");
  }

  const data = await loadRawData();

  const users = data.users.map(parseUser);
  const bookmarks = data.bookmarks.map(parseBookmark);
  const tags = data.tags.map(parseTag);

  for (const user of users) {
    if (NOISY) console.log(`Starting user id ${user.id} #lsIGRg`, user);

    // Get all the bookmarks for this user
    const userBookmarks = bookmarks.filter(({ userId }) => userId === user.id);
    if (NOISY)
      console.log(`User has ${userBookmarks.length} bookmarks #06WPf0`);

    // Add all the tags to each bookmark
    const userBookmarksWithTags = bookmarks.map((bookmark) => {
      const bookmarkTags = tags.filter((tag) => tag.bookmarkId === bookmark.id);
      const tagNames = bookmarkTags.map((tag) =>
        slugify(tag.tag.replace(":", "-"))
      );
      return {
        ...bookmark,
        tags: tagNames,
      };
    });

    for (const bookmark of userBookmarksWithTags) {
      if (NOISY)
        console.log(`Adding bookmark #t0bBl3 ${bookmark.id} ${bookmark.url}`);

      if (OFFLINE_MODE) {
        await createBookmarkOffline(bookmark);
      } else {
        await createBookmarkWithNb(bookmark);
      }

      if (NOISY)
        console.log(`Bookmark added #0T87PH ${bookmark.id} ${bookmark.url}`);
    }
  }
})().catch((error) => {
  console.error("Program cashed. #nWBKtP");
  console.error(error);
});
