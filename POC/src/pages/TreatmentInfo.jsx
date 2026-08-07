import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, PanZoomImg } from '../components/common.jsx';
import { UserQuickInfo } from '../components/templates.jsx';

function CompareCell({ label, src }) {
  const { t } = useLang();
  const [pz, setPz] = useState({ x: 0, y: 0, scale: 1 });
  return (
    <div className="cmp-cell">
      <span className="cmp-label tag partial">{label}</span>
      {src ? (
        <PanZoomImg src={src} state={pz} setState={setPz} style={{ maxWidth: '100%' }} />
      ) : (
        <span className="muted" style={{ padding: '1em', textAlign: 'center' }}>{t('ti.pickHint')}</span>
      )}
    </div>
  );
}

export default function TreatmentInfo() {
  const { t, L, fmtDate } = useLang();
  const { nav, treatmentById, visitById, userById, procById, prodsOfTreatment, productById } = useStore();
  const [layout, setLayout] = useState('side');
  const [selBefore, setSelBefore] = useState(0);
  const [selAfter, setSelAfter] = useState(0);

  const tr = treatmentById(nav.params.treatmentId);
  if (!tr) return <div className="page"><div className="muted">{t('tbl.noData')}</div></div>;
  const visit = visitById(tr.visitId);
  const user = userById(tr.userId);
  const proc = procById(tr.procId);
  const prods = prodsOfTreatment(tr.id);
  const before = visit?.photos.before || [], after = visit?.photos.after || [];

  return (
    <div className="page">
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
              {prods.map((tp, i) => {
                const p = productById(tp.productId);
                if (!p) return null;
                return (
                  <tr key={i}>
                    <td><img src={p.img} width={56} height={42} style={{ borderRadius: 6 }} alt={L(p.name)} /></td>
                    <td>{L(p.company)}</td>
                    <td><b>{L(p.name)}</b></td>
                    <td>{L(tp.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <div className="spread" style={{ marginBottom: '.6em' }}>
          <h2 className="row"><Icon name="eye" size={18} />{t('up.before')} / {t('up.after')}</h2>
          <span className="row">
            <span className="muted">{t('ti.zoomHint')}</span>
            <button className="btn ghost sm" onClick={() => setLayout((l) => (l === 'side' ? 'stack' : 'side'))}>
              <Icon name="chart" size={14} />{t('ti.layout')}
            </button>
          </span>
        </div>
        <div className="cmp">
          <div className="cmp-thumbs">
            <span className="muted" style={{ textAlign: 'center' }}>{t('up.before')}</span>
            {before.map((p, i) => (
              <img key={i} src={p} className={selBefore === i ? 'sel' : ''} onClick={() => setSelBefore(i)} alt={`${t('up.before')} ${i + 1}`} />
            ))}
          </div>
          <div className={`cmp-view ${layout}`}>
            <CompareCell label={t('up.before')} src={before[selBefore]} />
            <CompareCell label={t('up.after')} src={after[selAfter]} />
          </div>
          <div className="cmp-thumbs">
            <span className="muted" style={{ textAlign: 'center' }}>{t('up.after')}</span>
            {after.map((p, i) => (
              <img key={i} src={p} className={selAfter === i ? 'sel' : ''} onClick={() => setSelAfter(i)} alt={`${t('up.after')} ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
