import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal.jsx';
import TaskEditor from '../features/tasks/TaskEditor.jsx';
import ProjectEditor from '../features/projects/ProjectEditor.jsx';
import NoteEditor from '../features/notes/NoteEditor.jsx';
import { useWorkspace } from './WorkspaceContext.jsx';
import { useToast } from './ToastContext.jsx';

const DialogContext = createContext(null);
export function DialogProvider({ children }) {
  const [taskEditor, setTaskEditor] = useState(null);
  const [projectEditor, setProjectEditor] = useState(null);
  const [noteEditor, setNoteEditor] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const resolver = useRef(null);
  const { data, transact, service } = useWorkspace();
  const notify = useToast();
  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve;
    setConfirmation(options);
  }), []);
  const closeConfirm = (value) => { setConfirmation(null); resolver.current?.(value); resolver.current = null; };
  const openTask = useCallback((taskOrDefaults = {}) => setTaskEditor(taskOrDefaults.id ? { task: data.tasks.find((task) => task.id === taskOrDefaults.id) || taskOrDefaults } : { defaults: taskOrDefaults }), [data.tasks]);
  const openProject = useCallback((project = null) => setProjectEditor({ project }), []);
  const openNote = useCallback((note = null) => setNoteEditor({ note }), []);
  const deleteTask = useCallback(async (task) => {
    const accepted = await confirm({ title: 'Delete this task?', description: `“${task.title}” will be removed. Any recorded focus sessions will stay in your history.`, confirmLabel: 'Delete task', destructive: true });
    if (!accepted) return false;
    try {
      const response = transact((current) => service.deleteTask(current, task.id));
      notify(response.saved ? 'Task deleted.' : 'Task removed in this tab. Storage needs attention.', { type: response.saved ? 'success' : 'error', action: { label: 'Undo', onClick: () => { try { transact((current) => service.restoreTask(current, response.record)); notify('Task restored.'); } catch (error) { notify(error.message, { type: 'error' }); } } } });
      return true;
    } catch (error) { notify(error.message, { type: 'error' }); return false; }
  }, [confirm, notify, service, transact]);
  const deleteProject = useCallback(async (project) => {
    const linked = data.tasks.filter((task) => task.projectId === project.id).length;
    const accepted = await confirm({ title: 'Delete this project?', description: `“${project.name}” will be permanently deleted. ${linked ? `Its ${linked} linked task${linked === 1 ? '' : 's'} will be kept and moved to No project.` : 'This cannot be undone.'}`, confirmLabel: 'Delete project', destructive: true });
    if (!accepted) return false;
    try { const response = transact((current) => service.deleteProject(current, project.id)); notify(response.saved ? 'Project deleted. Your tasks are still safe.' : 'Project removed in this tab. Check the storage warning.', { type: response.saved ? 'success' : 'error' }); return true; }
    catch (error) { notify(error.message, { type: 'error' }); return false; }
  }, [confirm, data.tasks, notify, service, transact]);
  const value = { openTask, openProject, openNote, confirm, deleteTask, deleteProject };
  return <DialogContext.Provider value={value}>{children}
    {taskEditor && <TaskEditor {...taskEditor} onClose={() => setTaskEditor(null)} onDelete={async (task) => { if (await deleteTask(task)) setTaskEditor(null); }} />}
    {projectEditor && <ProjectEditor {...projectEditor} onClose={() => setProjectEditor(null)} onDelete={async (project) => { if (await deleteProject(project)) setProjectEditor(null); }} />}
    {noteEditor && <NoteEditor {...noteEditor} onClose={() => setNoteEditor(null)} />}
    {confirmation && <Modal title={confirmation.title} onClose={() => closeConfirm(false)} size="small"><div className="modal-body confirm-body"><span className={`confirm-icon ${confirmation.destructive ? 'destructive' : ''}`}><AlertTriangle size={24} /></span><p>{confirmation.description}</p>{confirmation.extra}</div><div className="modal-footer"><button className="button secondary" onClick={() => closeConfirm(false)}>Cancel</button><button className={`button ${confirmation.destructive ? 'danger' : 'primary'}`} onClick={() => closeConfirm(true)}>{confirmation.confirmLabel || 'Confirm'}</button></div></Modal>}
  </DialogContext.Provider>;
}
export function useDialogs() { const value = useContext(DialogContext); if (!value) throw new Error('DialogProvider is missing'); return value; }
