import React, { useState, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Modal, ModalHead, PayStatusTag } from './common.jsx';
import { AdminPassConfirm } from './guards.jsx';
import { downloadSignedDocs } from '../pdf.js';
import { DEFAULT_LOGO, ymd } from '../data.js';

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;

// Reschedule / delete an appointment. Used by the appointments table's edit icon
// and by double-clicking the date on the appointment page.
export function AppointmentEditPopup({ close, visitId, onDeleted }) {
  const { t } = useLang();
  const { visitById, updateVisit, removeVisit, showToast } = useStore();
  const visit = visitById(visitId);
  const [date, setDate] = useState(visit?.date || ymd(new Date()));
  const [start, setStart] = useState(toHHMM(visit?.start ?? 480));
  const [duration, setDuration] = useState((visit?.end ?? 540) - (visit?.start ?? 480));
  const [confirmDel, setConfirmDel] = useState(false);
  if (!visit) return null;

  const save = () => {
    const s = toMin(start);
    updateVisit(visit.id, { date, start: s, end: s + (parseInt(duration, 10) || 30) });
    showToast(t('common.save'));
    close();
  };

  return (
    <>
      <Modal onClose={close} className="narrow">
        <ModalHead title={t('ap.editSchedule')} icon="calendar" onClose={close} />
        <label>{t('common.date')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%' }} /></label>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <label>{t('common.time')}<input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label>{t('cal.duration')} ({t('common.min')})
            <input type="number" min="5" step="5" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '6em' }} />
          </label>
        </div>
        <div className="row">
          <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
          <button className="btn danger" onClick={() => setConfirmDel(true)}><Icon name="trash" size={15} />{t('ap.delete')}</button>
        </div>
      </Modal>
      {confirmDel && (
        <AdminPassConfirm
          close={() => setConfirmDel(false)}
          title={t('ap.delete')}
          onConfirm={() => { removeVisit(visit.id); close(); onDeleted?.(); }}
        />
      )}
    </>
  );
}

