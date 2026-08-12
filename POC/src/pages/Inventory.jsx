import React, { useState, useRef } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Modal, ModalHead } from '../components/common.jsx';
import { genProductBox } from '../data.js';

function ProductEditPopup({ close, product, count }) {
  const { t, L } = useLang();
  const { addProduct, updateProduct, showToast } = useStore();
  const isNew = !product;
  const [f, setF] = useState({
    name: product ? L(product.name) : '', company: product ? L(product.company) : '',
    commonUse: product ? L(product.commonUse) : '', packaging: product ? L(product.packaging) : '',
    notes: product ? L(product.notes) : '', count: count ?? 0,
    alerts: product ? (product.alerts || []).map((a) => L(a)).join('\n') : '',
  });
  const [img, setImg] = useState(product?.img || genProductBox(Math.floor(Math.random() * 360)));
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = () => {
    const patch = {
      name: [f.name, f.name], company: [f.company, f.company], commonUse: [f.commonUse, f.commonUse],
      packaging: [f.packaging, f.packaging], notes: [f.notes, f.notes], img,
      alerts: f.alerts.split('\n').filter((s) => s.trim()).map((s) => [s, s]),
    };
    if (isNew) addProduct(patch, parseInt(f.count, 10) || 0);
    else updateProduct(product.id, patch, parseInt(f.count, 10) || 0);
    showToast(t('common.save'));
    close();
  };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={isNew ? t('inv.add') : t('common.edit')} icon="box" onClose={close} />
      <div className="row">
        <img src={img} width={90} height={68} style={{ borderRadius: 8 }} alt="" />
        <button className="btn ghost sm" onClick={() => fileRef.current?.click()}><Icon name="camera" size={14} />{t('pp.upload')}</button>
        <button className="btn ghost sm" onClick={() => setImg(genProductBox(Math.floor(Math.random() * 360)))}><Icon name="edit" size={14} />{t('pp.take')}</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const r = new FileReader(); r.onload = () => setImg(r.result); r.readAsDataURL(file);
        }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6em' }}>
        <label>{t('common.name')}<input value={f.name} onChange={set('name')} style={{ width: '100%' }} /></label>
        <label>{t('inv.company')}<input value={f.company} onChange={set('company')} style={{ width: '100%' }} /></label>
        <label>{t('inv.commonUse')}<input value={f.commonUse} onChange={set('commonUse')} style={{ width: '100%' }} /></label>
        <label>{t('inv.packaging')}<input value={f.packaging} onChange={set('packaging')} style={{ width: '100%' }} /></label>
        <label>{t('common.notes')}<input value={f.notes} onChange={set('notes')} style={{ width: '100%' }} /></label>
        <label>{t('inv.count')}<input type="number" value={f.count} onChange={set('count')} style={{ width: '100%' }} /></label>
      </div>
      <label>{t('common.alerts')}<textarea rows={2} value={f.alerts} onChange={set('alerts')} style={{ width: '100%' }} /></label>
      <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export default function Inventory() {
  const { t, L } = useLang();
  const { products, inventory, removeProduct, trippedInventoryAlerts } = useStore();
  const [edit, setEdit] = useState(null); // {product, count} | 'new'
  const [confirmDel, setConfirmDel] = useState(null);

  const countOf = (pid) => inventory.find((i) => i.productId === pid)?.count ?? 0;

  const cols = [
    { key: 'img', label: t('inv.image'), render: (p) => <img src={p.img} width={62} height={46} style={{ borderRadius: 8, cursor: 'pointer' }} alt={L(p.name)} onClick={() => setEdit({ product: p, count: countOf(p.id) })} /> },
    { key: 'name', label: t('common.name'), sortVal: (p) => L(p.name), render: (p) => <b>{L(p.name)}</b> },
    { key: 'company', label: t('inv.company'), sortVal: (p) => L(p.company), render: (p) => L(p.company) },
    { key: 'use', label: t('inv.commonUse'), render: (p) => <span className="muted">{L(p.commonUse)}</span> },
    { key: 'pack', label: t('inv.packaging'), render: (p) => <span className="muted">{L(p.packaging)}</span> },
    { key: 'notes', label: t('common.notes'), render: (p) => <span className="muted">{L(p.notes)}</span> },
    {
      key: 'count', label: t('inv.count'), sortVal: (p) => countOf(p.id),
      render: (p) => {
        const c = countOf(p.id);
        return <span className={`tag ${c <= 2 ? 'alert' : 'paid'}`}>{c}{c <= 2 ? ` · ${t('inv.low')}` : ''}</span>;
      },
    },
    {
      key: 'alerts', label: t('common.alerts'),
      render: (p) => {
        const rule = trippedInventoryAlerts.find((r) => r.productId === p.id);
        const own = (p.alerts || []).map((a) => L(a)).filter((s) => s.trim());
        if (!rule && own.length === 0) return <span className="muted">—</span>;
        return (
          <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '.25em' }}>
            {rule && <span className="tag alert"><Icon name="alert" size={12} />{t('an.invRule', { product: L(p.name), n: rule.threshold })}</span>}
            {own.map((a, i) => <span key={i} className="tag pending"><Icon name="alert" size={12} />{a}</span>)}
          </span>
        );
      },
    },
    {
      key: 'del', label: t('common.actions'),
      render: (p) => <button className="iconbtn" onClick={() => setConfirmDel(p)}><Icon name="trash" size={14} title={t('common.delete')} /></button>,
    },
  ];

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="box" size={22} />{t('inv.title')}</h1>
        <button className="btn" onClick={() => setEdit('new')}><Icon name="plus" size={15} />{t('inv.add')}</button>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <div className="muted" style={{ marginBottom: '.5em' }}>{t('tbl.dblEdit')}</div>
        <DataTable columns={cols} rows={products} pageSize={7} onRowDoubleClick={(p) => setEdit({ product: p, count: countOf(p.id) })} />
      </div>
      {edit && <ProductEditPopup close={() => setEdit(null)} product={edit === 'new' ? null : edit.product} count={edit === 'new' ? 0 : edit.count} />}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} className="narrow">
          <ModalHead title={t('inv.confirmDelete')} icon="trash" onClose={() => setConfirmDel(null)} />
          <b>{L(confirmDel.name)}</b>
          <div className="row">
            <button className="btn danger" onClick={() => { removeProduct(confirmDel.id); setConfirmDel(null); }}><Icon name="trash" size={14} />{t('common.yes')}</button>
            <button className="btn ghost" onClick={() => setConfirmDel(null)}>{t('common.no')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
