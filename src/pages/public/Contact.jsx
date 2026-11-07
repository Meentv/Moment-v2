import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowUpRight, Check, Info } from 'lucide-react';
import { Field, FormError } from '../../components/UI.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useDialogs } from '../../context/DialogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function Contact() {
  const { transact, service } = useWorkspace();
  const { openNote } = useDialogs();
  const notify = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) { setError('Add a subject and a little detail before saving your note.'); return; }
    try {
      const response = transact((current) => service.createNote(current, { title: `Feedback: ${subject}`, body: `${message}\n\nPrepared in MOMENT. This note has not been sent to a support service.`, tags: ['feedback'] }));
      setSubject(''); setMessage(''); setError('');
      notify(response.saved ? 'Feedback saved as a note. Export it to share with the project owner.' : 'Feedback kept in this tab only. Export the note before leaving.', { type: response.saved ? 'success' : 'error', action: { label: 'Open note', onClick: () => openNote(response.record) } });
    } catch (err) { setError(err.message); }
  };
  return <div className="public-page contact-page page-enter"><section className="public-page-hero"><span className="eyebrow">GOOD TO HEAR FROM YOU</span><h1>A thought worth <em>sharing?</em></h1><p>Capture feedback, a question, or an idea for making MOMENT a little better.</p></section><div className="contact-columns"><section className="panel contact-form-panel"><h2><MessageSquare size={21} />Prepare a feedback note</h2><div className="info-banner"><Info size={18} /><p>A support inbox isn’t connected in this local-first release. This form saves a real note in your workspace; it does not send a message. You can export the note and share it with the project owner.</p></div><form className="form-stack" onSubmit={submit}><Field label="What’s on your mind?" htmlFor="feedback-subject" required><input id="feedback-subject" required maxLength={180} placeholder="A short subject" value={subject} onChange={(event) => setSubject(event.target.value)} /></Field><Field label="Your note" htmlFor="feedback-message" required><textarea id="feedback-message" required rows={7} maxLength={9000} placeholder="Tell us a little more…" value={message} onChange={(event) => setMessage(event.target.value)} /></Field><FormError error={error} /><button className="button primary" type="submit"><Check size={16} />Save as a note</button></form></section><aside className="contact-aside"><h3>A quicker answer might be here.</h3><p>Our help pages explain local saving, backups, the focus timer, and keyboard shortcuts.</p><Link to="/help" className="text-link">Browse help & FAQ<ArrowUpRight size={15} /></Link><h3>Your words stay yours.</h3><p>This note is stored only in this browser. Don’t include passwords or sensitive personal information.</p><Link to="/app/notes" className="text-link">Open your notes<ArrowUpRight size={15} /></Link></aside></div></div>;
}
