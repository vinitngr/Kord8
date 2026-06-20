import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDirectoryStructure, getFormattedDate } from "../../src/utils/prompt-utils";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("prompt-utils", () => {
  describe("getFormattedDate", () => {
    it("should return a string in the correct format", () => {
      const dateStr = getFormattedDate();
      const parts = dateStr.split(", ");
      expect(parts.length).toBe(3);
      
      const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      expect(weekdays.some(w => parts[0].includes(w))).toBe(true);
      
      // Should contain Month Day
      const monthPart = parts[1].split(" ");
      expect(monthPart.length).toBe(2);
      expect(parseInt(monthPart[1])).toBeGreaterThan(0);
      expect(parseInt(monthPart[1])).toBeLessThanOrEqual(31);
      
      // Should contain Year
      expect(parseInt(parts[2])).toBeGreaterThan(2023);
    });
  });

  describe("getDirectoryStructure", () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-team-test-"));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it("should return a simple directory structure", async () => {
      await fs.writeFile(path.join(tempDir, "file1.txt"), "hello");
      await fs.mkdir(path.join(tempDir, "subdir"));
      await fs.writeFile(path.join(tempDir, "subdir", "file2.txt"), "world");

      const structure = await getDirectoryStructure(tempDir);
      
      expect(structure).toContain("- file1.txt");
      expect(structure).toContain("- subdir/");
      expect(structure).toContain("  - file2.txt");
    });

    it("should respect HARD_IGNORE patterns", async () => {
      await fs.mkdir(path.join(tempDir, "node_modules"));
      await fs.writeFile(path.join(tempDir, "node_modules", "package.json"), "{}");
      await fs.mkdir(path.join(tempDir, ".git"));
      await fs.writeFile(path.join(tempDir, "regular.txt"), "content");

      const structure = await getDirectoryStructure(tempDir);
      
      expect(structure).toContain("- regular.txt");
      expect(structure).not.toContain("node_modules");
      expect(structure).not.toContain(".git");
    });

    it("should respect skills/.gitignore patterns", async () => {
      await fs.mkdir(path.join(tempDir, "skills"), { recursive: true });
      await fs.writeFile(path.join(tempDir, "skills", ".gitignore"), "ignored-agent\n# comment\n  \nsecret-skill");
      await fs.mkdir(path.join(tempDir, "ignored-agent"));
      await fs.mkdir(path.join(tempDir, "secret-skill"));
      await fs.mkdir(path.join(tempDir, "valid-agent"));

      const structure = await getDirectoryStructure(tempDir);
      
      expect(structure).toContain("- valid-agent/");
      expect(structure).not.toContain("- ignored-agent/");
      expect(structure).not.toContain("- secret-skill/");
    });

    it("should skip large files", async () => {
      const largeFile = path.join(tempDir, "large.bin");
      // 200,001 bytes is just over the 200,000 limit
      const buffer = Buffer.alloc(200_001);
      await fs.writeFile(largeFile, buffer);
      await fs.writeFile(path.join(tempDir, "small.txt"), "small");

      const structure = await getDirectoryStructure(tempDir);
      
      expect(structure).toContain("- large.bin (skipped: too large)");
      expect(structure).toContain("- small.txt");
    });

    it("should respect MAX_DEPTH", async () => {
      // MAX_DEPTH is 4
      let currentPath = tempDir;
      for (let i = 1; i <= 6; i++) {
        currentPath = path.join(currentPath, `deep${i}`);
        await fs.mkdir(currentPath);
        await fs.writeFile(path.join(currentPath, "file.txt"), "content");
      }

      const structure = await getDirectoryStructure(tempDir);
      
      expect(structure).toContain("- deep1/");
      expect(structure).toContain("  - deep2/");
      expect(structure).toContain("    - deep3/");
      expect(structure).toContain("      - deep4/");
      // deep5 is at depth 5, so it should be skipped
      expect(structure).not.toContain("deep5");
    });

    it("should truncate when MAX_TOTAL_LINES is reached", async () => {
      for (let d = 0; d < 5; d++) {
        const sub = path.join(tempDir, `dir${d}`);
        await fs.mkdir(sub);
        for (let i = 0; i < 45; i++) {
          await fs.writeFile(path.join(sub, `file${i}.txt`), "content");
        }
      }

      const structure = await getDirectoryStructure(tempDir);
      const lines = structure.split("\n");
      
      expect(lines.length).toBeGreaterThanOrEqual(200);
      expect(structure).toContain("(... truncated ...)");
    });
  });
});
