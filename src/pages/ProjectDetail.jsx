import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Archive, Trash2, FolderClosed, Plus, RotateCcw } from 'lucide-react';
import { PageHeading, ProgressBar, EmptyState } from '../components/UI.jsx';
import { useWorkspace } from '../context/WorkspaceContext.jsx';
import { useDialogs } from '../context/DialogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { projectProgress, sortTasks } from '../services/workspace.js';
import { colorValue, PROJECT_STATUS_LABELS } from '../services/model.js';
import { formatDate } from '../services/dates.js';
import QuickCapture from '../features/tasks/QuickCapture.jsx';
import TaskRow from '../features/tasks/TaskRow.jsx';

export default function ProjectDetail() {
  const { id } = useParams();
  const { data, transact, service } = useWorkspace();
  const { openProject, deleteProject, openTask } = useDialogs();
  const notify = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const project = data.projects.find((item) => item.id === id);
  if (!project) return <EmptyState icon={FolderClosed} title="This project isn’t here" description="It may have been deleted. Your other projects and tasks are still safe." action={<Link className="button primary" to="/app/projects">Back to projects</Link>} />;
  const progress = projectProgress(data, id);
  const tasks = sortTasks(data.tasks.filter((task) => task.projectId === id && (filter === 'all' || (filter === 'open' ? task.status !== 'completed' : task.status === 'completed'))), 'due-asc');
  const archive = () => { const status = project.status === 'archived' ? 'active' : 'archived'; try { const response = transact((current) => service.updateProject(current, id, { status })); notify(response.saved ? status === 'archived' ? 'Project archived.' : 'Project restored.' : 'Change kept in this tab only. Check storage.', { type: response.saved ? 'success' : 'error' }); } catch (err) { notify(err.message, { type: 'error' }); } };
  return <div className="page-enter"><Link to="/app/projects" className="back-link"><ArrowLeft size={15} />All projects</Link><PageHeading eyebrow={<span className="project-eyebrow"><span className="project-marker" style={{ background: colorValue(project.color) }} />{PROJECT_STATUS_LABELS[project.status]} PROJECT</span>} title={project.name} description={project.description || 'One task at a time, closer to the bigger picture.'}><button className="button secondary" onClick={() => openProject(project)}><Pencil size={15} />Edit</button><button className="button secondary" onClick={archive}>{project.status === 'archived' ? <RotateCcw size={15} /> : <Archive size={15} />}{project.status === 'archived' ? 'Restore' : 'Archive'}</button><button className="icon-button" aria-label="Delete project" onClick={async () => { if (await deleteProject(project)) navigate('/app/projects'); }}><Trash2 size={17} /></button></PageHeading><div className="project-detail-summary panel"><div><span className="section-kicker">REAL PROGRESS, ONE TASK AT A TIME</span><div className="project-detail-numbers"><strong>{progress.percent}<span>%</span></strong><p>{progress.completed} of {progress.total} tasks complete</p></div><ProgressBar value={progress.percent} label="Project progress" color={colorValue(project.color)} /></div><div className="project-detail-dates"><span>Started<strong>{project.startDate ? formatDate(project.startDate, { year: 'numeric' }) : 'Whenever you’re ready'}</strong></span><span>Target date<strong>{project.endDate ? formatDate(project.endDate, { year: 'numeric' }) : 'No deadline set'}</strong></span></div></div>{project.status === 'archived' && <div className="info-banner"><Archive size={17} /><p>This project is archived. Restore it to keep working, or browse its tasks below.</p></div>}<QuickCapture dueDate="" projectId={id} placeholder={`Add a small step to ${project.name}…`} /><section className="panel"><div className="panel-heading"><h2>Project tasks<span className="heading-count">{tasks.length}</span></h2><button className="button primary small" onClick={() => openTask({ projectId: id })}><Plus size={15} />New task</button></div><div className="segmented-tabs" role="tablist" aria-label="Project task filter">{[['all', 'All tasks'], ['open', 'Open'], ['completed', 'Completed']].map(([value, label]) => <button role="tab" aria-selected={filter === value} className={filter === value ? 'active' : ''} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div>{tasks.length ? <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} showStatus />)}</div> : <EmptyState icon={FolderClosed} compact title={filter === 'all' ? 'The first step is yours' : 'Nothing in this view'} description={filter === 'all' ? 'Add a task above to start making progress on this project.' : 'Try another filter to see the rest of your project tasks.'} />}</section></div>;
}
