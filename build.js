#!/usr/bin/env node

import fs from "fs/promises";
import pathLib from "path";
import { spawn } from "node:child_process";
import { glob } from "glob";

function $(cmd, ...args) {
  console.log(cmd, ...args);
  return new Promise((done, fail) => {
    const proc = spawn(cmd, args);

    proc.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    proc.on("close", (code) => {
      if (code === 0) done();
      else fail(code);
    });

    proc.on("exit", (code) => {
      if (code === 0) done();
      else fail(code);
    });
  });
}

async function writeFile(path, contents) {
  await fs.mkdir(pathLib.dirname(path), { recursive: true });
  await fs.writeFile(path, contents);
}

(async function main() {
  const blogs = [];
  for (const blogPostFile of await fs.readdir("./site")) {
    if (blogPostFile === "index.md") continue;
    if (blogPostFile === "posts.md") continue;
    blogs.push(pathLib.join("./site", blogPostFile));
  }

  await writeFile(
    "./site/posts.md",
    [
      "---",
      "title: Codé én Posts",
      "---",

      ...blogs.map(
        (blogFilePath) =>
          `- [${blogFilePath.replace("site/", "")}](${blogFilePath.replace("site", "").replace(".md", "")})`,
      ),
    ].join("\n"),
  );

  const pages = await glob("./site/**/*.md");

  await Promise.all(
    pages.map(async (pagePath) => {
      let dst = pathLib.join("target", pathLib.relative("site", pagePath));

      dst = dst.replace(pathLib.extname(dst), "");

      if (!dst.endsWith("index")) dst = pathLib.join(dst, "index.html");
      else dst = dst + ".html";

      await fs.mkdir(pathLib.join(dst, ".."), { recursive: true });

      return $(
        "pandoc",
        "--number-sections",
        "--from",
        "markdown-markdown_in_html_blocks+raw_attribute",
        "--standalone",
        "--template=template.html",
        "-i",
        pagePath,
        "-o",
        dst,
      );
    }),
  );

  await Promise.all(
    ["base", "sm.layout", "lg.layout", "light.color", "dark.color"].map((name) =>
      fs.cp(`./${name}.css`, `target/${name}.css`),
    ),
  );
})();
