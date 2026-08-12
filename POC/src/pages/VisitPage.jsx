import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, Modal, ModalHead, PayStatusTag, BackButton } from '../components/common.jsx';
import { CompareView } from '../components/compare.jsx';
import { UserFullHeader } from '../components/templates.jsx';
import { genFace, UNITS } from '../data.js';

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

// One procedure line in the visit plan: editable cost, removable, with its own product list
function PlanRow({ treatment }) {
  const { t, L, fmtMoney } = useLang();
  const { procById, productById, products, prodsOfTreatment, updateTreatment, removeTreatment, addTreatProd, removeTreatProd, statusOfTreatment, paidOfTreatment } = useStore();
  const [adding, setAdding] = useState(false);
  const [pid, setPid] = useState(products[0]?.id ?? '');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('ml');

  const proc = procById(treatment.procId);
  const prods = prodsOfTreatment(treatment.id);

  return (
    <div className="plan-row">
      <div className="row" style={{ flex: 1, minWidth: '14em', flexWrap: 'wrap' }}>
        <Icon name="bolt" size={14} />
        <b>{L(proc?.name)}</b>
      </div>
      <label className="row muted" style={{ fontSize: '.85em' }}>
        {t('common.cost')}
        <input type="number" value={treatment.cost} style={{ width: '6.5em' }}
          onChange={(e) => updateTreatment(treatment.id, { cost: parseFloat(e.target.value) || 0 })} />
      </label>
      <PayStatusTag status={statusOfTreatment(treatment)} sum={paidOfTreatment(treatment.id)} fmtMoney={fmtMoney} />
      <button className="iconbtn" onClick={() => setAdding((a) => !a)} title={t('vp.addProduct')}>
        <Icon name="plus" size={13} title={t('vp.addProduct')} />
      </button>
      <button className="iconbtn" onClick={() => removeTreatment(treatment.id)} title={t('vp.removeProcedure')}>
        <Icon name="trash" size={13} title={t('vp.removeProcedure')} />
      </button>

      <div className="plan-prods" style={{ width: '100%' }}>
        {prods.length === 0 && <span className="muted" style={{ fontSize: '.8em' }}>{t('trt.noProducts')}</span>}
        {prods.map((tp) => (
          <span key={tp.id} className="plan-prod">
            <Icon name="box" size={11} />
            {L(productById(tp.productId)?.name)} · {tp.amount} {t(`unit.${tp.unit}`)}
            <button className="iconbtn" style={{ width: '1.3em', height: '1.3em' }} onClick={() => removeTreatProd(tp.id)}>
              <Icon name="x" size={10} title={t('vp.removeProduct')} />
            </button>
          </span>
        ))}
      </div>

      {adding && (
        <div className="row" style={{ width: '100%', flexWrap: 'wrap', paddingInlineStart: '1.4em' }}>
          <select value={pid} onChange={(e) => setPid(Number(e.target.value))}>
            {products.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
          </select>
          <input type="number" min="0" step="0.5" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} style={{ width: '5em' }} />
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
          </select>
          <button className="btn sm" onClick={() => { if (pid) { addTreatProd(treatment.id, Number(pid), amount, unit); setAdding(false); } }}>
            <Icon name="check" size={13} />{t('common.add')}
          </button>
          <button className="btn ghost sm" onClick={() => setAdding(false)}>{t('common.cancel')}</button>
        </div>
      )}
    </div>
  );
}

export default function VisitPage() {
  const { t, L, fmtDate, fmtMoney } = useLang();
  const { nav, goBack, openPopup, visitById, userById, treatmentsOfVisit, procedures, visitTotal, visitPayStatus, visitPaid, updateVisit, addTreatment, showToast } = useStore();
  const visit = visitById(nav.params.visitId);
  const [elapsed, setElapsed] = useState(visit?.elapsed || 0);
  const [running, setRunning] = useState(visit?.status === 'active');
  const [addPhoto, setAddPhoto] = useState(false);
  const [newProc, setNewProc] = useState('');

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
      <div className="row"><BackButton onClick={goBack} /></div>
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
        {trs.length === 0 && <div className="muted" style={{ paddingBottom: '.5em' }}>{t('vp.noTreatments')}</div>}
        {trs.map((tr) => <PlanRow key={tr.id} treatment={tr} />)}

        <div className="row" style={{ marginTop: '.7em', flexWrap: 'wrap' }}>
          <select value={newProc} onChange={(e) => setNewProc(e.target.value)}>
            <option value="">{t('vp.chooseProcedure')}</option>
            {procedures.map((p) => <option key={p.id} value={p.id}>{L(p.name)} — {fmtMoney(p.cost)}</option>)}
          </select>
          <button className="btn sm" disabled={!newProc} style={{ opacity: newProc ? 1 : .5 }}
            onClick={() => { if (newProc) { addTreatment(visit.id, visit.userId, Number(newProc)); setNewProc(''); } }}>
            <Icon name="plus" size={14} />{t('vp.addProcedure')}
          </button>
          <span className="spread" style={{ flex: 1, minWidth: '12em' }}>
            <b>{t('common.total')}: {fmtMoney(visitTotal(visit.id))}</b>
            <PayStatusTag status={visitPayStatus(visit.id)} sum={visitPaid(visit.id)} fmtMoney={fmtMoney} />
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <div className="spread" style={{ marginBottom: '.6em' }}>
          <h2 className="row"><Icon name="camera" size={18} />{t('vp.book')}</h2>
          <button className="btn sm" onClick={() => setAddPhoto(true)}><Icon name="plus" size={14} />{t('vp.addPhoto')}</button>
        </div>
        <CompareView before={visit.photos.before} after={visit.photos.after} compact />
      </div>

      {addPhoto && <AddVisitPhotoPopup close={() => setAddPhoto(false)} visitId={visit.id} />}
    </div>
  );
}
