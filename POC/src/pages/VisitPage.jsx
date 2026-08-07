import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, Modal, ModalHead, PayStatusTag } from '../components/common.jsx';
import { UserFullHeader } from '../components/templates.jsx';
import { genFace } from '../data.js';

function AddVisitPhotoPopup({ close, visitId }) {
  const { t } = useLang();
  const { addVisitPhoto } = useStore();
  const [side, setSide] = useState(null);
  const [shot, setShot] = useState(null);
  const fileRef = useRef(null);

  const commit = (img) => { addVisitPhoto(visitId, side, img); close(); };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('vp.addPhoto')} icon="camera" onClose={close} />
      <div className="muted">{t('vp.side')}</div>
      <div className="row">
        <button className={`chip ${side === 'before' ? 'on' : ''}`} onClick={() => setSide('before')}>{t('up.before')}</button>
        <button className={`chip ${side === 'after' ? 'on' : ''}`} onClick={() => setSide('after')}>{t('up.after')}</button>
      </div>
      {side && (
        <>
          <div className="viewfinder" style={{ height: '12em' }}>
            {shot ? <img src={shot} alt="" style={{ height: '100%' }} /> : <div className="frame-mark" />}
          </div>
          <div className="muted row"><Icon name="camera" size={13} />{t('pp.cameraNote')}</div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <button className="btn sm" onClick={() => setShot(genFace({ hue: 22 + Math.floor(Math.random() * 15), lips: side === 'after' ? .85 : .3, flaw: side === 'after' ? .1 : .7, blush: side === 'after' ? .3 : .1, variant: Math.floor(Math.random() * 40) }))}>
              <Icon name="camera" size={14} />{t('pp.capture')}
            </button>
            <button className="btn ghost sm" onClick={() => fileRef.current?.click()}><Icon name="plus" size={14} />{t('pp.upload')}</button>
            {shot && <button className="btn sm" onClick={() => commit(shot)}><Icon name="check" size={14} />{t('pp.use')}</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => commit(r.result);
              r.readAsDataURL(f);
            }} />
        </>
      )}
    </Modal>
  );
}

export default function VisitPage() {
  const { t, L, fmtDate, fmtMoney } = useLang();
  const { nav, openPopup, visitById, userById, treatmentsOfVisit, prodsOfTreatment, productById, procById, statusOfTreatment, paidOfTreatment, visitTotal, visitPayStatus, visitPaid, updateVisit, showToast } = useStore();
  const visit = visitById(nav.params.visitId);
  const [elapsed, setElapsed] = useState(visit?.elapsed || 0);
  const [running, setRunning] = useState(visit?.status === 'active');
  const [addPhoto, setAddPhoto] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!visit) return <div className="page"><div className="muted">{t('tbl.noData')}</div></div>;
  const user = userById(visit.userId);
  const trs = treatmentsOfVisit(visit.id);
  const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const fmtEl = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const start = () => { setRunning(true); updateVisit(visit.id, { status: 'active' }); };
  const pause = () => { setRunning(false); updateVisit(visit.id, { elapsed }); };
  const end = () => { setRunning(false); updateVisit(visit.id, { status: 'done', elapsed }); showToast(t('vp.saved')); };

  return (
    <div className="page">
      <UserFullHeader user={user} />

      <div className="card timerbox">
        <div>
          <h2 className="row"><Icon name="clock" size={18} />{t('vp.title')} — {fmtDate(visit.date)}</h2>
          <div className="muted">{t('vp.scheduled')}: {fmtMin(visit.start)}–{fmtMin(visit.end)} · <span className={`tag ${visit.status === 'active' ? 'paid' : visit.status === 'done' ? 'partial' : 'pending'}`}>{t(`visit.${visit.status}`)}</span></div>
        </div>
        <div className="row" style={{ marginInlineStart: 'auto', flexWrap: 'wrap' }}>
          <span className="muted">{t('vp.duration')}:</span>
          <span className="timer">{fmtEl(elapsed)}</span>
          {!running && visit.status !== 'done' && <button className="btn sm" onClick={start}><Icon name="play" size={14} />{t('vp.start')}</button>}
          {running && <button className="btn ghost sm" onClick={pause}><Icon name="pause" size={14} />{t('vp.pause')}</button>}
          {visit.status !== 'done' && <button className="btn danger sm" onClick={end}><Icon name="stop" size={14} />{t('vp.end')}</button>}
          <button className="btn sm" onClick={() => openPopup('quickPay', { userId: visit.userId })}><Icon name="dollar" size={14} />{t('vp.addPayment')}</button>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="legal" size={18} />{t('vp.plan')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5em' }}>
          {trs.map((tr) => {
            const proc = procById(tr.procId);
            const prods = prodsOfTreatment(tr.id).map((tp) => L(productById(tp.productId)?.name)).filter(Boolean);
            return (
              <div key={tr.id} className="spread" style={{ borderBottom: '1px dashed var(--line)', paddingBottom: '.45em', flexWrap: 'wrap' }}>
                <span><b>{L(proc?.name)}</b> {prods.length > 0 && <span className="muted">· {prods.join(', ')}</span>}</span>
                <span className="row">
                  <span>{t('common.cost')}: <b>{fmtMoney(tr.cost)}</b></span>
                  <PayStatusTag status={statusOfTreatment(tr)} sum={paidOfTreatment(tr.id)} fmtMoney={fmtMoney} />
                </span>
              </div>
            );
          })}
          <div className="spread">
            <b>{t('common.total')}: {fmtMoney(visitTotal(visit.id))}</b>
            <PayStatusTag status={visitPayStatus(visit.id)} sum={visitPaid(visit.id)} fmtMoney={fmtMoney} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <div className="spread" style={{ marginBottom: '.6em' }}>
          <h2 className="row"><Icon name="camera" size={18} />{t('vp.book')}</h2>
          <button className="btn sm" onClick={() => setAddPhoto(true)}><Icon name="plus" size={14} />{t('vp.addPhoto')}</button>
        </div>
        <div className="visitbook">
          <div className="card vb-side">
            <h3>{t('up.before')}</h3>
            <div className="vb-photos">
              {visit.photos.before.length === 0 ? <span className="muted">{t('vp.noPhotos')}</span>
                : visit.photos.before.map((p, i) => <img key={i} src={p} alt={`${t('up.before')} ${i + 1}`} onClick={() => openPopup('lightbox', { src: p, name: t('up.before') })} style={{ cursor: 'pointer' }} />)}
            </div>
          </div>
          <div className="vb-arrow"><Icon name="arrowR" size={34} /></div>
          <div className="card vb-side">
            <h3>{t('up.after')}</h3>
            <div className="vb-photos">
              {visit.photos.after.length === 0 ? <span className="muted">{t('vp.noPhotos')}</span>
                : visit.photos.after.map((p, i) => <img key={i} src={p} alt={`${t('up.after')} ${i + 1}`} onClick={() => openPopup('lightbox', { src: p, name: t('up.after') })} style={{ cursor: 'pointer' }} />)}
            </div>
          </div>
        </div>
      </div>

      {addPhoto && <AddVisitPhotoPopup close={() => setAddPhoto(false)} visitId={visit.id} />}
    </div>
  );
}
