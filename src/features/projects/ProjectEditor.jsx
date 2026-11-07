import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal.jsx';
import { Field, FormError } from '../../components/UI.jsx';
import { PROJECT_COLORS } from '../../services/model.js';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ProjectEditor({ project, onClose, onDelete }) {
  const { data, transact, service } = useWorkspace();
  const notify = useToast();
  const [form, setForm] = useState(project || { name: '', description: '', color: 'rose', status: 'active', startDate: '', endDate: '' });
  const [error, setError] = useState('');
  const set = (key) => (event) => { setForm((current) => ({ ...current, [key]: event.target.value })); setError(''); };
  const submit = (event) => {
    event.preventDefault();
    try {
      const response = transact((current) => project ? service.updateProject(current, project.id, form) : service.createProject(current, form));
      notify(response.saved ? project ? 'Project updated.' : 'A new project, a fresh possibility.' : 'Project changed in this tab. Check the storage warning.', { type: response.saved ? 'success' : 'error' });
      onClose(response.record);
    } catch (err) { setError(err.message); }
  };
  return <Modal title={project ? 'Edit project' : 'Start a new project'} subtitle="Give related tasks a place to come together." onClose={() => onClose()}>
    <form onSubmit={submit}><div className="modal-body form-stack">
      <Field label="Project name" htmlFor="project-name" required><input id="project-name" autoFocus required maxLength={100} value={form.name} onChange={set('name')} placeholder="Something worth working on" /></Field>
      <Field label="Description" htmlFor="project-description"><textarea id="project-description" rows={3} maxLength={5000} value={form.description} onChange={set('description')} placeholder="What are you working toward?" /></Field>
      <fieldset className="color-field"><legend>Colour marker</legend><div className="color-options">{PROJECT_COLORS.map((color) => <label key={color.id} className={`color-option ${form.color === color.id ? 'selected' : ''}`} style={{ '--swatch': color.value }} title={color.name}><input type="radio" name="project-color" value={color.id} checked={form.color === color.id} onChange={set('color')} aria-label={color.name} />{form.color === color.id && <Check size={17} />}</label>)}</div></fieldset>
      <Field label="Status" htmlFor="project-status"><select id="project-status" value={form.status} onChange={set('status')}><option value="active">Active</option><option value="on-hold">On hold</option><option value="completed">Completed</option><option value="archived">Archived</option></select></Field>
      <div className="form-grid"><Field label="Start date" htmlFor="project-start"><input id="project-start" type="date" min="1900-01-01" max="2200-12-31" value={form.startDate} onChange={set('startDate')} /></Field><Field label="Target date" htmlFor="project-end"><input id="project-end" type="date" min="1900-01-01" max="2200-12-31" value={form.endDate} onChange={set('endDate')} /></Field></div>
      <FormError error={error} />
    </div><div className="modal-footer">{project && <button type="button" className="button ghost danger-text" onClick={() => onDelete(project)}><Trash2 size={16} />Delete</button>}<div className="footer-spacer" /><button type="button" className="button secondary" onClick={() => onClose()}>Cancel</button><button type="submit" className="button primary"><Check size={16} />{project ? 'Save changes' : 'Create project'}</button></div></form>
  </Modal>;
}
