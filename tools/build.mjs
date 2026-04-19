import { build } from "esbuild";
import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const scriptsDir = path.join(rootDir, "scripts");
const stylesDir = path.join(rootDir, "styles");
const scriptsSrcDir = path.join(scriptsDir, "src");
const stylesSrcDir = path.join(stylesDir, "src");

const excludedRootDirs = new Set([".git", "node_modules", "dist", "tools"]);
const excludedRootFiles = new Set([
  ".gitignore",
  "index.html",
  "LICENSE",
  "package.json",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "tailwind.config.cjs"
]);

const allowedStaticExtensions = new Set([
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".webm",
  ".webp",
  ".gif",
  ".svg",
  ".ico",
  ".avif",
  ".mp3",
  ".wav",
  ".ogg",
  ".mp4"
]);

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dirPath, predicate, output = []) {
  if (!(await exists(dirPath))) {
    return output;
  }

  const dirEntries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of dirEntries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(fullPath, predicate, output);
      continue;
    }

    if (entry.isFile() && predicate(fullPath)) {
      output.push(fullPath);
    }
  }

  return output;
}

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function compileJavaScript() {
  if (!(await exists(scriptsSrcDir))) {
    return;
  }

  const scriptEntries = (await fs.readdir(scriptsSrcDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".min.js"))
    .map((entry) => path.join(scriptsSrcDir, entry.name));

  if (!scriptEntries.length) {
    return;
  }

  for (const jsFile of scriptEntries) {
    const entryName = path.basename(jsFile);
    const outputFile = path.join(scriptsDir, "min", entryName.replace(/\.js$/i, ".min.js"));
    await ensureParentDir(outputFile);

    await build({
      entryPoints: [jsFile],
      outfile: outputFile,
      bundle: true,
      minify: true,
      platform: "browser",
      format: "iife",
      target: ["es2018"],
      drop: ["console", "debugger"],
      legalComments: "none",
      logLevel: "silent"
    });
  }
}

async function compileCss() {
  const cssFiles = await walkFiles(
    stylesSrcDir,
    (filePath) =>
      filePath.endsWith(".css") &&
      !filePath.endsWith(".min.css") &&
      path.basename(filePath) !== "tailwind.css" &&
      !normalizePath(filePath).includes("/min/")
  );

  if (!cssFiles.length) {
    return;
  }

  for (const cssFile of cssFiles) {
    const relativeFile = path.relative(stylesSrcDir, cssFile);
    const outputFile = path.join(stylesDir, "min", relativeFile).replace(/\.css$/i, ".min.css");
    await ensureParentDir(outputFile);

    await build({
      entryPoints: [cssFile],
      outfile: outputFile,
      bundle: true,
      minify: true,
      legalComments: "none",
      logLevel: "silent"
    });
  }
}

async function copyFileToDist(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  const targetPath = path.join(distDir, relativePath);
  await ensureParentDir(targetPath);

  await fs.copyFile(filePath, targetPath);
}

function shouldCopyStaticAsset(filePath) {
  const fileNameLower = path.basename(filePath).toLowerCase();
  if (fileNameLower.endsWith(".min.js") || fileNameLower.endsWith(".min.css")) {
    return true;
  }

  const extension = path.extname(fileNameLower);
  return allowedStaticExtensions.has(extension);
}

async function copyStaticFilesFromRoot(currentDir = rootDir) {
  const dirEntries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of dirEntries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (currentDir === rootDir && excludedRootDirs.has(entry.name)) {
        continue;
      }

      await copyStaticFilesFromRoot(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (currentDir === rootDir && excludedRootFiles.has(entry.name)) {
      continue;
    }

    if (!shouldCopyStaticAsset(fullPath)) {
      continue;
    }

    await copyFileToDist(fullPath);
  }
}

async function main() {
  await compileJavaScript();
  await compileCss();
  await copyStaticFilesFromRoot();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});