import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, PayStatusTag, BackButton } from '../components/common.jsx';
import { AdminPassConfirm } from '../components/guards.jsx';
import { CompareView } from '../components/compare.jsx';
import { AppointmentEditPopup } from '../components/appointments.jsx';
import { UserFullHeader } from '../components/templates.jsx';
import { UNITS } from '../data.js';

// One procedure in the plan: icon + name, editable cost, its product table
function PlanRow({ treatment }) {
  const { t, L, fmtMoney } = useLang();
  const {
    procById, productById, products, prodsOfTreatment, updateTreatment, removeTreatment,
    addTreatProd, updateTreatProd, removeTreatProd, statusOfTreatment, paidOfTreatment,
  } = useStore();
  const [adding, setAdding] = useState(false);
  const [pid, setPid] = useState(products[0]?.id ?? '');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('ml');

  const proc = procById(treatment.procId);
  const prods = prodsOfTreatment(treatment.id);

  return (
    <div className="plan-row">
      <div className="row" style={{ flex: 1, minWidth: '14em', flexWrap: 'wrap' }}>
        <Icon name={proc?.icon || 'bolt'} size={17} />
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

      <div style={{ width: '100%', paddingInlineStart: '1.6em' }}>
        {prods.length === 0 ? <span className="muted" style={{ fontSize: '.85em' }}>{t('trt.noProducts')}</span> : (
          <div className="tbl-wrap">
            <table className="tbl prod-tbl">
              <thead>
                <tr><th>{t('inv.image')}</th><th>{t('ti.product')}</th><th>{t('ti.amountUsed')}</th><th /></tr>
              </thead>
              <tbody>
                {prods.map((tp) => {
                  const p = productById(tp.productId);
                  return (
                    <tr key={tp.id}>
                      <td>{p && <img src={p.img} alt={L(p.name)} className="prod-thumb" />}</td>
                      <td>{L(p?.name)}<br /><span className="muted" style={{ fontSize: '.85em' }}>{L(p?.company)}</span></td>
                      <td>
                        <span className="row">
                          <input type="number" min="0" step="0.5" value={tp.amount} style={{ width: '5em' }}
                            onChange={(e) => updateTreatProd(tp.id, { amount: parseFloat(e.target.value) || 0 })} />
                          <select value={tp.unit} onChange={(e) => updateTreatProd(tp.id, { unit: e.target.value })}>
                            {UNITS.map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
                          </select>
                        </span>
                      </td>
                      <td>
                        <button className="iconbtn" onClick={() => removeTreatProd(tp.id)}>
                          <Icon name="x" size={12} title={t('vp.removeProduct')} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {adding && (
          <div className="row" style={{ flexWrap: 'wrap', marginTop: '.4em' }}>
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
    </div>
  );
}

// Rich-text documentation that locks once signed, keeping a date+time stamp.
function Documentation({ visit }) {
  const { t, L, lang } = useLang();
  const { setVisitDoc, showToast } = useStore();
  const ref = useRef(null);
  const doc = visit.doc || { text: ['', ''], signedAt: null };
  const locked = !!doc.signedAt;

  useEffect(() => {
    if (ref.current && !locked) ref.current.innerHTML = L(doc.text) || '';
  }, [visit.id, lang, locked]);

  const cmd = (c) => { document.execCommand(c); ref.current?.focus(); };

  const sign = () => {
    const html = ref.current?.innerHTML || '';
    const now = new Date();
    const stamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setVisitDoc(visit.id, { text: [html, html], signedAt: stamp });
    showToast(t('ap.signed'));
  };

  return (
    <div className="card" style={{ padding: '1em' }}>
      <div className="spread" style={{ marginBottom: '.6em', flexWrap: 'wrap' }}>
        <h2 className="row"><Icon name="doc" size={18} />{t('ap.doc')}</h2>
        {locked
          ? <span className="tag paid"><Icon name="check" size={12} />{t('ap.signedAt', { when: doc.signedAt })}</span>
          : <button className="btn sm" onClick={sign}><Icon name="edit" size={14} />{t('ap.sign')}</button>}
      </div>
      {locked ? (
        <div className="richtext" style={{ opacity: .85 }} dangerouslySetInnerHTML={{ __html: L(doc.text) }} />
      ) : (
        <>
          <div className="row" style={{ marginBottom: '.4em' }}>
            <button className="iconbtn" title={t('fb.bold')} onMouseDown={(e) => { e.preventDefault(); cmd('bold'); }}><b>B</b></button>
            <button className="iconbtn" title={t('fb.italic')} onMouseDown={(e) => { e.preventDefault(); cmd('italic'); }}><i>I</i></button>
            <button className="iconbtn" title={t('fb.underline')} onMouseDown={(e) => { e.preventDefault(); cmd('underline'); }}><u>U</u></button>
          </div>
          <div ref={ref} className="richtext" contentEditable suppressContentEditableWarning
            data-placeholder={t('ap.docPlaceholder')} />
        </>
      )}
      {locked && <div className="muted row" style={{ marginTop: '.4em' }}><Icon name="check" size={13} />{t('ap.locked')}</div>}
    </div>
  );
}

export default function AppointmentPage() {
  const { t, L, fmtDate, fmtMoney } = useLang();
  const {
    nav, goBack, openPopup, settings, visitById, userById, treatmentsOfVisit, procedures,
    visitTotal, visitPayStatus, visitPaid, updateVisit, removeVisit, addTreatment, showToast,
  } = useStore();
  const visit = visitById(nav.params.visitId);
  const [elapsed, setElapsed] = useState(visit?.elapsed || 0);
  const [running, setRunning] = useState(visit?.status === 'active');
  const [newProc, setNewProc] = useState('');
  const [editSchedule, setEditSchedule] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

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
        <div onDoubleClick={() => setEditSchedule(true)} style={{ cursor: 'pointer' }} title={t('ap.dblHint')}>
          <h2 className="row"><Icon name="clock" size={18} />{t('vp.title')} — {fmtDate(visit.date)}</h2>
          <div className="muted">
            {t('vp.scheduled')}: {fmtMin(visit.start)}–{fmtMin(visit.end)} ·{' '}
            <span className={`tag ${visit.status === 'active' ? 'paid' : visit.status === 'done' ? 'partial' : 'pending'}`}>{t(`visit.${visit.status}`)}</span>
          </div>
          <div className="muted" style={{ fontSize: '.82em' }}>{t('ap.dblHint')}</div>
        </div>
        <div className="row" style={{ marginInlineStart: 'auto', flexWrap: 'wrap' }}>
          <span className="muted">{t('vp.duration')}:</span>
          <span className="timer">{fmtEl(elapsed)}</span>
          {!running && visit.status !== 'done' && <button className="btn sm" onClick={start}><Icon name="play" size={14} />{t('vp.start')}</button>}
          {running && <button className="btn ghost sm" onClick={pause}><Icon name="pause" size={14} />{t('vp.pause')}</button>}
          {visit.status !== 'done' && <button className="btn danger sm" onClick={end}><Icon name="stop" size={14} />{t('vp.end')}</button>}
          <button className="btn sm" onClick={() => openPopup('quickPay', { userId: visit.userId })}><Icon name="dollar" size={14} />{t('vp.addPayment')}</button>
          <button className="btn danger bin-lg" onClick={() => setConfirmDel(true)} title={t('ap.delete')}>
            <Icon name="trash" size={22} title={t('ap.delete')} />
          </button>
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
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="camera" size={18} />{t('vp.book')}</h2>
        <CompareView before={visit.photos.before} after={visit.photos.after} visitId={visit.id} compact />
      </div>

      {settings.showDoc && <Documentation visit={visit} />}

      {editSchedule && <AppointmentEditPopup close={() => setEditSchedule(false)} visitId={visit.id} onDeleted={goBack} />}
      {confirmDel && (
        <AdminPassConfirm
          close={() => setConfirmDel(false)}
          title={t('ap.delete')}
          subject={`${L(user?.first)} ${L(user?.last)} — ${fmtDate(visit.date)}`}
          onConfirm={() => { removeVisit(visit.id); showToast(t('ap.deleted')); goBack(); }}
        />
      )}
    </div>
  );
}
