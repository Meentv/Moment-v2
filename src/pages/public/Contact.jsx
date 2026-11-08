import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowUpRight, Check, Info, Mail } from 'lucide-react';
import { Field, FormError } from '../../components/UI.jsx';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useDialogs } from '../../context/DialogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CONTACT_EMAIL, contactMailto } from '../../lib/contact.js';

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
      const response = transact((current) => service.createNote(current, {
        title: `Feedback: ${subject}`,
        body: `${message}\n\nPrepared in MOMENT. This local note has not been sent by email.`,
        tags: ['feedback'],
      }));
      setSubject(''); setMessage(''); setError('');
      notify(response.saved ? 'Feedback saved as a note in this browser.' : 'Feedback kept in this tab only. Export the note before leaving.', {
        type: response.saved ? 'success' : 'error',
        action: { label: 'Open note', onClick: () => openNote(response.record) },
      });
    } catch (err) { setError(err.message); }
  };

  return <div className="public-page contact-page page-enter">
    <section className="public-page-hero">
      <span className="eyebrow">GOOD TO HEAR FROM YOU</span>
      <h1>A thought worth <em>sharing?</em></h1>
      <p>Send a question, feedback, or an idea to the project owner. You can also prepare a private note in your workspace first.</p>
    </section>
    <div className="contact-columns">
      <section className="panel contact-form-panel">
        <h2><MessageSquare size={21} />Prepare a message</h2>
        <div className="info-banner"><Info size={18} /><p>This form does not send email by itself. Open a draft in your email app and send it there, or save a copy as a note in this browser.</p></div>
        <form className="form-stack" onSubmit={submit}>
          <Field label="What’s on your mind?" htmlFor="feedback-subject" required><input id="feedback-subject" required maxLength={180} placeholder="A short subject" value={subject} onChange={(event) => setSubject(event.target.value)} /></Field>
          <Field label="Your note" htmlFor="feedback-message" required><textarea id="feedback-message" required rows={7} maxLength={9000} placeholder="Tell us a little more…" value={message} onChange={(event) => setMessage(event.target.value)} /></Field>
          <FormError error={error} />
          <div className="contact-form-actions">
            <a className="button primary" href={contactMailto(subject, message)}><Mail size={16} />Open email draft</a>
            <button className="button secondary" type="submit"><Check size={16} />Save as a note</button>
          </div>
          <p className="contact-form-hint">The draft opens in your email app. You choose whether to send it.</p>
        </form>
      </section>
      <aside className="contact-aside">
        <section className="contact-email-card">
          <Mail size={23} strokeWidth={1.6} />
          <h3>Email the project owner</h3>
          <a className="contact-email-address" href={contactMailto()}>{CONTACT_EMAIL}</a>
          <p>For questions, feedback, and ideas about MOMENT.</p>
        </section>
        <h3>A quicker answer might be here.</h3>
        <p>Our help pages explain local saving, backups, the focus timer, and keyboard shortcuts.</p>
        <Link to="/help" className="text-link">Browse help & FAQ<ArrowUpRight size={15} /></Link>
        <h3>Your words stay yours.</h3>
        <p>Saved notes stay in this browser. Email drafts open in your own email app, so only send what you’re comfortable sharing. Don’t include passwords or sensitive personal information.</p>
        <Link to="/app/notes" className="text-link">Open your notes<ArrowUpRight size={15} /></Link>
      </aside>
    </div>
  </div>;
}
