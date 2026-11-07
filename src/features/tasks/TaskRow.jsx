import { Check, Pencil, MoreHorizontal, Trash2, Circle, CalendarDays } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useDialogs } from '../../context/DialogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { DueBadge, PriorityBadge, ProjectMarker, StatusBadge } from '../../components/UI.jsx';

export default function TaskRow({ task, compact = false, showStatus = false }) {
  const { data, transact, service } = useWorkspace();
  const { openTask, deleteTask } = useDialogs();
  const notify = useToast();
  const project = data.projects.find((item) => item.id === task.projectId);
  const toggle = () => {
    const previousStatus = task.status;
    const status = previousStatus === 'completed' ? 'todo' : 'completed';
    try {
      const response = transact((current) => service.updateTask(current, task.id, { status }));
      notify(response.saved ? status === 'completed' ? 'One less thing. Nice work!' : 'Task reopened.' : 'Status changed in this tab. Check the storage warning.', { type: response.saved ? 'success' : 'error', action: { label: 'Undo', onClick: () => { try { transact((current) => service.updateTask(current, task.id, { status: previousStatus })); } catch (error) { notify(error.message, { type: 'error' }); } } } });
    } catch (error) { notify(error.message, { type: 'error' }); }
  };
  return <div className={`task-row ${task.status === 'completed' ? 'is-completed' : ''} ${compact ? 'compact' : ''}`}>
    <button className={`task-check ${task.status === 'completed' ? 'checked' : ''} ${task.status === 'in-progress' ? 'in-progress' : ''}`} onClick={toggle} aria-label={`${task.status === 'completed' ? 'Reopen' : 'Complete'} ${task.title}`} aria-pressed={task.status === 'completed'}>{task.status === 'completed' ? <Check size={14} strokeWidth={2.5} /> : task.status === 'in-progress' ? <span className="half-circle" /> : null}</button>
    <button className="task-content" onClick={() => openTask(task)}><span className="task-title">{task.title}</span>{!compact && task.description && <span className="task-description">{task.description}</span>}<span className="task-meta">{project && <span className="task-project"><ProjectMarker project={project} size={7} />{project.name}</span>}{task.dueDate ? <DueBadge date={task.dueDate} completed={task.status === 'completed'} /> : !compact ? <span className="due-badge"><CalendarDays size={12} />No date</span> : null}{showStatus && <StatusBadge status={task.status} />}</span></button>
    {!compact && <PriorityBadge priority={task.priority} />}
    <div className="task-actions"><button className="icon-button small" onClick={() => openTask(task)} aria-label={`Edit ${task.title}`} title="Edit task"><Pencil size={15} /></button>{!compact && <details className="row-menu"><summary className="icon-button small" aria-label={`More actions for ${task.title}`} title="More actions"><MoreHorizontal size={17} /></summary><div className="menu-popover"><button onClick={(event) => { event.currentTarget.closest('details').open = false; openTask(task); }}><Pencil size={14} />Edit task</button><button onClick={(event) => { event.currentTarget.closest('details').open = false; toggle(); }}><Circle size={14} />{task.status === 'completed' ? 'Reopen task' : 'Mark completed'}</button><button className="danger-text" onClick={(event) => { event.currentTarget.closest('details').open = false; deleteTask(task); }}><Trash2 size={14} />Delete task</button></div></details>}</div>
  </div>;
}
