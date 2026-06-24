import * as fs from 'fs';
import * as path from 'path';

export class StorageManager {
  private baseDir: string;

  constructor(storagePath: string = '.agentTeam') {
    this.baseDir = path.resolve(process.cwd(), storagePath);
  }

  resolvePath(...subPaths: string[]): string {
    return path.join(this.baseDir, ...subPaths);
  }

  async ensureDirectoryStructure(): Promise<void> {
    const dirs = [
      '',
      'agents',
      'sessions',
      'credentials',
      'runtime'
    ];

    for (const dir of dirs) {
      const fullPath = this.resolvePath(dir);
      if (!fs.existsSync(fullPath)) {
        await fs.promises.mkdir(fullPath, { recursive: true });
      }
    }
  }

  async readJson<T>(...subPaths: string[]): Promise<T | null> {
    const fullPath = this.resolvePath(...subPaths);
    if (!fs.existsSync(fullPath)) return null;
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  }

  async writeJson(data: any, ...subPaths: string[]): Promise<void> {
    const fullPath = this.resolvePath(...subPaths);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  exists(...subPaths: string[]): boolean {
    return fs.existsSync(this.resolvePath(...subPaths));
  }
}
