import React, { useState, useRef, useMemo } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, Modal, ModalHead, PanZoomImg, PayStatusTag } from './common.jsx';
import { UserQuickInfo, QuickUserAccess } from './templates.jsx';
import { genFace, ymd, now, PROCEDURES } from '../data.js';

// ---------- Profile photo popup: Take / Upload / Edit ----------
export function PhotoPopup({ close, userId, onDone }) {
  const { t } = useLang();
  const { userById, updateUser } = useStore();
  const user = userById(userId);
  const [photo, setPhoto] = useState(user?.photo || null);
  const [tab, setTab] = useState('take');
  const [shot, setShot] = useState(null);
  const [pz, setPz] = useState({ x: 0, y: 0, scale: 1 });
  const stageRef = useRef(null);
  const fileRef = useRef(null);

  const commit = (img) => {
    if (userId) updateUser(userId, { photo: img });
    if (onDone) onDone(img);
    close();
  };

  const capture = () => setShot(genFace({ hue: 20 + Math.floor(Math.random() * 20), lips: .5, flaw: .4, variant: Math.floor(Math.random() * 40) }));

  const applyCrop = () => {
    const stage = stageRef.current;
    const img = stage?.querySelector('img');
    if (!img) return;
    const sRect = stage.getBoundingClientRect(), iRect = img.getBoundingClientRect();
    const size = Math.min(sRect.width, sRect.height) * 0.68; // matches .cropframe
    const cx = sRect.left + sRect.width / 2 - size / 2, cy = sRect.top + sRect.height / 2 - size / 2;
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const scale = iRect.width / img.naturalWidth;
    const el = new Image();
    el.onload = () => {
      ctx.drawImage(el, (cx - iRect.left) / scale, (cy - iRect.top) / scale, size / scale, size / scale, 0, 0, 300, 300);
      commit(canvas.toDataURL('image/png'));
    };
    el.src = photo;
  };

  const tabs = [['take', t('pp.take')], ['upload', t('pp.upload')], ...(photo ? [['edit', t('pp.edit')]] : [])];

  return (
    <Modal onClose={close}>
      <ModalHead title={t('pp.title')} icon="camera" onClose={close} />
      <div className="tabs">
        {tabs.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
      </div>

      {tab === 'take' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8em' }}>
          <div className="viewfinder">
            {shot ? <img src={shot} alt="" style={{ height: '100%' }} /> : <div className="frame-mark" />}
          </div>
          <div className="muted row"><Icon name="camera" size={14} />{t('pp.cameraNote')}</div>
          <div className="row">
            <button className="btn" onClick={capture}><Icon name="camera" size={15} />{t('pp.capture')}</button>
            {shot && <button className="btn ghost" onClick={() => commit(shot)}><Icon name="check" size={15} />{t('pp.use')}</button>}
          </div>
        </div>
      )}

      {tab === 'upload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8em' }}>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => { setPhoto(r.result); setTab('edit'); setPz({ x: 0, y: 0, scale: 1 }); };
              r.readAsDataURL(f);
            }} />
          <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="plus" size={15} />{t('pp.choose')}</button>
        </div>
      )}

      {tab === 'edit' && photo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.8em' }}>
          <div className="cropstage" ref={stageRef}>
            <PanZoomImg src={photo} state={pz} setState={setPz} style={{ maxWidth: '100%', insetInlineStart: 0, top: 0 }} />
            <div className="cropframe" />
          </div>
          <div className="muted">{t('pp.editHint')}</div>
          <button className="btn" onClick={applyCrop}><Icon name="check" size={15} />{t('pp.apply')}</button>
        </div>
      )}
    </Modal>
  );
}

