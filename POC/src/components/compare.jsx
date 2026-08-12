import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n.jsx';
import { Icon, PanZoomImg } from './common.jsx';

// T. Treatment comparison view template
// 3 parts: before thumbs | comparison collage | after thumbs.
// Collage modes: top/bottom, side by side, overlay (after shot at adjustable opacity).
// Images pan (drag) and zoom (wheel); a button blows the whole block up to full screen.
export function CompareView({ before = [], after = [], compact = false }) {
  const { t } = useLang();
  const [selB, setSelB] = useState(0);
  const [selA, setSelA] = useState(0);
  const [mode, setMode] = useState('side');
  const [opacity, setOpacity] = useState(40);
  const [full, setFull] = useState(false);
  const [pzB, setPzB] = useState({ x: 0, y: 0, scale: 1 });
  const [pzA, setPzA] = useState({ x: 0, y: 0, scale: 1 });

  const srcB = before[selB];
  const srcA = after[selA];

  const MODES = [['stack', 'chart', t('cmp.stack')], ['side', 'box', t('cmp.side')], ['overlay', 'eye', t('cmp.overlay')]];

  const Thumbs = ({ list, sel, setSel, label }) => (
    <div className="cmp-thumbs">
      <span className="muted" style={{ textAlign: 'center' }}>{label}</span>
      {list.length === 0 ? <span className="muted" style={{ fontSize: '.78em', textAlign: 'center' }}>{t('cmp.noPhotos')}</span>
        : list.map((p, i) => (
          <img key={i} src={p} className={sel === i ? 'sel' : ''} onClick={() => setSel(i)} alt={`${label} ${i + 1}`} />
        ))}
    </div>
  );

  const Cell = ({ label, src, pz, setPz }) => (
    <div className="cmp-cell">
      <span className="cmp-label tag partial">{label}</span>
      {src ? <PanZoomImg src={src} state={pz} setState={setPz} style={{ maxWidth: '100%' }} />
        : <span className="muted" style={{ padding: '1em', textAlign: 'center' }}>{t('ti.pickHint')}</span>}
    </div>
  );

  const collage = mode === 'overlay' ? (
    <div className="cmp-view overlay">
      <div className="cmp-cell">
        <span className="cmp-label tag partial">{t('cmp.overlay')}</span>
        {srcB && <PanZoomImg src={srcB} state={pzB} setState={setPzB} style={{ maxWidth: '100%' }} />}
        {srcA && <PanZoomImg src={srcA} state={pzA} setState={setPzA} style={{ maxWidth: '100%', opacity: opacity / 100 }} />}
        {!srcB && !srcA && <span className="muted" style={{ padding: '1em', textAlign: 'center' }}>{t('ti.pickHint')}</span>}
      </div>
    </div>
  ) : (
    <div className={`cmp-view ${mode}`}>
      <Cell label={t('up.before')} src={srcB} pz={pzB} setPz={setPzB} />
      <Cell label={t('up.after')} src={srcA} pz={pzA} setPz={setPzA} />
    </div>
  );

  const toolbar = (
    <div className="spread" style={{ flexWrap: 'wrap', gap: '.5em' }}>
      <span className="row" style={{ flexWrap: 'wrap' }}>
        {MODES.map(([k, icon, label]) => (
          <button key={k} className={`chip ${mode === k ? 'on' : ''}`} onClick={() => setMode(k)} title={t('ti.layout')}>
            <Icon name={icon} size={13} />{label}
          </button>
        ))}
        {mode === 'overlay' && (
          <label className="row muted" style={{ fontSize: '.85em' }}>
            {t('cmp.opacity')} · {opacity}%
            <input type="range" min="0" max="100" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} style={{ width: '8em' }} />
          </label>
        )}
      </span>
      <span className="row">
        <span className="muted" style={{ fontSize: '.85em' }}>{t('ti.zoomHint')}</span>
        <button className="btn ghost sm" onClick={() => setFull((f) => !f)}>
          <Icon name="eye" size={13} />{t('cmp.fullscreen')}
        </button>
      </span>
    </div>
  );

  const body = (
    <div className={`cmp ${compact ? 'compact' : ''}`}>
      <Thumbs list={before} sel={selB} setSel={setSelB} label={t('up.before')} />
      {collage}
      <Thumbs list={after} sel={selA} setSel={setSelA} label={t('up.after')} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.7em' }}>
      {toolbar}
      {body}
      {/* Portalled to <body>: an ancestor .card uses backdrop-filter, which makes it
          the containing block for position:fixed — the overlay would be trapped inside it. */}
      {full && createPortal(
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setFull(false); }}>
          <div className="card" style={{ width: '96vw', height: '94vh', padding: '1em', display: 'flex', flexDirection: 'column', gap: '.7em' }}>
            <div className="spread">
              <h2 className="row"><Icon name="eye" size={19} />{t('cmp.title')}</h2>
              <button className="iconbtn" onClick={() => setFull(false)}><Icon name="x" size={15} title={t('common.close')} /></button>
            </div>
            {toolbar}
            <div style={{ flex: 1, minHeight: 0 }}>
              <div className="cmp fullscreen">
                <Thumbs list={before} sel={selB} setSel={setSelB} label={t('up.before')} />
                {collage}
                <Thumbs list={after} sel={selA} setSel={setSelA} label={t('up.after')} />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
