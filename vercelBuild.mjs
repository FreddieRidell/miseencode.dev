import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { extract } from "tar";
import { spawn } from "child_process";
import { join } from "path";
import https from "https";
import { execSync } from "child_process";

const pandocUrl = "https://github.com/jgm/pandoc/releases/download/3.8/pandoc-3.8-linux-amd64.tar.gz";
const typstUrl = "https://github.com/typst/typst/releases/download/v0.13.1/typst-x86_64-unknown-linux-musl.tar.xz";

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (downloadUrl) => {
      https
        .get(downloadUrl, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            console.log(`Redirecting to: ${response.headers.location}`);
            follow(response.headers.location);
            return;
          }
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }
          resolve(response);
        })
        .on("error", reject);
    };
    follow(url);
  });
}

async function main() {
  console.log("Downloading pandoc...");
  const pandocStream = await download(pandocUrl);
  await pipeline(pandocStream, createGunzip(), extract({ cwd: process.cwd() }));
  console.log("Pandoc extracted");

  console.log("Downloading typst...");
  execSync(`curl -sL ${typstUrl} | tar xJ --strip-components=1 -C ${process.cwd()}`, { stdio: "inherit" });
  console.log("Typst extracted");

  const pandocBinPath = join(process.cwd(), "pandoc-3.8", "bin");
  const newPath = `${pandocBinPath}:${process.cwd()}:${process.env.PATH}`;

  console.log("Running build.js...");
  const buildProcess = spawn("node", ["build.js"], {
    env: { ...process.env, PATH: newPath },
    stdio: "inherit",
  });

  buildProcess.on("close", (code) => {
    if (code === 0) {
      console.log("Build completed successfully");
    } else {
      console.error(`Build failed with exit code ${code}`);
      process.exit(code);
    }
  });

  buildProcess.on("error", (err) => {
    console.error("Failed to start build process:", err.message);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
