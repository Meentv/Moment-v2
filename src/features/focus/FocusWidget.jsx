import { Link } from 'react-router-dom';
import { Pause, Play, ArrowUpRight, Headphones } from 'lucide-react';
import { useFocus } from '../../context/FocusContext.jsx';
import { clock } from '../../services/dates.js';

export default function FocusWidget() {
  const { timer, remaining, start, pause } = useFocus();
  const progress = (1 - remaining / timer.durationSeconds) * 100;
  return <section className="focus-widget panel"><div className="panel-heading"><h2><Headphones size={17} />A moment of focus</h2><Link className="icon-button small" to="/app/focus" aria-label="Open focus timer"><ArrowUpRight size={16} /></Link></div><p className="focus-widget-caption">{timer.mode === 'break' ? 'A little pause goes a long way.' : timer.phase === 'running' ? 'Just you and the next small step.' : 'One thing at a time is enough.'}</p><div className="mini-timer"><svg viewBox="0 0 140 140" aria-hidden="true"><circle className="timer-track" cx="70" cy="70" r="61" /><circle className="timer-progress" cx="70" cy="70" r="61" strokeDasharray={383.27} strokeDashoffset={383.27 * (1 - progress / 100)} /></svg><div><span className="mini-time" role="timer" aria-label={`${clock(remaining)} remaining`}>{clock(remaining)}</span><span className="mini-time-label">{timer.mode === 'focus' ? 'FOCUS TIME' : 'BREAK TIME'}</span></div></div><button className={`button ${timer.phase === 'running' ? 'secondary' : 'primary'} focus-widget-button`} onClick={timer.phase === 'running' ? pause : start}>{timer.phase === 'running' ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}{timer.phase === 'running' ? 'Pause session' : timer.phase === 'paused' ? 'Resume session' : 'Let’s focus'}</button></section>;
}
