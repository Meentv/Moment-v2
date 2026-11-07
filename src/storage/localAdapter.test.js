import { describe, it, expect } from 'vitest';
import { readWorkspace, writeWorkspace, clearRecoveryCopies } from './localAdapter.js';
import { emptyWorkspace, STORAGE_KEY, RECOVERY_PREFIX } from '../services/model.js';
import { createTask } from '../services/workspace.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), key: (index) => [...map.keys()][index] ?? null, get length() { return map.size; }, clear: () => map.clear() };
}

describe('browser storage adapter', () => {
  it('starts with a real empty workspace and persists across a new adapter read', () => {
    const storage = memoryStorage();
    expect(readWorkspace(storage).data).toEqual(emptyWorkspace());
    const created = createTask(readWorkspace(storage).data, { title: 'Still here after refresh' });
    writeWorkspace(created.data, storage);
    expect(readWorkspace(storage).data.tasks[0].title).toBe('Still here after refresh');
  });
  it('preserves corrupted data in a recovery copy before allowing new writes', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{broken json');
    const loaded = readWorkspace(storage);
    expect(loaded.data.tasks).toEqual([]);
    expect(loaded.issue).toContain('recovery');
    expect(storage.getItem(loaded.recovery.key)).toBe('{broken json');
    const created = createTask(loaded.data, { title: 'A fresh start' });
    writeWorkspace(created.data, storage);
    expect(readWorkspace(storage).issue).toBeNull();
    expect(storage.getItem(loaded.recovery.key)).toBe('{broken json');
    clearRecoveryCopies(storage);
    expect(storage.getItem(loaded.recovery.key)).toBeNull();
  });
  it('does not overwrite original corrupt data when recovery storage fails', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, 'irreplaceable original');
    const originalSet = storage.setItem;
    storage.setItem = (key, value) => { if (key.startsWith(RECOVERY_PREFIX)) throw new Error('quota'); originalSet(key, value); };
    const loaded = readWorkspace(storage);
    expect(loaded.protected).toBe(true);
    expect(() => writeWorkspace(emptyWorkspace(), storage)).toThrow('Protected recovery');
    expect(storage.getItem(STORAGE_KEY)).toBe('irreplaceable original');
    writeWorkspace(emptyWorkspace(), storage, true);
    expect(readWorkspace(storage).data).toEqual(emptyWorkspace());
  });
  it('surfaces unavailable storage and quota failures instead of claiming success', () => {
    const unavailable = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(readWorkspace(unavailable).issue).toContain('unavailable');
    expect(() => writeWorkspace(emptyWorkspace(), unavailable)).toThrow('could not be saved');
    const full = memoryStorage();
    full.setItem = (key) => { if (key === STORAGE_KEY) { const error = new Error('full'); error.name = 'QuotaExceededError'; throw error; } };
    expect(() => writeWorkspace(emptyWorkspace(), full)).toThrow('storage is full');
  });
  it('validates at the storage boundary', () => {
    expect(() => writeWorkspace({ schemaVersion: 1 }, memoryStorage())).toThrow();
  });
});
