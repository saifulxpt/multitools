import React, { useState, useEffect } from 'react';
import { Percent, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import SEOHead from './SEOHead';

/* ─── 4 essential modes ───────────────────────────────── */
const MODES = [
  { id: 'of_total',  label: '% of Total',     icon: Percent,     color: '#6366f1' },
  { id: 'discount',  label: 'Discount',        icon: Tag,         color: '#f59e0b' },
  { id: 'increase',  label: '% Increase',      icon: TrendingUp,  color: '#10b981' },
  { id: 'decrease',  label: '% Decrease',      icon: TrendingDown, color: '#ef4444' },
];

/* ─── Reusable input ──────────────────────────────────── */
const Field = ({ label, hint, value, onChange, prefix, suffix }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
      {hint && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
    <div style={{
      display: 'flex', alignItems: 'center',
      border: '2px solid var(--border-color)', borderRadius: 12,
      background: 'var(--bg-primary)', overflow: 'hidden',
      transition: 'border-color .15s',
    }}
      onFocusCapture={e => e.currentTarget.style.borderColor = '#6366f1'}
      onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
      {prefix && (
        <span style={{ padding: '0 12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', borderRight: '2px solid var(--border-color)', background: 'var(--bg-secondary)', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        style={{
          flex: 1, padding: '13px 14px', border: 'none', outline: 'none',
          fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)',
          background: 'transparent', width: '100%',
        }}
      />
      {suffix && (
        <span style={{ padding: '0 14px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', borderLeft: '2px solid var(--border-color)', background: 'var(--bg-secondary)', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default function SmartPercentCalculator() {
  const [mode, setMode] = useState('of_total');
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  // reset inputs when switching mode
  useEffect(() => { setA(''); setB(''); }, [mode]);

  const toNum = v => parseFloat(v);
  const fmt = n => (isNaN(n) ? null : n % 1 === 0 ? n.toLocaleString() : parseFloat(n.toFixed(4)).toLocaleString());

  /* ─── live result logic ───────────────────────────────── */
  const calc = () => {
    const A = toNum(a), B = toNum(b);
    if (mode === 'of_total') {
      if (!a || !b || B === 0) return null;
      return { main: `${fmt((A / B) * 100)}%`, label: `${fmt(A)} is this % of ${fmt(B)}` };
    }
    if (mode === 'discount') {
      if (!a || !b) return null;
      const saved = (B / 100) * A;
      return { main: `৳ ${fmt(A - saved)}`, sub: `You save ৳ ${fmt(saved)}`, label: `After ${fmt(B)}% off on ৳ ${fmt(A)}` };
    }
    if (mode === 'increase') {
      if (!a || !b || A === 0) return null;
      return { main: `${fmt(((B - A) / A) * 100)}%`, sub: `+৳ ${fmt(B - A)}`, label: `Increase from ${fmt(A)} to ${fmt(B)}` };
    }
    if (mode === 'decrease') {
      if (!a || !b || A === 0) return null;
      return { main: `${fmt(((A - B) / A) * 100)}%`, sub: `-৳ ${fmt(A - B)}`, label: `Decrease from ${fmt(A)} to ${fmt(B)}` };
    }
    return null;
  };

  const result = calc();
  const activeMode = MODES.find(m => m.id === mode);

  return (
    <div className="animate-fade-in tool-container" style={{ maxWidth: 620, margin: '0 auto' }}>
      <SEOHead
        title="Smart % Calculator - Discount, Percentage Change"
        description="Simple percentage calculator: find what % of a total, calculate discounts, percentage increase or decrease. Real-time results."
        keywords="percentage calculator, discount calculator, percentage change, percent of total"
      />

      {/* Header */}
      <div style={{ marginBottom: 4 }}>
        <span className="tool-header-badge"><Percent size={14} /> Smart Calculator</span>
        <h2 className="page-title text-gradient">% Calculator</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.95rem' }}>
          Instant percentage calculations for everyday use.
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '4px', background: 'var(--bg-secondary)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: active ? '#fff' : 'transparent',
                color: active ? m.color : 'var(--text-muted)',
                fontWeight: active ? 800 : 600,
                fontSize: '0.8rem',
                boxShadow: active ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
                transition: 'all .18s ease',
              }}
            >
              <m.icon size={15} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Card */}
      <div className="glass-panel" style={{ padding: '30px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Inputs */}
        {mode === 'of_total' && (
          <>
            <Field label="Value (Part)" hint="যা হিসাব করতে চান" value={a} onChange={setA} />
            <Field label="Total (Whole)" hint="মোট সংখ্যা" value={b} onChange={setB} />
          </>
        )}

        {mode === 'discount' && (
          <>
            <Field label="Original Price" prefix="৳" value={a} onChange={setA} />
            <Field label="Discount %" suffix="%" value={b} onChange={setB} />
          </>
        )}

        {(mode === 'increase' || mode === 'decrease') && (
          <>
            <Field label="Old / Previous Value" prefix="৳" value={a} onChange={setA} />
            <Field label="New / Current Value" prefix="৳" value={b} onChange={setB} />
          </>
        )}

        {/* ─── Result box ─────────────────────────────── */}
        <div style={{
          borderRadius: 16,
          background: result
            ? `${activeMode.color}10`
            : 'var(--bg-secondary)',
          border: `2px solid ${result ? activeMode.color + '30' : 'var(--border-color)'}`,
          padding: '22px 24px',
          textAlign: 'center',
          minHeight: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          transition: 'all .25s ease',
        }}>
          {result ? (
            <>
              <div style={{
                fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px',
                color: activeMode.color,
                animation: 'numPop .25s cubic-bezier(.34,1.56,.64,1)',
              }}>
                {result.main}
              </div>
              {result.sub && (
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {result.sub}
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 8 }}>
                {result.label}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              ⬆️ Fill in the fields above to see the result
            </p>
          )}
        </div>

        {/* Example hint */}
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {mode === 'of_total' && '💡 Example: 45 out of 200 → 22.5%'}
          {mode === 'discount' && '💡 Example: ৳1,200 with 30% off → Pay ৳840, Save ৳360'}
          {mode === 'increase' && '💡 Example: Salary ৳20,000 → ৳25,000 = 25% increase'}
          {mode === 'decrease' && '💡 Example: Price ৳500 → ৳380 = 24% decrease'}
        </div>

      </div>

      <style>{`
        @keyframes numPop {
          from { opacity: 0; transform: scale(.85); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
