import React, { useState, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Modal, ModalHead, PROC_ICONS } from '../components/common.jsx';
import { AdminPassConfirm } from '../components/guards.jsx';
import { genTreatmentImg, UNITS } from '../data.js';

// The catalog of procedures the clinic offers. Appointments reference these; adding a
// procedure to an appointment copies its default product set (see store.addTreatment).
function ProcedureEditPopup({ close, procedure }) {
  const { t, L } = useLang();
  const { products, addProcedure, updateProcedure, showToast } = useStore();
  const isNew = !procedure;
  const [f, setF] = useState({
    name: procedure ? L(procedure.name) : '',
    cost: procedure?.cost ?? 0,
    duration: procedure?.duration ?? 30,
    visitsCount: procedure?.visitsCount ?? 1,
    longevity: procedure ? L(procedure.longevity) : '',
    alerts: procedure ? procedure.alerts.map((a) => L(a)).join('\n') : '',
    notes: procedure ? procedure.notes.map((n) => L(n)).filter((s) => s.trim()).join('\n') : '',
  });
  const [icon, setIcon] = useState(procedure?.icon || 'bolt');
  const [prods, setProds] = useState(procedure?.products ? [...procedure.products] : []);
  const [img, setImg] = useState(procedure?.img || genTreatmentImg(Math.floor(Math.random() * 360)));
  const [pid, setPid] = useState(products[0]?.id ?? '');
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState('ml');
  const [err, setErr] = useState(null);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = () => {
    if (!f.name.trim()) { setErr(t('fb.nameRequired')); return; }
    const patch = {
      name: [f.name, f.name],
      icon,
      cost: parseFloat(f.cost) || 0,
      duration: parseInt(f.duration, 10) || 0,
      visitsCount: parseInt(f.visitsCount, 10) || 1,
      longevity: [f.longevity, f.longevity],
      alerts: f.alerts.split('\n').filter((s) => s.trim()).map((s) => [s, s]),
      notes: f.notes.split('\n').filter((s) => s.trim()).map((s) => [s, s]),
      products: prods,
      img,
    };
    if (isNew) addProcedure(patch); else updateProcedure(procedure.id, patch);
    showToast(t('common.save'));
    close();
  };

  return (
    <Modal onClose={close}>
      <ModalHead title={isNew ? t('trt.add') : t('common.edit')} icon={icon} onClose={close} />
      <div className="row">
        <img src={img} width={100} height={75} style={{ borderRadius: 8 }} alt="" />
        <button className="btn ghost sm" onClick={() => fileRef.current?.click()}><Icon name="camera" size={14} />{t('pp.upload')}</button>
        <button className="btn ghost sm" onClick={() => setImg(genTreatmentImg(Math.floor(Math.random() * 360)))}><Icon name="edit" size={14} />{t('pp.take')}</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const r = new FileReader(); r.onload = () => setImg(r.result); r.readAsDataURL(file);
        }} />
      </div>

      <div>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('trt.icon')}</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {PROC_ICONS.map((ic) => (
            <button key={ic} className={`iconbtn ${icon === ic ? 'on' : ''}`} onClick={() => setIcon(ic)}>
              <Icon name={ic} size={16} title={ic} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6em' }}>
        <label>{t('trt.name')}<input value={f.name} onChange={set('name')} style={{ width: '100%' }} /></label>
        <label>{t('common.cost')}<input type="number" value={f.cost} onChange={set('cost')} style={{ width: '100%' }} /></label>
        <label>{t('trt.duration')} ({t('common.min')})<input type="number" value={f.duration} onChange={set('duration')} style={{ width: '100%' }} /></label>
        <label>{t('trt.visitsCount')}<input type="number" value={f.visitsCount} onChange={set('visitsCount')} style={{ width: '100%' }} /></label>
        <label>{t('trt.longevity')}<input value={f.longevity} onChange={set('longevity')} style={{ width: '100%' }} /></label>
      </div>

      <div>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('trt.products')}</div>
        <div className="plan-prods" style={{ paddingInlineStart: 0, marginBottom: '.5em' }}>
          {prods.length === 0 && <span className="muted" style={{ fontSize: '.85em' }}>{t('trt.noProducts')}</span>}
          {prods.map((pp, i) => (
            <span key={i} className="plan-prod">
              <Icon name="box" size={11} />
              {L(products.find((p) => p.id === pp.productId)?.name)} · {pp.amount} {t(`unit.${pp.unit}`)}
              <button className="iconbtn" style={{ width: '1.3em', height: '1.3em' }} onClick={() => setProds((ps) => ps.filter((_, j) => j !== i))}>
                <Icon name="x" size={10} title={t('vp.removeProduct')} />
              </button>
            </span>
          ))}
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <select value={pid} onChange={(e) => setPid(Number(e.target.value))}>
            {products.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
          </select>
          <input type="number" min="0" step="0.5" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} style={{ width: '5em' }} />
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
          </select>
          <button className="btn sm" onClick={() => pid && setProds((ps) => [...ps, { productId: Number(pid), amount, unit }])}>
            <Icon name="plus" size={13} />{t('vp.addProduct')}
          </button>
        </div>
      </div>

      <label>{t('common.alerts')}<textarea rows={2} value={f.alerts} onChange={set('alerts')} style={{ width: '100%' }} /></label>
      <label>{t('common.notes')}<textarea rows={2} value={f.notes} onChange={set('notes')} style={{ width: '100%' }} /></label>
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export default function Procedures() {
  const { t, L, fmtMoney, fmtNum } = useLang();
  const { procedures, productById, removeProcedure } = useStore();
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const cols = [
    { key: 'img', label: t('trt.image'), render: (p) => <img src={p.img} width={70} height={52} style={{ borderRadius: 8, cursor: 'pointer' }} alt={L(p.name)} onClick={() => setEdit(p)} /> },
    {
      key: 'name', label: t('trt.name'), sortVal: (p) => L(p.name),
      render: (p) => <b className="row"><Icon name={p.icon || 'bolt'} size={16} />{L(p.name)}</b>,
    },
    { key: 'cost', label: t('common.cost'), sortVal: (p) => p.cost, render: (p) => <b>{fmtMoney(p.cost)}</b> },
    {
      key: 'products', label: t('trt.products'),
      render: (p) => (p.products?.length ? (
        <span className="muted" style={{ fontSize: '.88em' }}>
          {p.products.map((pp) => `${L(productById(pp.productId)?.name)} (${pp.amount} ${t(`unit.${pp.unit}`)})`).filter(Boolean).join(', ')}
        </span>
      ) : <span className="muted">—</span>),
    },
    { key: 'duration', label: t('trt.duration'), sortVal: (p) => p.duration, render: (p) => `${fmtNum(p.duration)} ${t('common.min')}` },
    { key: 'visits', label: t('trt.visitsCount'), sortVal: (p) => p.visitsCount, render: (p) => fmtNum(p.visitsCount) },
    { key: 'longevity', label: t('trt.longevity'), render: (p) => <span className="muted">{L(p.longevity)}</span> },
    {
      key: 'alerts', label: t('common.alerts'),
      render: (p) => (p.alerts?.length ? <span className="tag alert"><Icon name="alert" size={12} />{p.alerts.map((a) => L(a)).join(' · ')}</span> : <span className="muted">—</span>),
    },
    { key: 'notes', label: t('common.notes'), render: (p) => <span className="muted">{(p.notes || []).map((n) => L(n)).filter((s) => s.trim()).join(' · ') || '—'}</span> },
    { key: 'del', label: t('common.actions'), render: (p) => <button className="iconbtn" onClick={() => setConfirmDel(p)}><Icon name="trash" size={14} title={t('common.delete')} /></button> },
  ];

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="bolt" size={22} />{t('trt.title')}</h1>
        <button className="btn" onClick={() => setEdit('new')}><Icon name="plus" size={15} />{t('trt.add')}</button>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <div className="muted" style={{ marginBottom: '.5em' }}>{t('tbl.dblEdit')}</div>
        <DataTable columns={cols} rows={procedures} pageSize={7} onRowDoubleClick={(p) => setEdit(p)} />
      </div>
      {edit && <ProcedureEditPopup close={() => setEdit(null)} procedure={edit === 'new' ? null : edit} />}
      {confirmDel && (
        <AdminPassConfirm close={() => setConfirmDel(null)} title={t('trt.confirmDelete')} subject={L(confirmDel.name)}
          onConfirm={() => removeProcedure(confirmDel.id)} />
      )}
    </div>
  );
}
