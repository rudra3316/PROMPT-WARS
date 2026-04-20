import React, { useState, useEffect, useRef } from 'react';
import { analyseVenueCrowd, askGemini } from '../services/geminiService';

/** Typewriter animation for text */
const TypewriterText = ({ text, speed = 20 }) => {
  const [displayed, setDisplayed] = useState('');
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setDisplayed('');
    if (!text) return;

    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {displayed.length < (text?.length || 0) && (
        <span style={{ borderRight: '2px solid var(--accent-blue)', marginLeft: 1, animation: 'blink-cursor 0.7s infinite' }} />
      )}
    </span>
  );
};

const SeverityBar = ({ severity }) => {
  const config = {
    safe:     { color: 'var(--accent-green)',  label: 'All Clear',   pct: 10 },
    moderate: { color: 'var(--accent-blue)',   label: 'Moderate',    pct: 45 },
    warning:  { color: 'var(--accent-yellow)', label: 'Warning',     pct: 70 },
    critical: { color: 'var(--accent-red)',    label: 'Critical',    pct: 95 },
  }[severity] || { color: 'var(--accent-blue)', label: 'Analyzing', pct: 50 };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--text-secondary)' }}>
        <span>Risk Level</span>
        <span style={{ fontWeight: 700, color: config.color }}>{config.label}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${config.pct}%`,
          background: config.color, borderRadius: 10,
          transition: 'width 0.8s ease, background 0.4s ease',
          boxShadow: `0 0 6px ${config.color}`,
        }} />
      </div>
    </div>
  );
};

const GeminiInsight = ({ crowdData }) => {
  const [insight, setInsight]       = useState('');
  const [severity, setSeverity]     = useState('safe');
  const [loading, setLoading]       = useState(true);
  const [countdown, setCountdown]   = useState(30);
  const [question, setQuestion]     = useState('');
  const [answer, setAnswer]         = useState('');
  const [asking, setAsking]         = useState(false);
  const [history, setHistory]       = useState([]);
  const dataRef = useRef(crowdData);

  useEffect(() => { dataRef.current = crowdData; }, [crowdData]);

  const fetchInsight = async () => {
    setLoading(true);
    const result = await analyseVenueCrowd(dataRef.current);
    setInsight(result.insight || '');
    setSeverity(result.severity || 'safe');
    setLoading(false);
    setCountdown(30);
  };

  useEffect(() => {
    fetchInsight();
    const timer   = setInterval(fetchInsight, 30000);
    const counter = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => { clearInterval(timer); clearInterval(counter); };
  }, []);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || asking) return;
    const q = question.trim();
    setQuestion('');
    setAsking(true);
    const a = await askGemini(q, dataRef.current);
    setHistory(h => [{ q, a, ts: Date.now() }, ...h].slice(0, 5));
    setAnswer(a);
    setAsking(false);
  };

  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 20 }}>✨</div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>Gemini AI Analysis</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {loading ? 'Analyzing...' : `Refreshes in ${countdown}s`}
            </p>
          </div>
        </div>
        <button onClick={fetchInsight} className="btn btn-sm btn-ghost" disabled={loading} title="Refresh analysis">
          {loading ? '⟳' : '↻'} Refresh
        </button>
      </div>

      <SeverityBar severity={severity} />

      {/* Insight box */}
      <div style={{
        padding: '14px 16px',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        border: `1px solid ${severity === 'critical' ? 'rgba(239,68,68,0.3)' : severity === 'warning' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
        minHeight: 80, marginBottom: 16,
        fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)',
      }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14, border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Processing live venue data...
          </div>
        ) : (
          <TypewriterText text={insight} speed={15} />
        )}
      </div>

      {/* Q&A */}
      <form onSubmit={handleAsk} style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask about crowd conditions..."
          aria-label="Ask Gemini a question about the venue"
          disabled={asking}
          style={{ flex: 1, fontSize: 13 }}
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={asking || !question.trim()}>
          {asking ? '⟳' : '↗'}
        </button>
      </form>

      {/* Answer */}
      {answer && (
        <div style={{
          marginTop: 12, padding: '12px 14px',
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 10, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)',
          borderLeft: '3px solid var(--accent-blue)',
        }}>
          💬 {answer}
        </div>
      )}
    </div>
  );
};

export default React.memo(GeminiInsight);
