import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, LoaderCircle, AlertCircle, Pin, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import { FormError } from '../../components/UI.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDialogs } from '../../context/DialogContext.jsx';
import { parseTags } from '../../services/validation.js';
import { copyText, downloadText } from '../../lib/download.js';
import { dateKey } from '../../services/dates.js';

export default function NoteEditor({ note, onClose }) {
  const { transact, service, saved: browserSaved } = useWorkspace();
  const notify = useToast();
  const { confirm } = useDialogs();
  const [form, setForm] = useState(() => note ? { title: note.title, body: note.body, tags: note.tags.join(', '), pinned: note.pinned } : { title: '', body: '', tags: '', pinned: false });
  const [saveState, setSaveState] = useState('saved');
  const [error, setError] = useState('');
  const noteId = useRef(note?.id || null);
  const formRef = useRef(form);
  const dirty = useRef(false);
  const timeout = useRef(null);
  const deleted = useRef(false);
  const durableSave = useRef(browserSaved);

  const persist = useCallback(() => {
    clearTimeout(timeout.current);
    if (!dirty.current || deleted.current) return true;
    const draft = formRef.current;
    if (!draft.title.trim() && !draft.body.trim()) { dirty.current = false; setSaveState('saved'); return true; }
    try {
      const input = { title: draft.title, body: draft.body, tags: parseTags(draft.tags), pinned: draft.pinned };
      const response = transact((current) => noteId.current ? service.updateNote(current, noteId.current, input) : service.createNote(current, input));
      noteId.current = response.record.id;
      durableSave.current = response.saved;
      dirty.current = false;
      setSaveState(response.saved ? 'saved' : 'error');
      setError(response.saved ? '' : 'Your note is in this tab but hasn’t reached browser storage. Export it before closing.');
      return true;
    } catch (err) { setSaveState('error'); setError(err.message); return false; }
  }, [service, transact]);
  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    const beforeUnload = (event) => { if (dirty.current) { const committed = persistRef.current(); if (!committed || !durableSave.current) { event.preventDefault(); event.returnValue = ''; } } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { clearTimeout(timeout.current); window.removeEventListener('beforeunload', beforeUnload); if (dirty.current && !deleted.current) persistRef.current(); };
  }, []);

  const change = (key, value) => {
    const next = { ...formRef.current, [key]: value };
    formRef.current = next;
    setForm(next);
    dirty.current = true;
    setSaveState('pending');
    setError('');
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => persistRef.current(), 650);
  };
  const close = () => { if (persist()) onClose(); };
  const remove = async () => {
    if (!noteId.current) { dirty.current = false; clearTimeout(timeout.current); onClose(); return; }
    const accepted = await confirm({ title: 'Delete this note?', description: `“${form.title || 'Untitled note'}” will be removed from your notes. You can undo immediately after deleting.`, confirmLabel: 'Delete note', destructive: true });
    if (!accepted) return;
    try {
      const id = noteId.current;
      const response = transact((current) => service.deleteNote(current, id));
      deleted.current = true; dirty.current = false; clearTimeout(timeout.current);
      notify(response.saved ? 'Note deleted.' : 'Note removed in this tab. Check the storage warning.', { type: response.saved ? 'success' : 'error', action: { label: 'Undo', onClick: () => { try { transact((current) => service.restoreNote(current, response.record)); notify('Note restored.'); } catch (err) { notify(err.message, { type: 'error' }); } } } });
      onClose();
    } catch (err) { setError(err.message); }
  };
  const copy = async () => { try { await copyText(`${form.title}\n\n${form.body}`); notify('Note copied to clipboard.'); } catch (err) { notify(err.message, { type: 'error' }); } };
  const exportNote = () => { downloadText(`${form.title || 'moment-note'}-${dateKey()}.txt`, `${form.title}\n\n${form.body}${form.tags ? `\n\nTags: ${form.tags}` : ''}`, 'text/plain'); notify('Note export prepared.'); };
  const statusText = saveState === 'pending' ? 'Saving…' : saveState === 'error' ? 'Couldn’t save' : noteId.current ? 'Saved in this browser' : 'Start writing to save';
  const StatusIcon = saveState === 'pending' ? LoaderCircle : saveState === 'error' ? AlertCircle : Check;
  return <Modal title={note ? 'Your note' : 'A space for your thoughts'} subtitle="Ideas don’t need to be perfect. Just captured." onClose={close} size="large" className="note-editor">
    <div className="modal-body form-stack">
      <div className="note-editor-toolbar"><span className={`note-save-state ${saveState === 'error' ? 'danger-text' : ''}`} role="status"><StatusIcon size={14} className={saveState === 'pending' ? 'spin' : ''} />{statusText}</span><button type="button" className={`button ghost small ${form.pinned ? 'is-pinned' : ''}`} aria-pressed={form.pinned} onClick={() => change('pinned', !form.pinned)}><Pin size={15} />{form.pinned ? 'Pinned' : 'Pin note'}</button></div>
      <input className="note-title-input" aria-label="Note title" autoFocus maxLength={200} placeholder="Give your idea a title…" value={form.title} onChange={(event) => change('title', event.target.value)} />
      <textarea className="note-body-input" aria-label="Note body" rows={11} maxLength={100000} placeholder="A thought, a plan, a little spark. Start anywhere." value={form.body} onChange={(event) => change('body', event.target.value)} />
      <div className="field"><label htmlFor="note-tags">Tags</label><input id="note-tags" maxLength={372} placeholder="work, inspiration, someday (separate with commas)" value={form.tags} onChange={(event) => change('tags', event.target.value)} /><span className="field-hint">Up to 12 tags, 30 characters each. Notes save automatically as you write.</span></div>
      <FormError error={error} />
      {!browserSaved && saveState !== 'error' && <p className="field-hint">Your browser has a storage issue. Use Export to keep a copy of this note.</p>}
    </div>
    <div className="modal-footer note-editor-footer"><button type="button" className="icon-button" aria-label="Delete note" title="Delete note" onClick={remove}><Trash2 size={17} /></button><button type="button" className="button ghost small" onClick={copy}><Copy size={15} />Copy</button><button type="button" className="button ghost small" onClick={exportNote}><Download size={15} />Export</button><div className="footer-spacer" /><button type="button" className="button primary" onClick={close}><Check size={16} />Done</button></div>
  </Modal>;
}
