#!/usr/bin/env node

import * as fs from "fs/promises";
import * as dsv from "d3-dsv";
import slugify from "slugify";

const NOISY = false;
const TABLE_PREFIX = "sc_";

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

const loadRawData = async () => {
  const users = await loadFile(`./${TABLE_PREFIX}users.txt`);
  const bookmarks = await loadFile(`./${TABLE_PREFIX}bookmarks.txt`);
  const tags = await loadFile(`./${TABLE_PREFIX}tags.txt`);
  return { users, bookmarks, tags };
};

(async function () {
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
      const description = isEmpty(bookmark.description)
        ? ""
        : ` --comment "${bookmark.description.replace('"', '"')}"`;

      console.log(
        `nb bookmark "${
          bookmark.url
        }" ${description} --tags "${bookmark.tags.join(",")}" --title "${
          bookmark.title
        }" --skip-content`
      );
    }
  }
})();