// ---------- Quick payment charge ----------
export function QuickPaymentPopup({ close, userId, treatmentId }) {
  const { t, L, fmtMoney, fmtDate } = useLang();
  const { userById, pendingTreatmentsOfUser, leftOfTreatment, procById, visitById, addPayment, showToast } = useStore();
  const [uid, setUid] = useState(userId || null);
  const [selTreat, setSelTreat] = useState(treatmentId || null);
  const [date, setDate] = useState(ymd(now()));
  const [method, setMethod] = useState('credit');
  const [sum, setSum] = useState('');
  const [receipt, setReceipt] = useState(false);
  const [err, setErr] = useState(null);

  const user = uid ? userById(uid) : null;
  const pending = user ? pendingTreatmentsOfUser(user.id) : [];
  const sel = pending.find((x) => x.id === selTreat) || null;
  const maxSum = sel ? leftOfTreatment(sel) : 0;
  const num = Math.min(parseFloat(sum) || 0, maxSum);
  const METHODS = ['credit', 'cash', 'bit', 'paybox', 'bank', 'wallet'];
  const M_ICON = { credit: 'card', cash: 'cash', bit: 'phone', paybox: 'phone', bank: 'coins', wallet: 'wallet' };

  const charge = () => {
    if (!sel) { setErr(t('qp.select')); return; }
    if (num <= 0) return;
    addPayment({ treatmentId: sel.id, date, type: method, amount: num, status: 'paid' });
    showToast(receipt ? `${t('qp.charged')} · ${t('qp.receiptPrinted')}` : t('qp.charged'));
    close();
  };

  return (
    <Modal onClose={close}>
      <ModalHead title={t('qp.title')} icon="bolt" onClose={close} />
      <div>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('qp.payer')}</div>
        {user ? <UserQuickInfo user={user} /> : <QuickUserAccess onFound={(u) => setUid(u.id)} />}
      </div>

      {user && (
        <>
          <div>
            <div className="muted" style={{ marginBottom: '.4em' }}>{t('qp.pendingList')}</div>
            {pending.length === 0 ? <div className="muted">{t('qp.none')}</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.45em' }}>
                {pending.map((tr) => {
                  const visit = visitById(tr.visitId), proc = procById(tr.procId);
                  return (
                    <button key={tr.id} className={`chip ${selTreat === tr.id ? 'on' : ''}`} style={{ justifyContent: 'space-between', padding: '.55em .9em' }}
                      onClick={() => { setSelTreat(tr.id); setErr(null); }}>
                      <span>{visit ? fmtDate(visit.date) : ''} · {proc ? L(proc.name) : ''}</span>
                      <b>{t('qp.leftToPay')}: {fmtMoney(leftOfTreatment(tr))}</b>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="row" style={{ flexWrap: 'wrap' }}>
            <label className="row">{t('common.date')}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          </div>
          <div>
            <div className="muted" style={{ marginBottom: '.4em' }}>{t('qp.method')}</div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {METHODS.map((m) => (
                <label key={m} className={`chip ${method === m ? 'on' : ''}`}>
                  <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} style={{ display: 'none' }} />
                  <Icon name={M_ICON[m]} size={13} />{t(`payType.${m}`)}
                </label>
              ))}
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <label className="row">{t('common.sum')}
              <input type="number" min="0" max={maxSum} value={sum} style={{ width: '7em' }}
                onChange={(e) => setSum(e.target.value)} />
            </label>
            {sel && <span className="muted">{t('qp.max', { sum: fmtMoney(maxSum) })}</span>}
            {sel && num > 0 && <span className="tag partial">{t('qp.after', { sum: fmtMoney(maxSum - num) })}</span>}
          </div>
          <label className="row"><input type="checkbox" checked={receipt} onChange={(e) => setReceipt(e.target.checked)} /><Icon name="print" size={15} />{t('qp.receipt')}</label>
          {err && <div className="err">{err}</div>}
          <button className="btn" onClick={charge}><Icon name="dollar" size={15} />{t('qp.charge')}</button>
        </>
      )}
    </Modal>
  );
}

// ---------- Rewards creation (embedded in RewardPopup + Launch Campaign) ----------
export function RewardsCreation({ onCreate, createLabel }) {
  const { t, L } = useLang();
  const [desc, setDesc] = useState('');
  const [dateInit, setDateInit] = useState(ymd(now()));
  const [dateEnd, setDateEnd] = useState('');
  const [restrictions, setRestrictions] = useState([]);
  const [conds, setConds] = useState([{ condition: 'birthday', term: 'eq', value: '#CurrentMonth' }]);
  const [vPercent, setVPercent] = useState('');
  const [vCash, setVCash] = useState('');
  const [vPoints, setVPoints] = useState('');
  const [err, setErr] = useState(null);

  const CONDS = ['birthday', 'visits', 'treatments', 'money', 'wallet', 'referrals', 'membership', 'frequency', 'coupon'];
  const TERMS = ['eq', 'gt', 'lt', 'not'];

  const toggleR = (id) => setRestrictions((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const create = () => {
    if (!desc.trim()) { setErr(t('rc.descRequired')); return; }
    onCreate({
      desc, dateInit, dateEnd: dateEnd || null, restrictions,
      conditions: conds, percent: parseFloat(vPercent) || 0, cash: parseFloat(vCash) || 0, points: parseFloat(vPoints) || 0,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.9em' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '.3em' }}>
        <span className="muted">{t('rc.desc')}</span>
        <input value={desc} onChange={(e) => { setDesc(e.target.value); setErr(null); }} />
      </label>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <span className="muted">{t('rc.dates')}:</span>
        <label className="row">{t('rc.init')}<input type="date" value={dateInit} onChange={(e) => setDateInit(e.target.value)} /></label>
        <label className="row">{t('rc.end')}<input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} /></label>
      </div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <label className="row">{t('rc.vPercent')}<input type="number" style={{ width: '5em' }} value={vPercent} onChange={(e) => setVPercent(e.target.value)} /></label>
        <label className="row">{t('rc.vCash')}<input type="number" style={{ width: '6em' }} value={vCash} onChange={(e) => setVCash(e.target.value)} /></label>
        <label className="row">{t('rc.vPoints')}<input type="number" style={{ width: '5em' }} value={vPoints} onChange={(e) => setVPoints(e.target.value)} /></label>
      </div>

      <div>
        <div className="spread" style={{ marginBottom: '.4em' }}>
          <span className="muted">{t('rc.restrictions')}</span>
          <span className="row">
            <button className="btn ghost sm" onClick={() => setRestrictions([])}>{t('rc.clear')}</button>
            <button className="btn ghost sm" onClick={() => setRestrictions(PROCEDURES.map((p) => p.id))}>{t('rc.chooseAll')}</button>
          </span>
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {PROCEDURES.map((p) => (
            <span key={p.id} className={`chip ${restrictions.includes(p.id) ? 'on' : ''}`} onClick={() => toggleR(p.id)}>{L(p.name)}</span>
          ))}
        </div>
      </div>

      <div>
        <div className="spread" style={{ marginBottom: '.4em' }}>
          <span className="muted">{t('rc.conditions')}</span>
          <button className="btn ghost sm" onClick={() => setConds((c) => [...c, { condition: 'visits', term: 'gt', value: '' }])}>{t('rc.addCond')}</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
          {conds.map((c, i) => (
            <div key={i} className="row" style={{ flexWrap: 'wrap' }}>
              <select value={c.condition} onChange={(e) => setConds((cs) => cs.map((x, j) => (j === i ? { ...x, condition: e.target.value } : x)))}>
                {CONDS.map((k) => <option key={k} value={k}>{t(`rc.c.${k}`)}</option>)}
              </select>
              <select value={c.term} onChange={(e) => setConds((cs) => cs.map((x, j) => (j === i ? { ...x, term: e.target.value } : x)))}>
                {TERMS.map((k) => <option key={k} value={k}>{t(`rc.term.${k}`)}</option>)}
              </select>
              <input placeholder={t('rc.value')} value={c.value} style={{ width: '9em' }}
                onChange={(e) => setConds((cs) => cs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <button className="iconbtn" onClick={() => setConds((cs) => cs.filter((_, j) => j !== i))}><Icon name="x" size={13} title={t('common.delete')} /></button>
            </div>
          ))}
        </div>
        <div className="muted" style={{ marginTop: '.4em' }}>{t('rc.smart')}</div>
      </div>

      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={create}><Icon name="gift" size={15} />{createLabel || t('rc.create')}</button>
    </div>
  );
}

// ---------- Reward popup (grant to a user) ----------
export function RewardPopup({ close, userId }) {
  const { t } = useLang();
  const { userById, addReward, showToast } = useStore();
  const [uid, setUid] = useState(userId || null);
  const user = uid ? userById(uid) : null;

  return (
    <Modal onClose={close}>
      <ModalHead title={t('rw.title')} icon="gift" onClose={close} />
      <div>
        <div className="muted" style={{ marginBottom: '.4em' }}>{t('rw.title')}</div>
        {user ? <UserQuickInfo user={user} /> : <QuickUserAccess onFound={(u) => setUid(u.id)} />}
      </div>
      {user && (
        <RewardsCreation onCreate={(r) => {
          addReward({ userId: user.id, defId: null, desc: [r.desc, r.desc], status: 'active', dateInit: r.dateInit, dateEnd: r.dateEnd, restrictions: r.restrictions, actual: null, percent: r.percent, cash: r.cash, points: r.points });
          showToast(t('rw.granted'));
          close();
        }} />
      )}
    </Modal>
  );
}

// ---------- Add new user ----------
export function AddUserPopup({ close }) {
  const { t } = useLang();
  const { addUser, navigate, showToast } = useStore();
  const [f, setF] = useState({ natId: '', first: '', last: '', birth: '', phone: '', email: '', alerts: '', notes: '' });
  const [photo, setPhoto] = useState(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const create = () => {
    if (!f.natId.trim() || !f.first.trim() || !f.last.trim()) { setErr(t('au.required')); return; }
    const id = addUser({
      natId: f.natId, first: [f.first, f.first], last: [f.last, f.last], birth: f.birth || '2000-01-01',
      phone: f.phone, email: f.email, address: [' ', ' '], wallet: 0, memberSince: ymd(now()),
      photo: photo || genFace({ hue: 30, lips: .4, flaw: .3, variant: Math.floor(Math.random() * 40) }),
      referredBy: null, social: { instagram: false, facebook: false, tiktok: false, whatsapp: false },
      alerts: f.alerts.trim() ? [[f.alerts, f.alerts]] : [], notes: f.notes.trim() ? [[f.notes, f.notes]] : [],
    });
    showToast(t('au.title'));
    close();
    navigate('user', { userId: id });
  };

  return (
    <Modal onClose={close}>
      <ModalHead title={t('au.title')} icon="users" onClose={close} />
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {photo && <img className="avatar" src={photo} width={54} height={54} alt="" />}
        <button className="btn ghost sm" onClick={() => setShowPhoto(true)}><Icon name="camera" size={14} />{t('pp.title')}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6em' }}>
        <label>{t('common.id')}<input value={f.natId} onChange={set('natId')} style={{ width: '100%' }} /></label>
        <label>{t('au.birth')}<input type="date" value={f.birth} onChange={set('birth')} style={{ width: '100%' }} /></label>
        <label>{t('au.first')}<input value={f.first} onChange={set('first')} style={{ width: '100%' }} /></label>
        <label>{t('au.last')}<input value={f.last} onChange={set('last')} style={{ width: '100%' }} /></label>
        <label>{t('common.phone')}<input value={f.phone} onChange={set('phone')} style={{ width: '100%' }} /></label>
        <label>{t('common.email')}<input value={f.email} onChange={set('email')} style={{ width: '100%' }} /></label>
        <label>{t('au.medAlerts')}<input value={f.alerts} onChange={set('alerts')} style={{ width: '100%' }} /></label>
        <label>{t('common.notes')}<input value={f.notes} onChange={set('notes')} style={{ width: '100%' }} /></label>
      </div>
      {err && <div className="err">{err}</div>}
      <button className="btn" onClick={create}><Icon name="plus" size={15} />{t('au.create')}</button>
      {showPhoto && <PhotoPopup close={() => setShowPhoto(false)} userId={null} onDone={(img) => setPhoto(img)} />}
    </Modal>
  );
}

// ---------- small popups ----------
export function NotePopup({ close }) {
  const { t } = useLang();
  const { addNote, showToast } = useStore();
  const [text, setText] = useState('');
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('np.title')} icon="note" onClose={close} />
      <textarea rows={4} placeholder={t('np.placeholder')} value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn" onClick={() => { if (text.trim()) { addNote([text, text]); showToast(t('np.add')); close(); } }}>
        <Icon name="plus" size={15} />{t('np.add')}
      </button>
    </Modal>
  );
}

export function EditNotesPopup({ close, userId }) {
  const { t, L } = useLang();
  const { userById, updateUser } = useStore();
  const user = userById(userId);
  const [text, setText] = useState(user?.notes.map((n) => L(n)).join('\n') || '');
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('hdr.editNotes')} icon="note" onClose={close} />
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('np.placeholder')} />
      <button className="btn" onClick={() => {
        updateUser(userId, { notes: text.split('\n').filter((s) => s.trim()).map((s) => [s, s]) });
        close();
      }}><Icon name="check" size={15} />{t('common.save')}</button>
    </Modal>
  );
}

export function UserPickerPopup({ close, matches, onPick }) {
  const { t, L } = useLang();
  const { userById } = useStore();
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('qa.multiple')} icon="users" onClose={close} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
        {matches.map((id) => {
          const u = userById(id);
          if (!u) return null;
          return (
            <button key={id} className="chip" style={{ padding: '.5em .8em', justifyContent: 'flex-start' }}
              onClick={() => { onPick(u); close(); }}>
              <img className="avatar" src={u.photo} width={30} height={30} alt="" />
              <b>{L(u.first)} {L(u.last)}</b>
              <span className="muted">{u.phone}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

export function LightboxPopup({ close, src, name }) {
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={name || ''} icon="camera" onClose={close} />
      <img src={src} alt={name || ''} style={{ width: '100%', borderRadius: 'var(--radius)' }} />
    </Modal>
  );
}

export function ConsentDocsPopup({ close, visitId }) {
  const { t, L, fmtDate } = useLang();
  const { visitById, forms } = useStore();
  const visit = visitById(visitId);
  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={t('cp.title')} icon="doc" onClose={close} />
      {[t('cp.consent'), t('cp.health')].map((label, i) => (
        <div key={i} className="card spread" style={{ padding: '.8em' }}>
          <span className="row"><Icon name="doc" size={16} />{label}</span>
          <span className="muted">{visit ? t('cp.signedOn', { date: fmtDate(visit.date) }) : ''}</span>
          <Icon name="check" size={16} />
        </div>
      ))}
      <div className="muted">{forms.map((f) => L(f.name)).join(' · ')}</div>
    </Modal>
  );
}
