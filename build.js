#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
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
      if (code === 0) {
        done();
      } else {
        fail(code);
      }
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        done();
      } else {
        fail(code);
      }
    });
  });
}

(async function main() {
  const blogs = [];
  for (const blogPostFile of await fs.readdir("./site")) {
    if (blogPostFile === "index.md") continue;
    if (blogPostFile === "posts.md") continue;
    blogs.push(path.join("./site", blogPostFile));
    // pandoc site/index.md --template=getMetaJson
  }

  await fs.writeFile(
    "./site/posts.md",
    [
      ...blogs.map(
        (blogFilePath) =>
          `- [${blogFilePath.replace("site/", "")}](${blogFilePath.replace("site", "").replace(".md", "")})`,
      ),
    ].join("\n"),
  );

  const pages = await glob("./site/**/*.md");

  await Promise.all(
    pages.map(async (pagePath) => {
      let dst = path.join("target", path.relative("site", pagePath));
      dst = dst.replace(path.extname(dst), ".html");

      await fs.mkdir(path.join(dst, ".."), { recursive: true });

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

  await fs.cp("./index.css", "target/index.css");
})();
