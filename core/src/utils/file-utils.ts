import fs from "fs/promises";
import path from "path";

export interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

const IGNORE_LIST = new Set([
  "node_modules",
  ".git",
  ".agentTeam",
  "dist",
  "build",
  ".DS_Store",
  "__pycache__",
]);

const IGNORE_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
  ".exe", ".dll", ".so", ".dylib", ".bin", ".obj", ".o",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".pyc", ".pyo", ".pyd",
  ".map",
]);

export async function getRecursiveStructure(dirPath: string, relativePath: string = ""): Promise<FileNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (IGNORE_LIST.has(entry.name)) continue;
    if (entry.isFile() && IGNORE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

    const fullPath = path.join(dirPath, entry.name);
    const rel = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: "directory",
        children: await getRecursiveStructure(fullPath, rel),
      });
    } else {
      nodes.push({
        name: entry.name,
        type: "file",
      });
    }
  }

  // Sort: directories first, then files alphabetically
  return nodes.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "directory" ? -1 : 1;
  });
}

export async function getFileContent(filePath: string): Promise<string> {
  return await fs.readFile(filePath, "utf-8");
}