// T. Appointments table — every appointment, or just one user's when userId is given.
export function AppointmentsTable({ userId = null, pageSize = 7, showSummary = true }) {
  const { t, L, lang, isRTL, fmtDate, fmtMoney, fmtNum } = useLang();
  const {
    visits, settings, navigate, openPopup, userById, treatmentsOfVisit, prodsOfTreatment,
    productById, procById, visitTotal, visitPayStatus, visitPaid, forms, showToast,
  } = useStore();
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = userId ? visits.filter((v) => v.userId === userId) : visits;
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [visits, userId]);

  const searchFn = (v, s) => {
    const u = userById(v.userId);
    const names = u ? `${u.first[0]} ${u.last[0]} ${u.first[1]} ${u.last[1]}`.toLowerCase() : '';
    const procs = treatmentsOfVisit(v.id).map((tr) => `${procById(tr.procId)?.name[0]} ${procById(tr.procId)?.name[1]}`).join(' ').toLowerCase();
    return names.includes(s) || procs.includes(s) || v.date.includes(s);
  };

  const download = (v) => {
    const u = userById(v.userId);
    if (!u) return;
    downloadSignedDocs({
      forms: forms.map((f) => ({
        name: L(f.name),
        blocks: f.blocks.flatMap((b) => {
          if (b.type === 'rich') return [{ type: 'rich', text: L(b.html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }];
          if (b.type === 'toggle') return [{ type: 'qa', q: L(b.q), a: b.alert ? t('common.yes') : t('common.no'), alert: !!b.alert }];
          if (b.type === 'options') return [{ type: 'qa', q: L(b.q), a: b.options.map((o) => L(o.text)).join(' / '), alert: b.options.some((o) => o.alert) }];
          return [];
        }),
      })),
      user: { name: `${L(u.first)} ${L(u.last)}`, natId: u.natId },
      visit: v,
      procedures: treatmentsOfVisit(v.id).map((tr) => L(procById(tr.procId)?.name)).filter(Boolean),
      logo: settings.clinicLogo || DEFAULT_LOGO,
      isRTL,
      fmtDate,
      strings: {
        clinic: settings.clinicName.trim() || t('app.name'),
        title: t('cp.title'),
        patient: t('common.name'),
        id: t('common.id'),
        date: t('common.date'),
        procedures: t('up.treatments'),
        alert: t('common.alerts'),
        signedOn: t('cp.signedOn', { date: '' }).replace(/\s*$/, '').replace(/:\s*$/, ''),
        signature: t('fb.signHere'),
        fileName: `signed-${u.natId}-${v.date}`,
      },
    });
    showToast(t('at.downloaded'));
  };

  const cols = [
    {
      key: 'pics', label: `${t('up.before')} → ${t('up.after')}`,
      render: (v) => (
        <span className="row">
          {v.photos.before[0] ? <img src={v.photos.before[0]} width={34} height={42} style={{ borderRadius: 6, objectFit: 'cover' }} alt={t('up.before')} /> : <span className="muted">—</span>}
          <Icon name={isRTL ? 'chevL' : 'arrowR'} size={13} />
          {v.photos.after[0] ? <img src={v.photos.after[0]} width={34} height={42} style={{ borderRadius: 6, objectFit: 'cover' }} alt={t('up.after')} /> : <span className="muted">—</span>}
        </span>
      ),
    },
    ...(userId ? [] : [{
      key: 'user', label: t('fin.user'),
      sortVal: (v) => { const u = userById(v.userId); return u ? `${u.first[0]} ${u.last[0]}` : ''; },
      render: (v) => {
        const u = userById(v.userId);
        return u ? (
          <button className="row" onClick={() => navigate('user', { userId: u.id })}>
            <img className="avatar" src={u.photo} width={28} height={28} alt="" />
            <b>{L(u.first)} {L(u.last)}</b>
          </button>
        ) : '—';
      },
    }]),
    { key: 'date', label: t('common.date'), sortVal: (v) => v.date, render: (v) => fmtDate(v.date) },
    {
      key: 'procs', label: t('up.treatments'),
      render: (v) => (
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '.15em' }}>
          {treatmentsOfVisit(v.id).map((tr) => {
            const p = procById(tr.procId);
            return p ? <span key={tr.id} className="row" style={{ gap: '.35em' }}><Icon name={p.icon || 'bolt'} size={13} />{L(p.name)}</span> : null;
          })}
        </span>
      ),
    },
    {
      key: 'prods', label: t('up.products'),
      render: (v) => (
        <span className="muted" style={{ display: 'inline-flex', flexDirection: 'column', gap: '.15em', fontSize: '.9em' }}>
          {treatmentsOfVisit(v.id).map((tr) => (
            <span key={tr.id}>{prodsOfTreatment(tr.id).map((tp) => `${L(productById(tp.productId)?.name)} (${tp.amount} ${t(`unit.${tp.unit}`)})`).filter(Boolean).join(', ') || '—'}</span>
          ))}
        </span>
      ),
    },
    {
      key: 'costs', label: t('up.costs'),
      render: (v) => (
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: '.15em' }}>
          {treatmentsOfVisit(v.id).map((tr) => <span key={tr.id}>{fmtMoney(tr.cost)}</span>)}
        </span>
      ),
    },
    { key: 'total', label: t('common.total'), sortVal: (v) => visitTotal(v.id), render: (v) => <b>{fmtMoney(visitTotal(v.id))}</b> },
    { key: 'status', label: t('up.payStatus'), render: (v) => <PayStatusTag status={visitPayStatus(v.id)} sum={visitPaid(v.id)} fmtMoney={fmtMoney} /> },
    {
      key: 'actions', label: t('common.actions'),
      render: (v) => {
        const firstTr = treatmentsOfVisit(v.id)[0];
        return (
          <span className="row">
            {firstTr && (
              <button className="iconbtn" onClick={() => navigate('treatment', { visitId: v.id })}>
                <Icon name="eye" size={14} title={t('ti.title')} />
              </button>
            )}
            {v.signed
              ? <button className="iconbtn" onClick={() => download(v)}><Icon name="download" size={14} title={t('at.download')} /></button>
              : <span className="iconbtn" style={{ opacity: .35 }} title={t('at.noSigned')}><Icon name="doc" size={14} /></span>}
            <button className="iconbtn" onClick={() => setEdit(v.id)}>
              <Icon name="edit" size={14} title={t('at.editAppointment')} />
            </button>
          </span>
        );
      },
    },
  ];

  const totalSum = rows.reduce((s, v) => s + visitTotal(v.id), 0);

  return (
    <>
      <div className="row" style={{ marginBottom: '.7em' }}>
        <Icon name="search" size={16} />
        <input style={{ flex: 1, maxWidth: '22em' }} placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable
        key={lang}
        columns={cols} rows={rows} pageSize={pageSize}
        searchText={q} searchFn={searchFn}
        footer={showSummary && settings.optVisitSummary ? (
          <div className="muted" style={{ paddingTop: '.6em' }}>
            {t('at.summary', { n: fmtNum(rows.length), sum: fmtMoney(totalSum) })}
          </div>
        ) : null}
      />
      {edit != null && <AppointmentEditPopup close={() => setEdit(null)} visitId={edit} />}
    </>
  );
}
