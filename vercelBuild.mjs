import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";
import { extract } from "tar";
import { spawn } from "child_process";
import { join } from "path";
import https from "https";

const url = "https://github.com/jgm/pandoc/releases/download/3.8/pandoc-3.8-linux-amd64.tar.gz";

const downloadAndExtract = (downloadUrl) => {
  https
    .get(downloadUrl, async (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Redirecting to: ${response.headers.location}`);
        downloadAndExtract(response.headers.location);
        return;
      }

      if (response.statusCode !== 200) {
        throw new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`);
      }

      await pipeline(response, createGunzip(), extract({ cwd: process.cwd() }));

      console.log("Extraction complete");

      const pandocBinPath = join(process.cwd(), "pandoc-3.8", "bin");
      const newPath = `${pandocBinPath}:${process.env.PATH}`;

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
    })
    .on("error", (err) => {
      console.error("Download failed:", err.message);
      process.exit(1);
    });
};

downloadAndExtract(url);
