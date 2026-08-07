import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Modal, ModalHead } from '../components/common.jsx';
import { ymd, today } from '../data.js';

function OrderEditPopup({ close, order }) {
  const { t, L } = useLang();
  const { products, addOrder, updateOrder, showToast } = useStore();
  const isNew = !order;
  const [f, setF] = useState({
    productId: order?.productId || products[0]?.id, date: order?.date || ymd(today()),
    seller: order ? L(order.seller) : '', batch: order?.batch ?? 1, cost: order?.cost ?? 0, notes: order ? L(order.notes) : '',
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = () => {
    const patch = { productId: Number(f.productId), date: f.date, seller: [f.seller, f.seller], batch: parseInt(f.batch, 10) || 0, cost: parseFloat(f.cost) || 0, notes: [f.notes, f.notes] };
    if (isNew) addOrder(patch); else updateOrder(order.id, patch);
    showToast(t('common.save'));
    close();
  };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={isNew ? t('ord.add') : t('common.edit')} icon="truck" onClose={close} />
      <label>{t('ord.product')}
        <select value={f.productId} onChange={set('productId')} style={{ width: '100%' }}>
          {products.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
        </select>
      </label>
      <div className="row">
        <label>{t('common.date')}<input type="date" value={f.date} onChange={set('date')} /></label>
        <label>{t('ord.batch')}<input type="number" value={f.batch} onChange={set('batch')} style={{ width: '5em' }} /></label>
      </div>
      <label>{t('ord.seller')}<input value={f.seller} onChange={set('seller')} style={{ width: '100%' }} /></label>
      <label>{t('common.cost')}<input type="number" value={f.cost} onChange={set('cost')} style={{ width: '100%' }} /></label>
      <label>{t('common.notes')}<input value={f.notes} onChange={set('notes')} style={{ width: '100%' }} /></label>
      <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export default function Orders() {
  const { t, L, fmtDate, fmtMoney, fmtNum } = useLang();
  const { orders, productById, removeOrder } = useStore();
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const cols = [
    { key: 'product', label: t('ord.product'), sortVal: (o) => L(productById(o.productId)?.name) || '', render: (o) => { const p = productById(o.productId); return p ? <span className="row"><img src={p.img} width={44} height={33} style={{ borderRadius: 6 }} alt="" /><b>{L(p.name)}</b></span> : '—'; } },
    { key: 'date', label: t('common.date'), sortVal: (o) => o.date, render: (o) => fmtDate(o.date) },
    { key: 'seller', label: t('ord.seller'), sortVal: (o) => L(o.seller), render: (o) => L(o.seller) },
    { key: 'batch', label: t('ord.batch'), sortVal: (o) => o.batch, render: (o) => fmtNum(o.batch) },
    { key: 'cost', label: t('common.cost'), sortVal: (o) => o.cost, render: (o) => <b>{fmtMoney(o.cost)}</b> },
    { key: 'notes', label: t('common.notes'), render: (o) => <span className="muted">{L(o.notes)}</span> },
    { key: 'del', label: t('common.actions'), render: (o) => <button className="iconbtn" onClick={() => setConfirmDel(o)}><Icon name="trash" size={14} title={t('common.delete')} /></button> },
  ];

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="truck" size={22} />{t('ord.title')}</h1>
        <button className="btn" onClick={() => setEdit('new')}><Icon name="plus" size={15} />{t('ord.add')}</button>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <div className="muted" style={{ marginBottom: '.5em' }}>{t('tbl.dblEdit')}</div>
        <DataTable columns={cols} rows={orders} pageSize={8} onRowDoubleClick={(o) => setEdit(o)} />
      </div>
      {edit && <OrderEditPopup close={() => setEdit(null)} order={edit === 'new' ? null : edit} />}
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} className="narrow">
          <ModalHead title={t('ord.confirmDelete')} icon="trash" onClose={() => setConfirmDel(null)} />
          <div className="row">
            <button className="btn danger" onClick={() => { removeOrder(confirmDel.id); setConfirmDel(null); }}><Icon name="trash" size={14} />{t('common.yes')}</button>
            <button className="btn ghost" onClick={() => setConfirmDel(null)}>{t('common.no')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
