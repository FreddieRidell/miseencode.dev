#!/usr/bin/env node

function readStdin() {
  return new Promise((resolve, reject) => {
    // Check if stdin is being piped (not a TTY)
    if (process.stdin.isTTY) {
      resolve(null); // No piped input
      return;
    }

    let input = "";

    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      input += chunk;
    });

    process.stdin.on("end", () => {
      resolve(input);
    });

    process.stdin.on("error", (err) => {
      reject(err);
    });
  });
}

(async function main() {
  const paths = new Set();
  const stdin = await readStdin();

  if (!stdin) return;
  for (const line of stdin.split("\n")) {
    try {
      const evt = JSON.parse(line);
      for (const tag of evt.tags) {
        if (tag.kind === "path") {
          paths.add(tag.absolute);
        }
      }
    } catch {}
  }

  console.log(paths);
})();
