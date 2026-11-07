import { TIMER_KEY } from '../services/model.js';
import { initialTimer, validateTimer } from '../services/focus.js';

export function readTimer(data, storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(TIMER_KEY);
    return raw ? validateTimer(JSON.parse(raw), data.preferences, data) : initialTimer(data.preferences);
  } catch { return initialTimer(data.preferences); }
}
export function writeTimer(timer, storage = globalThis.localStorage) {
  try { storage.setItem(TIMER_KEY, JSON.stringify(timer)); return true; }
  catch { return false; }
}
