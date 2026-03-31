import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from '../src/utils/storage';

describe('StorageManager', () => {
  const testDir = '.agentTeam_test';
  const storage = new StorageManager(testDir);

  beforeEach(async () => {
    const fullPath = path.resolve(process.cwd(), testDir);
    if (fs.existsSync(fullPath)) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    }
  });

  it('should ensure directory structure', async () => {
    await storage.ensureDirectoryStructure();
    expect(fs.existsSync(storage.resolvePath('agents'))).toBe(true);
    expect(fs.existsSync(storage.resolvePath('sessions'))).toBe(true);
    expect(fs.existsSync(storage.resolvePath('credentials'))).toBe(true);
  });

  it('should read and write JSON correctly', async () => {
    await storage.ensureDirectoryStructure();
    const data = { hello: 'world' };
    await storage.writeJson(data, 'test.json');
    const read = await storage.readJson<typeof data>('test.json');
    expect(read).toEqual(data);
  });

  it('should return null for non-existent JSON', async () => {
    const read = await storage.readJson('ghost.json');
    expect(read).toBeNull();
  });
});
