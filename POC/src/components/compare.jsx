import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, PanZoomImg, Modal, ModalHead } from './common.jsx';
import { AdminPassConfirm } from './guards.jsx';
import { exportComparison } from '../pdf.js';
import { genFace, DEFAULT_LOGO } from '../data.js';

// Upload or shoot a new photo straight into the appointment book.
function AddPhotoPopup({ close, visitId }) {
  const { t } = useLang();
  const { addVisitPhoto } = useStore();
  const [side, setSide] = useState('before');
  const [shot, setShot] = useState(null);
  const fileRef = useRef(null);
  const commit = (img) => { addVisitPhoto(visitId, side, img); close(); };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('cmp.addPhoto')} icon="camera" onClose={close} />
      <div className="muted">{t('vp.side')}</div>
      <div className="row">
        <button className={`chip ${side === 'before' ? 'on' : ''}`} onClick={() => setSide('before')}>{t('up.before')}</button>
        <button className={`chip ${side === 'after' ? 'on' : ''}`} onClick={() => setSide('after')}>{t('up.after')}</button>
      </div>
      <div className="viewfinder" style={{ height: '12em' }}>
        {shot ? <img src={shot} alt="" style={{ height: '100%' }} /> : <div className="frame-mark" />}
      </div>
      <div className="muted row"><Icon name="camera" size={13} />{t('pp.cameraNote')}</div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={() => setShot(genFace({
          hue: 22 + Math.floor(Math.random() * 15),
          lips: side === 'after' ? .85 : .3,
          flaw: side === 'after' ? .1 : .7,
          blush: side === 'after' ? .3 : .1,
          variant: Math.floor(Math.random() * 40),
        }))}>
          <Icon name="camera" size={14} />{t('pp.capture')}
        </button>
        <button className="btn ghost sm" onClick={() => fileRef.current?.click()}><Icon name="plus" size={14} />{t('pp.upload')}</button>
        {shot && <button className="btn sm" onClick={() => commit(shot)}><Icon name="check" size={14} />{t('pp.use')}</button>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => commit(r.result);
        r.readAsDataURL(f);
      }} />
    </Modal>
  );
}

// T. Appointment comparison view template
// before thumbs | collage (top-bottom / side-by-side / overlay) | after thumbs.
// Pan + zoom per image, toggleable hairline divider, clinic logo in the corner,
// export of the merged view, full-screen popup, and per-photo delete.
export function CompareView({ before = [], after = [], visitId = null, compact = false }) {
  const { t } = useLang();
  const { settings, showToast, removeVisitPhoto } = useStore();
  const [selB, setSelB] = useState(0);
  const [selA, setSelA] = useState(0);
  const [mode, setMode] = useState('side');
  const [opacity, setOpacity] = useState(40);
  const [border, setBorder] = useState(true);
  const [full, setFull] = useState(false);
  const [adding, setAdding] = useState(false);
  const [delPhoto, setDelPhoto] = useState(null); // {side, index}
  const [pzB, setPzB] = useState({ x: 0, y: 0, scale: 1 });
  const [pzA, setPzA] = useState({ x: 0, y: 0, scale: 1 });

  const logo = settings.clinicLogo || DEFAULT_LOGO;
  const srcB = before[selB];
  const srcA = after[selA];

  const MODES = [['stack', 'chart', t('cmp.stack')], ['side', 'box', t('cmp.side')], ['overlay', 'eye', t('cmp.overlay')]];

  const doExport = () => {
    exportComparison({
      beforeSrc: srcB, afterSrc: srcA, mode, opacity, logo, border,
      fileName: `comparison-${mode}`,
    }).then(() => showToast(t('cmp.exported')));
  };

  const Thumbs = ({ list, sel, setSel, label, side }) => (
    <div className="cmp-thumbs">
      <span className="muted" style={{ textAlign: 'center' }}>{label}</span>
      {list.length === 0 ? <span className="muted" style={{ fontSize: '.78em', textAlign: 'center' }}>{t('cmp.noPhotos')}</span>
        : list.map((p, i) => (
          <span key={i} className="cmp-thumb">
            <img src={p} className={sel === i ? 'sel' : ''} onClick={() => setSel(i)} alt={`${label} ${i + 1}`} />
            {visitId != null && (
              <button className="iconbtn cmp-thumb-del" onClick={() => setDelPhoto({ side, index: i })}>
                <Icon name="trash" size={11} title={t('common.delete')} />
              </button>
            )}
          </span>
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

  const collage = (
    <div className={`cmp-view ${mode} ${border ? 'bordered' : ''}`}>
      {mode === 'overlay' ? (
        <div className="cmp-cell">
          <span className="cmp-label tag partial">{t('cmp.overlay')}</span>
          {srcB && <PanZoomImg src={srcB} state={pzB} setState={setPzB} style={{ maxWidth: '100%' }} />}
          {srcA && <PanZoomImg src={srcA} state={pzA} setState={setPzA} style={{ maxWidth: '100%', opacity: opacity / 100 }} />}
          {!srcB && !srcA && <span className="muted" style={{ padding: '1em', textAlign: 'center' }}>{t('ti.pickHint')}</span>}
        </div>
      ) : (
        <>
          <Cell label={t('up.before')} src={srcB} pz={pzB} setPz={setPzB} />
          <Cell label={t('up.after')} src={srcA} pz={pzA} setPz={setPzA} />
        </>
      )}
      <img className="cmp-logo" src={logo} alt="" />
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
        <button className={`chip ${border ? 'on' : ''}`} onClick={() => setBorder((b) => !b)}>
          <Icon name="grip" size={13} />{t('cmp.border')}
        </button>
      </span>
      <span className="row" style={{ flexWrap: 'wrap' }}>
        <span className="muted" style={{ fontSize: '.85em' }}>{t('ti.zoomHint')}</span>
        {visitId != null && (
          <button className="btn ghost sm" onClick={() => setAdding(true)}>
            <Icon name="camera" size={13} />{t('cmp.addPhoto')}
          </button>
        )}
        <button className="btn ghost sm" onClick={doExport}><Icon name="download" size={13} />{t('cmp.export')}</button>
        <button className="btn ghost sm" onClick={() => setFull((f) => !f)}><Icon name="eye" size={13} />{t('cmp.fullscreen')}</button>
      </span>
    </div>
  );

  const body = (klass) => (
    <div className={`cmp ${klass}`}>
      <Thumbs list={before} sel={selB} setSel={setSelB} label={t('up.before')} side="before" />
      {collage}
      <Thumbs list={after} sel={selA} setSel={setSelA} label={t('up.after')} side="after" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.7em' }}>
      {toolbar}
      {body(compact ? 'compact' : '')}

      {adding && visitId != null && <AddPhotoPopup close={() => setAdding(false)} visitId={visitId} />}
      {delPhoto && (
        <AdminPassConfirm
          close={() => setDelPhoto(null)}
          title={t('cmp.deletePhoto')}
          onConfirm={() => { removeVisitPhoto(visitId, delPhoto.side, delPhoto.index); setSelB(0); setSelA(0); }}
        />
      )}

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
            <div style={{ flex: 1, minHeight: 0 }}>{body('fullscreen')}</div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
