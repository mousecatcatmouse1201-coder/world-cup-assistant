import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectRoot, "dist-cn");
const filesToCopy = [
  "index.html",
  "style.css",
  "script.js",
  "data/matches.json",
  "data/teams.json"
];

async function buildChinaMirror() {
  console.log("正在生成国内静态镜像目录...");

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(path.join(outputDirectory, "data"), { recursive: true });

  for (const relativePath of filesToCopy) {
    const sourcePath = path.join(projectRoot, relativePath);
    const destinationPath = path.join(outputDirectory, relativePath);
    await cp(sourcePath, destinationPath);
    console.log(`已复制：${relativePath}`);
  }

  const outputIndexPath = path.join(outputDirectory, "index.html");
  const outputIndex = await readFile(outputIndexPath, "utf8");
  const staticIndex = outputIndex.replace(
    '<meta name="deployment-mode" content="api-first" />',
    '<meta name="deployment-mode" content="static" />'
  );

  if (staticIndex === outputIndex) {
    throw new Error("无法设置国内镜像的静态部署模式");
  }

  await writeFile(outputIndexPath, staticIndex, "utf8");

  console.log("生成完成。");
  console.log("上传目录为 dist-cn/");
}

buildChinaMirror().catch((error) => {
  console.error(`生成失败：${error.message}`);
  process.exitCode = 1;
});
