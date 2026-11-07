import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { readWorkspace, writeWorkspace, clearRecoveryCopies } from '../storage/localAdapter.js';
import { TIMER_KEY } from '../services/model.js';
import * as service from '../services/workspace.js';
import { validateWorkspace } from '../services/validation.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [initial] = useState(() => readWorkspace());
  const [data, setData] = useState(initial.data);
  const dataRef = useRef(initial.data);
  const [storageError, setStorageError] = useState(initial.issue);
  const [recovery, setRecovery] = useState(initial.recovery);
  const protectedRef = useRef(Boolean(initial.protected));
  const [saved, setSaved] = useState(!initial.issue);
  const [saving, setSaving] = useState(false);

  const transact = useCallback((operation) => {
    const next = operation(dataRef.current);
    const validated = validateWorkspace(next.data);
    let didSave = true;
    setSaving(true);
    try {
      writeWorkspace(validated);
      setStorageError(null);
    } catch (error) {
      didSave = false;
      setStorageError(error.message);
    }
    dataRef.current = validated;
    setData(validated);
    setSaved(didSave);
    setSaving(false);
    return { record: next.record, saved: didSave, data: validated };
  }, [recovery]);

  const retrySave = useCallback(() => {
    try {
      writeWorkspace(dataRef.current);
      setStorageError(null); setSaved(true); return true;
    } catch (error) { setStorageError(error.message); setSaved(false); return false; }
  }, [recovery]);

  const replaceWorkspace = useCallback((input) => {
    const validated = validateWorkspace(input);
    writeWorkspace(validated, globalThis.localStorage, true);
    let cleanupError = null;
    try { clearRecoveryCopies(); localStorage.removeItem(TIMER_KEY); }
    catch { cleanupError = 'Your workspace was replaced, but old recovery or timer data could not be removed. Browser storage may be restricted.'; }
    protectedRef.current = false;
    setRecovery(null);
    dataRef.current = validated;
    setData(validated);
    setStorageError(cleanupError);
    setSaved(true);
    window.dispatchEvent(new Event('moment:reset'));
  }, []);

  useEffect(() => {
    const preference = data.preferences.theme;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#211C1E' : '#FFF9F7');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.preferences.theme]);

  const value = { data, transact, saved, saving, storageError, recovery, retrySave, replaceWorkspace, service };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
