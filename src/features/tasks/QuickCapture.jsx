import { useState } from 'react';
import { Plus, ArrowRight, CalendarDays } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useDialogs } from '../../context/DialogContext.jsx';
import { dateKey } from '../../services/dates.js';

export default function QuickCapture({ dueDate = dateKey(), projectId = null, placeholder = 'What’s one thing you’d like to get done?' }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const { data, transact, service } = useWorkspace();
  const { openTask } = useDialogs();
  const notify = useToast();
  const submit = (event) => {
    event.preventDefault();
    if (!title.trim()) { setError('Give your task a name first.'); return; }
    try {
      const response = transact((current) => service.createTask(current, { title, dueDate, projectId }));
      setTitle(''); setError('');
      notify(response.saved ? 'Captured. One small step forward.' : 'Task captured in this tab. Check the storage warning.', { type: response.saved ? 'success' : 'error', action: { label: 'Add details', onClick: () => openTask(response.record) } });
    } catch (err) { setError(err.message); }
  };
  return <div className="quick-capture-wrap"><form className="quick-capture" onSubmit={submit}><Plus size={19} /><input aria-label="Quick add a task" placeholder={placeholder} value={title} maxLength={200} onChange={(event) => { setTitle(event.target.value); setError(''); }} /><button type="submit" className="capture-submit" aria-label="Add task" title="Add task"><span>Add task</span><ArrowRight size={16} /></button></form>{error && <p className="field-error" role="alert">{error}</p>}<span className="sr-only">{data.tasks.length} tasks in your workspace</span></div>;
}
