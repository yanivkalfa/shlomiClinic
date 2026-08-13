import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, BackButton } from '../components/common.jsx';
import { CompareView } from '../components/compare.jsx';
import { AppointmentEditPopup } from '../components/appointments.jsx';
import { UserQuickInfo } from '../components/templates.jsx';
import { UNITS } from '../data.js';

// Products for one procedure — double-click the table to edit amounts in place.
function ProductsTable({ treatmentId }) {
  const { t, L } = useLang();
  const { prodsOfTreatment, productById, updateTreatProd } = useStore();
  const [editing, setEditing] = useState(false);
  const prods = prodsOfTreatment(treatmentId);

  if (prods.length === 0) return <div className="muted" style={{ paddingInlineStart: '1.4em' }}>{t('trt.noProducts')}</div>;

  return (
    <div className="tbl-wrap" onDoubleClick={() => setEditing(true)} title={t('tbl.dblEdit')}>
      <table className="tbl prod-tbl">
        <thead>
          <tr><th>{t('inv.image')}</th><th>{t('ti.company')}</th><th>{t('ti.product')}</th><th>{t('ti.amountUsed')}</th></tr>
        </thead>
        <tbody>
          {prods.map((tp) => {
            const p = productById(tp.productId);
            if (!p) return null;
            return (
              <tr key={tp.id}>
                <td><img src={p.img} alt={L(p.name)} className="prod-thumb" /></td>
                <td>{L(p.company)}</td>
                <td><b>{L(p.name)}</b></td>
                <td>
                  {editing ? (
                    <span className="row">
                      <input type="number" min="0" step="0.5" value={tp.amount} style={{ width: '5em' }}
                        onChange={(e) => updateTreatProd(tp.id, { amount: parseFloat(e.target.value) || 0 })} />
                      <select value={tp.unit} onChange={(e) => updateTreatProd(tp.id, { unit: e.target.value })}>
                        {UNITS.map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
                      </select>
                    </span>
                  ) : `${tp.amount} ${t(`unit.${tp.unit}`)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!editing && <div className="muted" style={{ fontSize: '.82em', paddingTop: '.3em' }}>{t('tbl.dblEdit')}</div>}
    </div>
  );
}

export default function AppointmentInfo() {
  const { t, L, fmtDate } = useLang();
  const { nav, goBack, visitById, treatmentById, userById, procById, treatmentsOfVisit, settings } = useStore();
  const [editDate, setEditDate] = useState(false);

  // reachable either by appointment id, or by a single procedure instance
  const visit = nav.params.visitId != null
    ? visitById(nav.params.visitId)
    : visitById(treatmentById(nav.params.treatmentId)?.visitId);

  if (!visit) return <div className="page"><div className="muted">{t('tbl.noData')}</div></div>;
  const user = userById(visit.userId);
  const trs = treatmentsOfVisit(visit.id);
  const doc = visit.doc;

  return (
    <div className="page">
      <div className="row"><BackButton onClick={goBack} /></div>

      <div className="card spread" style={{ padding: '.9em 1.1em', flexWrap: 'wrap', gap: '.6em' }}>
        <UserQuickInfo user={user} />
        <span className="row" onDoubleClick={() => setEditDate(true)} style={{ cursor: 'pointer' }} title={t('ap.dblHint')}>
          <Icon name="calendar" size={16} />
          <b>{fmtDate(visit.date)}</b>
          <span className="muted" style={{ fontSize: '.85em' }}>{t('ap.dblHint')}</span>
        </span>
      </div>

      <h1 className="row"><Icon name="doc" size={22} />{t('ti.title')}</h1>

      {trs.length === 0 && <div className="card" style={{ padding: '1em' }}><span className="muted">{t('vp.noTreatments')}</span></div>}
      {trs.map((tr) => {
        const proc = procById(tr.procId);
        return (
          <div key={tr.id} className="card" style={{ padding: '1em' }}>
            <h2 className="row" style={{ marginBottom: '.6em' }}>
              <Icon name={proc?.icon || 'bolt'} size={19} />{L(proc?.name)}
            </h2>
            <ProductsTable treatmentId={tr.id} />
          </div>
        );
      })}

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="eye" size={18} />{t('cmp.title')}</h2>
        <div className="muted" style={{ marginBottom: '.5em' }}>{t('ti.pickHint')}</div>
        <CompareView before={visit.photos.before} after={visit.photos.after} visitId={visit.id} />
      </div>

      {settings.showDoc && (
        <div className="card" style={{ padding: '1em' }}>
          <div className="spread" style={{ marginBottom: '.5em', flexWrap: 'wrap' }}>
            <h2 className="row"><Icon name="doc" size={18} />{t('ap.doc')}</h2>
            {doc?.signedAt && <span className="tag paid"><Icon name="check" size={12} />{t('ap.signedAt', { when: doc.signedAt })}</span>}
          </div>
          {doc?.text && L(doc.text)
            ? <div className="richtext" style={{ opacity: .9 }} dangerouslySetInnerHTML={{ __html: L(doc.text) }} />
            : <span className="muted">{t('tbl.noData')}</span>}
        </div>
      )}

      {editDate && <AppointmentEditPopup close={() => setEditDate(false)} visitId={visit.id} onDeleted={goBack} />}
    </div>
  );
}
