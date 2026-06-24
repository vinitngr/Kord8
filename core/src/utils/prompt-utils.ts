import fs from "fs/promises";
import path from "path";

const MAX_DEPTH = 4;
const MAX_ENTRIES_PER_DIR = 50;
const MAX_TOTAL_LINES = 200;
const MAX_FILE_SIZE_BYTES = 200_000;

export async function getDirectoryStructure(agentPath: string): Promise<string> {
  let totalLines = 0;

  const skillsGitIgnore = await loadSkillsGitIgnore(agentPath);

  async function walk(currentPath: string, depth: number, prefix: string): Promise<string[]> {
    if (depth > MAX_DEPTH) return [];

    let entries;
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      return [`${prefix}- (unable to read directory)`];
    }

    const lines: string[] = [];

    for (const entry of entries.slice(0, MAX_ENTRIES_PER_DIR)) {
      if (HARD_IGNORE.has(entry.name)) continue;
      if (skillsGitIgnore.has(entry.name)) continue;

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isFile()) {
        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > MAX_FILE_SIZE_BYTES) {
            lines.push(`${prefix}- ${entry.name} (skipped: too large)`);
          } else {
            lines.push(`${prefix}- ${entry.name}`);
          }
        } catch {
          lines.push(`${prefix}- ${entry.name}`);
        }
      }

      if (entry.isDirectory()) {
        lines.push(`${prefix}- ${entry.name}/`);
        const subLines = await walk(fullPath, depth + 1, prefix + "  ");
        lines.push(...subLines);
      }

      totalLines++;
      if (totalLines >= MAX_TOTAL_LINES) {
        lines.push(`${prefix}- (... truncated ...)`);
        break;
      }
    }

    return lines;
  }

  const lines = await walk(agentPath, 1, "");
  return lines.join("\n");
}

async function loadSkillsGitIgnore(agentPath: string): Promise<Set<string>> {
  const ignoreSet = new Set<string>();
  const gitignorePath = path.join(agentPath, "skills", ".gitignore");

  try {
    const content = await fs.readFile(gitignorePath, "utf-8");
    content
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .forEach(pattern => {
        ignoreSet.add(pattern);
      });
  } catch {
  }

  return ignoreSet;
}


export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}



const HARD_IGNORE = new Set([
  // === Dependency directories ===
  "node_modules",
  "vendor",
  ".venv",
  "venv",
  "env",
  ".env",
  ".npm",
  ".pnpm-store",
  ".yarn",
  ".bundle",

  // === Version control ===
  ".git",
  ".svn",
  ".hg",

  // === Build outputs ===
  "dist",
  "build",
  "out",
  "target",
  ".next",
  ".nuxt",
  ".output",
  ".parcel-cache",
  ".turbo",
  ".svelte-kit",

  // === Python ===
  "__pycache__",
  ".mypy_cache",
  ".pytest_cache",
  ".tox",
  ".eggs",
  "pip-wheel-metadata",

  // === Java / JVM ===
  ".gradle",
  ".idea",

  // === C / C++ ===
  "CMakeFiles",
  "cmake-build-debug",
  "CMakeCache.txt",

  // === Go ===
  "bin",
  "pkg",

  // === Rust ===
  "target",

  // === Logs & coverage ===
  "coverage",
  "logs",

  // === Caches ===
  ".cache",

  // === OS junk ===
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
]);
