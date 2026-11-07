import { useState } from 'react';
import { Check, Trash2, CalendarDays } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import { Field, FormError } from '../../components/UI.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { dateKey } from '../../services/dates.js';

export default function TaskEditor({ task, defaults = {}, onClose, onDelete }) {
  const { data, transact, service } = useWorkspace();
  const notify = useToast();
  const [form, setForm] = useState(() => task ? { ...task, dueDate: task.dueDate || '', projectId: task.projectId || '' } : { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', projectId: '', ...defaults });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setError(''); };
  const submit = (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const input = { ...form, projectId: form.projectId || null };
      const response = transact((current) => task ? service.updateTask(current, task.id, input) : service.createTask(current, input));
      notify(response.saved ? task ? 'Task updated. A little more clarity.' : 'Task added. You’ve got this.' : 'Task added in this tab. Browser storage needs attention.', { type: response.saved ? 'success' : 'error' });
      onClose();
    } catch (err) { setError(err.message); setBusy(false); }
  };
  const quickDate = (days) => { const date = new Date(); date.setDate(date.getDate() + days); setForm((current) => ({ ...current, dueDate: dateKey(date) })); };
  return <Modal title={task ? 'Edit task' : 'Make room for a new task'} subtitle={task ? 'Small changes keep your plan moving.' : 'Get it out of your head and into your day.'} onClose={onClose}>
    <form onSubmit={submit} className="editor-form">
      <div className="modal-body form-stack">
        <Field label="Task title" htmlFor="task-title" required><input id="task-title" autoFocus required maxLength={200} placeholder="What would you like to get done?" value={form.title} onChange={set('title')} /></Field>
        <Field label="Description" htmlFor="task-description" hint="A little context for your future self. Optional."><textarea id="task-description" rows={3} maxLength={10000} placeholder="Add details, a next step, or anything worth remembering…" value={form.description} onChange={set('description')} /></Field>
        <div className="form-grid"><Field label="Status" htmlFor="task-status"><select id="task-status" value={form.status} onChange={set('status')}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></Field><Field label="Priority" htmlFor="task-priority"><select id="task-priority" value={form.priority} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field></div>
        <Field label="Due date" htmlFor="task-date" hint="Leave empty if this task doesn’t need a date."><input id="task-date" type="date" min="1900-01-01" max="2200-12-31" value={form.dueDate} onChange={set('dueDate')} /></Field>
        <div className="date-shortcuts"><CalendarDays size={14} /><button type="button" onClick={() => quickDate(0)}>Today</button><button type="button" onClick={() => quickDate(1)}>Tomorrow</button><button type="button" onClick={() => quickDate(7)}>Next week</button>{form.dueDate && <button type="button" onClick={() => setForm((current) => ({ ...current, dueDate: '' }))}>Clear</button>}</div>
        <Field label="Project" htmlFor="task-project"><select id="task-project" value={form.projectId} onChange={set('projectId')}><option value="">No project</option>{data.projects.filter((project) => project.status !== 'archived' || project.id === form.projectId).map((project) => <option key={project.id} value={project.id}>{project.name}{project.status === 'archived' ? ' (archived)' : ''}</option>)}</select></Field>
        <FormError error={error} />
      </div>
      <div className="modal-footer">{task && <button className="button ghost danger-text" type="button" onClick={() => onDelete(task)}><Trash2 size={16} />Delete</button>}<div className="footer-spacer" /><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={busy}><Check size={16} />{task ? 'Save changes' : 'Create task'}</button></div>
    </form>
  </Modal>;
}
