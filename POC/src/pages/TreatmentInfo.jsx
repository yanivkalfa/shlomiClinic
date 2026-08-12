import React from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, BackButton } from '../components/common.jsx';
import { CompareView } from '../components/compare.jsx';
import { UserQuickInfo } from '../components/templates.jsx';

export default function TreatmentInfo() {
  const { t, L, fmtDate } = useLang();
  const { nav, goBack, treatmentById, visitById, userById, procById, prodsOfTreatment, productById } = useStore();

  const tr = treatmentById(nav.params.treatmentId);
  if (!tr) return <div className="page"><div className="muted">{t('tbl.noData')}</div></div>;
  const visit = visitById(tr.visitId);
  const user = userById(tr.userId);
  const proc = procById(tr.procId);
  const prods = prodsOfTreatment(tr.id);

  return (
    <div className="page">
      <div className="row"><BackButton onClick={goBack} /></div>

      <div className="card" style={{ padding: '.9em 1.1em' }}>
        <UserQuickInfo user={user} />
      </div>

      <div className="spread">
        <h1 className="row"><Icon name="doc" size={22} />{L(proc?.name)}</h1>
        <span className="muted">{visit ? fmtDate(visit.date) : ''}</span>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="box" size={18} />{t('ti.products')}</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t('inv.image')}</th><th>{t('ti.company')}</th><th>{t('ti.product')}</th><th>{t('ti.amountUsed')}</th></tr></thead>
            <tbody>
              {prods.length === 0 ? (
                <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: '1.2em' }}>{t('trt.noProducts')}</td></tr>
              ) : prods.map((tp) => {
                const p = productById(tp.productId);
                if (!p) return null;
                return (
                  <tr key={tp.id}>
                    <td><img src={p.img} width={56} height={42} style={{ borderRadius: 6 }} alt={L(p.name)} /></td>
                    <td>{L(p.company)}</td>
                    <td><b>{L(p.name)}</b></td>
                    <td>{tp.amount} {t(`unit.${tp.unit}`)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <h2 className="row" style={{ marginBottom: '.6em' }}><Icon name="eye" size={18} />{t('cmp.title')}</h2>
        <div className="muted" style={{ marginBottom: '.5em' }}>{t('ti.pickHint')}</div>
        <CompareView before={visit?.photos.before || []} after={visit?.photos.after || []} />
      </div>
    </div>
  );
}
