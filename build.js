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

    proc.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
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

function typstEscape(s) {
  return s.replace(/[#\[\]\\]/g, (c) => "\\" + c);
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
    const src = await fs.readFile(pathLib.join("./site", blogPostFile), "utf-8");
    const fm = src.match(/^---\n([\s\S]*?)\n---/);
    if (fm && /^hidden:\s*true$/m.test(fm[1])) continue;
    blogs.push(pathLib.join("./site", blogPostFile));
  }

  await writeFile(
    "./site/index.md",
    [
      "---",
      "title: Codé én Placé",
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

      const pageSlug = pathLib.relative("site", pagePath).replace(/\.md$/, "").replace(/\\/g, "/");

      return $(
        "pandoc",
        "--number-sections",
        "--from",
        "markdown-markdown_in_html_blocks+raw_attribute",
        "--standalone",
        "--template=template.html",
        "--variable",
        `pageslug:${pageSlug}`,
        "-i",
        pagePath,
        "-o",
        dst,
      );
    }),
  );

  await Promise.all([
    ...["base", "sm.layout", "lg.layout", "light.color", "dark.color", "fonts"].map((name) =>
      fs.cp(`./${name}.css`, `target/${name}.css`),
    ),
    fs.cp("./assets/fonts", "target/fonts", { recursive: true }),
  ]);

  await Promise.all(
    pages.map(async (pagePath) => {
      const src = await fs.readFile(pagePath, "utf-8");
      const fm = src.match(/^---\n([\s\S]*?)\n---/);
      if (!fm) return;

      const title = fm[1].match(/^title:\s*(.+)$/m)?.[1]?.trim();
      if (!title) return;
      const subtitle = fm[1].match(/^subtitle:\s*(.+)$/m)?.[1]?.trim();
      const published = fm[1].match(/^published:\s*(.+)$/m)?.[1]?.trim();

      const slug = pathLib.relative("site", pagePath).replace(/\.md$/, "").replace(/\\/g, "/");
      const typstPath = `target/img/social/${slug}.typ`;
      const pngPath = `target/img/social/${slug}.png`;

      await fs.mkdir(pathLib.dirname(typstPath), { recursive: true });

      await writeFile(
        typstPath,
        [
          `#set page(width: 1200pt, height: 630pt, margin: 60pt, fill: oklch(16%, 0.005, 285.823deg))`,
          `#set text(fill: oklch(92.8%, 0.006, 264.531deg), font: "Nunito Sans")`,
          ``,
          `#align(left + top)[#text(size: 96pt, weight: "bold")[${typstEscape(title)}]]`,
          subtitle ? `#align(left + bottom)[#text(size: 72pt)[${typstEscape(subtitle)}]]` : "",
          `#align(bottom)[#grid(columns: (1fr, 1fr), align: (left, right), text(size: 48pt)[codeenplace.dev], text(size: 48pt)[${published ? typstEscape(published) : ""}])]`,
        ]
          .filter(Boolean)
          .join("\n"),
      );

      return $("typst", "compile", "--font-path", "assets/fonts/nunito-sans", "--format", "png", typstPath, pngPath);
    }),
  );

  const faviconSizes = [32, 180, 192, 512];
  await fs.mkdir("target/img/favicon", { recursive: true });

  await Promise.all(
    faviconSizes.map(async (size) => {
      const fontSize = Math.round(size * 0.45);
      const typstPath = `target/img/favicon/favicon-${size}.typ`;
      const pngPath = `target/img/favicon/favicon-${size}.png`;

      await writeFile(
        typstPath,
        [
          `#set page(width: ${size}pt, height: ${size}pt, margin: 0pt, fill: oklch(16%, 0.005, 285.823deg))`,
          `#set text(fill: oklch(92.8%, 0.006, 264.531deg), font: "Nunito Sans")`,
          `#align(center + horizon)[#text(size: ${fontSize}pt, weight: "bold")[CèP]]`,
        ].join("\n"),
      );

      return $("typst", "compile", "--font-path", "assets/fonts/nunito-sans", "--ppi", "72", "--format", "png", typstPath, pngPath);
    }),
  );
})();
