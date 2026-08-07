import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon } from './common.jsx';
import { ageOf } from '../data.js';

// T. User quick info template — small photo | full name | wallet points
export function UserQuickInfo({ user }) {
  const { t, L, fmtNum } = useLang();
  if (!user) return null;
  return (
    <div className="row">
      <img className="avatar" src={user.photo} width={38} height={38} alt={`${L(user.first)} ${L(user.last)}`} />
      <b>{L(user.first)} {L(user.last)}</b>
      <span className="tag partial"><Icon name="wallet" size={13} />{fmtNum(user.wallet)} {t('common.points')}</span>
    </div>
  );
}

// P. Quick user access — search by name / phone / ID; embeddable anywhere
export function QuickUserAccess({ onFound, compact = false }) {
  const { t, L } = useLang();
  const { users, navigate, openPopup } = useStore();
  const [q, setQ] = useState('');
  const [state, setState] = useState(null); // 'none' | {matches}

  const go = () => {
    const s = q.trim().toLowerCase();
    if (!s) return;
    const matches = users.filter((u) => {
      const names = `${u.first[0]} ${u.last[0]} ${u.first[1]} ${u.last[1]}`.toLowerCase();
      return names.includes(s) || u.phone.replace(/-/g, '').includes(s.replace(/-/g, '')) || u.natId.includes(s);
    });
    if (matches.length === 0) setState('none');
    else if (matches.length === 1) { setState(null); setQ(''); pick(matches[0]); }
    else { setState(null); openPopup('userPicker', { matches: matches.map((m) => m.id), onPick: pick }); }
  };

  const pick = (u) => { if (onFound) onFound(u); else navigate('user', { userId: u.id }); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
      <div className="row">
        <input style={{ flex: 1, width: compact ? '6em' : undefined }} placeholder={t('qa.placeholder')} value={q}
          onChange={(e) => { setQ(e.target.value); setState(null); }} onKeyDown={(e) => e.key === 'Enter' && go()} />
        <button className="btn sm" onClick={go}><Icon name="search" size={14} />{t('qa.go')}</button>
      </div>
      {state === 'none' && <div className="err row"><Icon name="alert" size={14} />{t('qa.noMatch')}</div>}
    </div>
  );
}

const SOCIALS = ['instagram', 'facebook', 'tiktok', 'whatsapp'];

// T. User full size header
export function UserFullHeader({ user }) {
  const { t, L, fmtDate, fmtMoney, fmtNum } = useLang();
  const { settings, openPopup, doneVisitsOfUser, userTotalSpent, userLastVisit, treatments } = useStore();
  const [showNotes, setShowNotes] = useState(false);
  if (!user) return null;

  const fullName = `${L(user.first)} ${L(user.last)}`;
  const procCount = treatments.filter((tr) => tr.userId === user.id).length;
  const last = userLastVisit(user.id);

  return (
    <div className="card uheader">
      <div className="pic">
        <img className="avatar" src={user.photo} width={126} height={126} alt={fullName} style={{ cursor: 'pointer' }}
          onClick={() => (user.photo ? openPopup('lightbox', { src: user.photo, name: fullName }) : openPopup('photo', { userId: user.id }))} />
        <button className="iconbtn editfab" onClick={() => openPopup('photo', { userId: user.id })}>
          <Icon name="edit" size={14} title={t('pp.title')} />
        </button>
      </div>
      <div className="details">
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <h2>{fullName}</h2>
          <span className="muted">{t('common.age')}: {ageOf(user.birth)}</span>
          <span className="muted">{t('common.id')}: {user.natId}</span>
          <span className="tag partial"><Icon name="wallet" size={13} />{fmtNum(user.wallet)} {t('hdr.walletPoints')}</span>
          {user.alerts.length > 0 && <span className="tag alert"><Icon name="alert" size={13} />{t('common.alerts')}</span>}
          {user.notes.length > 0 && <span className="tag pending"><Icon name="note" size={13} />{t('common.notes')}</span>}
        </div>
        <div className="row muted"><Icon name="phone" size={14} />{user.phone}<Icon name="mail" size={14} />{user.email}</div>
        <div className="row muted"><Icon name="pin" size={14} />{L(user.address)}</div>
        <div style={{ height: '.4em' }} />
        <div className="socials">
          {SOCIALS.map((s) => (
            <span key={s} className={`soc ${user.social[s] ? '' : 'off'}`}
              title={user.social[s] ? t('hdr.following') : t('hdr.notFollowing')}>
              <Icon name={s} size={14} />
              <span className={`st ${user.social[s] ? 'y' : 'n'}`}>{user.social[s] ? '✓' : '✗'}</span>
            </span>
          ))}
        </div>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn ghost sm" onClick={() => setShowNotes(!showNotes)}>
            <Icon name="note" size={14} />{showNotes ? t('hdr.hideNotes') : t('hdr.showNotes')}
          </button>
          <button className="btn ghost sm" onClick={() => openPopup('editNotes', { userId: user.id })}>
            <Icon name="edit" size={14} />{t('hdr.editNotes')}
          </button>
        </div>
        {showNotes && (
          <div className="card" style={{ padding: '.7em', boxShadow: 'none' }}>
            {user.notes.length === 0 ? <span className="muted">{t('tbl.noData')}</span>
              : user.notes.map((n, i) => <div key={i} className="row"><Icon name="note" size={13} /><span>{L(n)}</span></div>)}
          </div>
        )}
        {user.alerts.length > 0 && (
          <div className="appt-alert"><Icon name="alert" size={14} />{user.alerts.map((a) => L(a)).join(' · ')}</div>
        )}
        {settings.optMemberLine && (
          <div className="muted">
            {t('hdr.memberSince', {
              date: fmtDate(user.memberSince), n: procCount, sum: fmtMoney(userTotalSpent(user.id)),
              last: last ? fmtDate(last.date) : t('home.firstVisit'),
            })}
          </div>
        )}
      </div>
    </div>
  );
}
