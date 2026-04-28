import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import archiver from "archiver";
import { minify } from "html-minifier-terser";
import { transform } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const releaseDir = path.join(rootDir, "release");
const srcDir = path.join(rootDir, "src");
const localeDir = path.join(rootDir, "_locales");
const assetsDir = path.join(rootDir, "assets");
const manifestPath = path.join(rootDir, "manifest.json");
const packageJsonPath = path.join(rootDir, "package.json");
const versionStatePath = path.join(rootDir, ".chrome-version-state.json");
const shouldZip = process.argv.includes("--zip");

function getUtcDayOfYear(date) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const currentDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.floor((currentDay - startOfYear) / 86400000) + 1;
}

function compareVersionParts(leftParts, rightParts) {
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;

    if (leftValue === rightValue) {
      continue;
    }

    return leftValue > rightValue ? 1 : -1;
  }

  return 0;
}

function parseVersion(version) {
  return String(version || "")
    .split(".")
    .map((segment) => Number.parseInt(segment, 10))
    .filter((segment) => Number.isInteger(segment) && segment >= 0);
}

function getVersionBase(packageJson, manifest) {
  const configuredBase = packageJson.chromeVersionBase || manifest.version;
  const baseParts = parseVersion(configuredBase).slice(0, 2);

  if (baseParts.length !== 2) {
    throw new Error("chromeVersionBase precisa ter major.minor, por exemplo 1.1");
  }

  return baseParts;
}

async function readVersionState() {
  try {
    const state = JSON.parse(await fs.promises.readFile(versionStatePath, "utf8"));
    return {
      lastVersion: typeof state.lastVersion === "string" ? state.lastVersion : null
    };
  } catch {
    return { lastVersion: null };
  }
}

async function writeVersionState(version) {
  await fs.promises.writeFile(
    versionStatePath,
    `${JSON.stringify({ lastVersion: version }, null, 2)}\n`,
    "utf8"
  );
}

async function generateChromeVersion(packageJson, manifest) {
  const [major, minor] = getVersionBase(packageJson, manifest);
  const state = await readVersionState();
  const now = new Date();
  const dayCode = (now.getUTCFullYear() % 100) * 1000 + getUtcDayOfYear(now);
  let buildSlot = now.getUTCHours() * 600 + now.getUTCMinutes() * 10;
  const lastParts = parseVersion(state.lastVersion);

  if (lastParts.length === 4 && lastParts[0] === major && lastParts[1] === minor && lastParts[2] === dayCode) {
    buildSlot = Math.max(buildSlot, lastParts[3] + 1);
  }

  if (buildSlot > 65535) {
    throw new Error("Numero de build excedeu o limite do Chrome para a quarta parte da versao");
  }

  const nextParts = [major, minor, dayCode, buildSlot];

  if (lastParts.length === 4 && compareVersionParts(nextParts, lastParts) <= 0) {
    throw new Error("Nao foi possivel gerar uma versao monotonicamente crescente para a extensao");
  }

  return nextParts.join(".");
}

async function removeDirectory(directoryPath) {
  await fs.promises.rm(directoryPath, { recursive: true, force: true });
}

async function ensureDirectory(directoryPath) {
  await fs.promises.mkdir(directoryPath, { recursive: true });
}

async function copyDirectory(sourceDir, destinationDir) {
  await fs.promises.cp(sourceDir, destinationDir, { recursive: true });
}

async function listFilesRecursively(directoryPath) {
  const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...await listFilesRecursively(absolutePath));
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

async function writeTransformedFile(sourcePath) {
  const relativePath = path.relative(rootDir, sourcePath);
  const destinationPath = path.join(distDir, relativePath);
  const fileContents = await fs.promises.readFile(sourcePath, "utf8");
  const extension = path.extname(sourcePath).toLowerCase();

  await ensureDirectory(path.dirname(destinationPath));

  if (extension === ".js") {
    const result = await transform(fileContents, {
      loader: "js",
      format: "iife",
      minify: true,
      legalComments: "none",
      target: "chrome120"
    });

    await fs.promises.writeFile(destinationPath, result.code, "utf8");
    return;
  }

  if (extension === ".css") {
    const result = await transform(fileContents, {
      loader: "css",
      minify: true,
      legalComments: "none",
      target: "chrome120"
    });

    await fs.promises.writeFile(destinationPath, result.code, "utf8");
    return;
  }

  if (extension === ".html") {
    const minifiedHtml = await minify(fileContents, {
      collapseWhitespace: true,
      keepClosingSlash: true,
      minifyCSS: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      useShortDoctype: true
    });

    await fs.promises.writeFile(destinationPath, `${minifiedHtml}\n`, "utf8");
    return;
  }

  await fs.promises.copyFile(sourcePath, destinationPath);
}

async function buildDist() {
  await removeDirectory(distDir);
  await ensureDirectory(distDir);

  const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf8"));
  const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf8"));
  const generatedVersion = await generateChromeVersion(packageJson, manifest);
  const distManifest = {
    ...manifest,
    version: generatedVersion,
    version_name: `${packageJson.chromeVersionBase || manifest.version}`
  };

  await fs.promises.writeFile(
    path.join(distDir, "manifest.json"),
    `${JSON.stringify(distManifest, null, 2)}\n`,
    "utf8"
  );
  await copyDirectory(localeDir, path.join(distDir, "_locales"));
  await copyDirectory(assetsDir, path.join(distDir, "assets"));

  const sourceFiles = await listFilesRecursively(srcDir);

  for (const sourceFile of sourceFiles) {
    await writeTransformedFile(sourceFile);
  }

  await writeVersionState(generatedVersion);
  return distManifest;
}

async function createZipArchive(manifest) {
  await removeDirectory(releaseDir);
  await ensureDirectory(releaseDir);

  const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, "utf8"));
  const releaseName = typeof manifest.name === "string" && !manifest.name.startsWith("__MSG_")
    ? manifest.name
    : packageJson.name;
  const safeName = String(releaseName || "chrome-extension")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "chrome-extension";
  const archiveFileName = `${safeName}-v${manifest.version}.zip`;
  const archivePath = path.join(releaseDir, archiveFileName);
  const output = fs.createWriteStream(archivePath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.directory(distDir, false);
  archive.finalize();
  await pipeline(archive, output);

  return archivePath;
}

async function main() {
  const manifest = await buildDist();

  if (!shouldZip) {
    console.log(`Build concluido em ${path.relative(rootDir, distDir)} com versao ${manifest.version}`);
    return;
  }

  const archivePath = await createZipArchive(manifest);
  console.log(`Pacote gerado em ${path.relative(rootDir, archivePath)} com versao ${manifest.version}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});