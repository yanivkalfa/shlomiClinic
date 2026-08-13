import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Modal, ModalHead, Toggle } from '../components/common.jsx';
import { AdminPassConfirm } from '../components/guards.jsx';
import { SMART_PERIODS } from '../data.js';

const KINDS = ['medical', 'inventory', 'procedural', 'custom'];
const KIND_ICON = { medical: 'alert', inventory: 'box', procedural: 'clock', custom: 'bell' };

function AlertEditPopup({ close, rule }) {
  const { t, L } = useLang();
  const { products, procedures, addAlertRule, updateAlertRule, showToast } = useStore();
  const isNew = !rule;
  const [kind, setKind] = useState(rule?.kind || 'medical');
  const [text, setText] = useState(rule ? L(rule.text).trim() : '');
  const [productId, setProductId] = useState(rule?.productId ?? products[0]?.id ?? '');
  const [threshold, setThreshold] = useState(rule?.threshold ?? 3);
  const [procId, setProcId] = useState(rule?.procId ?? procedures[0]?.id ?? '');
  const [period, setPeriod] = useState(rule?.period ?? '#3Months');
  const [err, setErr] = useState(null);

  const save = () => {
    if ((kind === 'medical' || kind === 'custom') && !text.trim()) { setErr(t('an.text')); return; }
    const patch = {
      kind,
      text: kind === 'medical' || kind === 'custom' ? [text, text] : [' ', ' '],
      productId: kind === 'inventory' ? Number(productId) : null,
      threshold: kind === 'inventory' ? parseInt(threshold, 10) || 0 : null,
      procId: kind === 'procedural' ? Number(procId) : null,
      period: kind === 'procedural' ? period : null,
      active: rule?.active ?? true,
      fromForms: rule?.fromForms ?? false,
    };
    if (isNew) addAlertRule(patch); else updateAlertRule(rule.id, patch);
    showToast(t('common.save'));
    close();
  };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={isNew ? t('an.add') : t('common.edit')} icon="bell" onClose={close} />
      <div>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('an.kind')}</div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <span key={k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => { setKind(k); setErr(null); }}>
              <Icon name={KIND_ICON[k]} size={13} />{t(`an.${k}`)}
            </span>
          ))}
        </div>
      </div>

      {kind === 'inventory' && (
        <>
          <label>{t('ord.product')}
            <select value={productId} onChange={(e) => setProductId(Number(e.target.value))} style={{ width: '100%' }}>
              {products.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
            </select>
          </label>
          <label className="row">{t('an.threshold')}
            <input type="number" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} style={{ width: '6em' }} />
          </label>
        </>
      )}

      {kind === 'procedural' && (
        <>
          <label>{t('an.procedure')}
            <select value={procId} onChange={(e) => setProcId(Number(e.target.value))} style={{ width: '100%' }}>
              {procedures.map((p) => <option key={p.id} value={p.id}>{L(p.name)}</option>)}
            </select>
          </label>
          <label>{t('an.renewEvery')}
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: '100%' }}>
              {SMART_PERIODS.map((p) => <option key={p} value={p}>{t(`period.${p}`)} · {p}</option>)}
            </select>
          </label>
        </>
      )}

      {(kind === 'medical' || kind === 'custom') && (
        <label>{t('an.text')}
          <input value={text} onChange={(e) => { setText(e.target.value); setErr(null); }} style={{ width: '100%' }} />
        </label>
      )}

      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export default function AlertsNotifications() {
  const { t, L, fmtNum } = useLang();
  const { alertRules, productById, procById, countOfProduct, updateAlertRule, removeAlertRule } = useStore();
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const describe = (r) => {
    if (r.kind === 'inventory') {
      const p = productById(r.productId);
      return t('an.invRule', { product: p ? L(p.name) : '—', n: fmtNum(r.threshold) });
    }
    if (r.kind === 'procedural') {
      const p = procById(r.procId);
      return t('an.procRule', { procedure: p ? L(p.name) : '—', period: t(`period.${r.period}`) });
    }
    return L(r.text);
  };
  const tripped = (r) => r.kind === 'inventory' && r.active && countOfProduct(r.productId) < r.threshold;

  const cols = [
    {
      key: 'kind', label: t('an.kind'), sortVal: (r) => r.kind,
      render: (r) => <span className="row"><Icon name={KIND_ICON[r.kind]} size={15} />{t(`an.${r.kind}`)}</span>,
    },
    {
      key: 'rule', label: t('an.rule'), sortVal: (r) => r.kind,
      render: (r) => (
        <span>
          <b>{describe(r)}</b>
          {r.fromForms && <><br /><span className="muted" style={{ fontSize: '.85em' }}>{t('an.fromForms')}</span></>}
        </span>
      ),
    },
    {
      key: 'state', label: t('common.status'),
      render: (r) => (tripped(r)
        ? <span className="tag alert"><Icon name="alert" size={12} />{fmtNum(countOfProduct(r.productId))}</span>
        : <span className="muted">—</span>),
    },
    {
      key: 'active', label: t('an.active'),
      render: (r) => <Toggle on={r.active} onChange={(v) => updateAlertRule(r.id, { active: v })} />,
    },
    {
      key: 'actions', label: t('common.actions'),
      render: (r) => (
        <span className="row">
          <button className="iconbtn" onClick={() => setEdit(r)}><Icon name="edit" size={14} title={t('common.edit')} /></button>
          <button className="iconbtn" onClick={() => setConfirmDel(r)}><Icon name="trash" size={14} title={t('common.delete')} /></button>
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="bell" size={22} />{t('an.title')}</h1>
        <button className="btn" onClick={() => setEdit('new')}><Icon name="plus" size={15} />{t('an.add')}</button>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <div className="muted" style={{ marginBottom: '.5em' }}>{t('fb.alertHint')}</div>
        <DataTable columns={cols} rows={alertRules} pageSize={8} onRowDoubleClick={(r) => setEdit(r)} />
      </div>
      {edit && <AlertEditPopup close={() => setEdit(null)} rule={edit === 'new' ? null : edit} />}
      {confirmDel && (
        <AdminPassConfirm close={() => setConfirmDel(null)} title={t('an.confirmDelete')} subject={describe(confirmDel)}
          onConfirm={() => removeAlertRule(confirmDel.id)} />
      )}
    </div>
  );
}
