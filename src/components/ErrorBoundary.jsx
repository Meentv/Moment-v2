import { Component } from 'react';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { STORAGE_KEY } from '../services/model.js';
import { downloadText } from '../lib/download.js';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    const exportRaw = () => { try { downloadText('moment-recovery.txt', localStorage.getItem(STORAGE_KEY) || 'No saved workspace was found.', 'text/plain'); } catch { window.alert('Browser storage is unavailable. If you have unsaved work, keep this tab open before reloading.'); } };
    return <main className="error-screen"><AlertCircle size={35} /><h1>Let’s take a little pause.</h1><p>MOMENT couldn’t display this screen. Your saved browser data has not been intentionally changed. Download a recovery copy before reloading if you have important work.</p><div><button className="button primary" onClick={() => window.location.reload()}><RefreshCw size={16} />Reload MOMENT</button><button className="button secondary" onClick={exportRaw}><Download size={16} />Download saved data</button></div><details><summary>Technical details</summary><pre>{this.state.error.message}</pre></details></main>;
  }
}
