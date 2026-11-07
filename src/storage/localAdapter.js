import { emptyWorkspace, STORAGE_KEY, RECOVERY_PREFIX } from '../services/model.js';
import { validateWorkspace } from '../services/validation.js';

export function readWorkspace(storage = globalThis.localStorage) {
  let raw;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch { return { data: emptyWorkspace(), issue: 'Browser storage is unavailable. You can work in this tab and export a backup, but changes cannot be saved automatically.', recovery: null }; }
  if (raw === null) return { data: emptyWorkspace(), issue: null, recovery: null };
  try { return { data: validateWorkspace(JSON.parse(raw)), issue: null, recovery: null }; }
  catch {
    const recovery = { raw, key: `${RECOVERY_PREFIX}${Date.now()}` };
    try {
      storage.setItem(recovery.key, raw);
      return { data: emptyWorkspace(), issue: 'Saved data could not be read. The original data was preserved in a recovery copy. Import a valid backup or download the recovery copy in Settings.', recovery };
    } catch {
      return { data: emptyWorkspace(), issue: 'Saved data could not be read and a recovery copy could not be stored. The original data has not been overwritten. Download it in Settings before resetting storage.', recovery, protected: true };
    }
  }
}

export function writeWorkspace(data, storage = globalThis.localStorage, allowReset = false) {
  const validated = validateWorkspace(data);
  try {
    if (!allowReset) {
      const existing = storage.getItem(STORAGE_KEY);
      if (existing !== null) {
        try { validateWorkspace(JSON.parse(existing)); }
        catch {
          let preserved = false;
          for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (key?.startsWith(RECOVERY_PREFIX) && storage.getItem(key) === existing) { preserved = true; break; }
          }
          if (!preserved) throw new Error('Protected recovery data is still in storage. Download it and explicitly reset storage in Settings first.');
        }
      }
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return validated;
  } catch (error) {
    const message = error.name === 'QuotaExceededError'
      ? 'Browser storage is full. Your latest changes are only in this tab. Export a backup now, then free up space and retry saving.'
      : error.message?.includes('Protected recovery') ? error.message
      : 'Your changes could not be saved to this browser. They are still in this tab. Export a backup before leaving, then retry saving.';
    const wrapped = new Error(message); wrapped.name = 'StorageError'; throw wrapped;
  }
}

export function clearRecoveryCopies(storage = globalThis.localStorage) {
  const keys = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key?.startsWith(RECOVERY_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => storage.removeItem(key));
}
