import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Circle, Clock3, Flag, LoaderCircle, AlertCircle } from 'lucide-react';
import { STATUS_LABELS, colorValue } from '../services/model.js';
import { dueLabel, dateKey } from '../services/dates.js';

export function Brand({ compact = false, light = false }) {
  return <span className={`brand ${light ? 'brand-light' : ''}`}><svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="currentColor" /><path d="M10 28V15a5 5 0 0 1 10 0v13M20 15a5 5 0 0 1 10 0v13" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" /></svg>{!compact && <span className="brand-word">moment<span className="brand-period">.</span></span>}</span>;
}
export function PageHeading({ eyebrow, title, description, children }) {
  return <div className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{children && <div className="page-actions">{children}</div>}</div>;
}
export function EmptyState({ icon: Icon = Circle, title, description, action, compact = false }) {
  return <div className={`empty-state ${compact ? 'compact' : ''}`}><span className="empty-icon"><Icon size={27} strokeWidth={1.5} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Field({ label, htmlFor, hint, error, required, children, className = '' }) {
  return <div className={`field ${className}`}><label htmlFor={htmlFor}>{label}{required && <span className="required"> *</span>}</label>{children}{error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</div>;
}
export function FormError({ error }) { return error ? <div className="inline-error" role="alert"><AlertCircle size={17} /><span>{error}</span></div> : null; }
export function SaveIndicator({ saved, saving, error }) {
  const Icon = error ? AlertCircle : saving ? LoaderCircle : Check;
  return <span className={`save-indicator ${error ? 'is-error' : ''}`} role="status"><Icon size={14} className={saving ? 'spin' : ''} />{error ? 'Not saved · export a backup' : saving ? 'Saving…' : saved ? 'Saved in this browser' : 'Not yet saved'}</span>;
}
export function PriorityBadge({ priority }) {
  return <span className={`priority-badge priority-${priority}`}><Flag size={11} />{priority[0].toUpperCase() + priority.slice(1)}</span>;
}
export function DueBadge({ date, completed = false }) {
  const overdue = date && date < dateKey() && !completed;
  return <span className={`due-badge ${overdue ? 'overdue' : ''} ${date === dateKey() && !completed ? 'due-today' : ''}`}><Clock3 size={12} />{overdue ? 'Overdue · ' : ''}{dueLabel(date)}</span>;
}
export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status === 'completed' ? <Check size={12} /> : <span className="status-dot" />}{STATUS_LABELS[status] || status}</span>;
}
export function ProjectMarker({ project, size = 10 }) {
  return <span className="project-marker" style={{ background: colorValue(project?.color), width: size, height: size }} />;
}
export function ProgressBar({ value, label, color }) {
  return <div className="progress-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}><span style={{ width: `${value}%`, ...(color ? { background: color } : {}) }} /></div>;
}
export function TextLink({ to, children, arrow = true }) { return <Link className="text-link" to={to}>{children}{arrow && <ArrowUpRight size={15} />}</Link>; }
export function LoadingState() { return <div className="loading-state" role="status"><LoaderCircle className="spin" size={24} /><span>Opening your workspace…</span></div>; }
