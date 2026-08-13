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
  const { t } = useLang();
  const { users, navigate, openPopup } = useStore();
  const [q, setQ] = useState('');
  const [state, setState] = useState(null); // 'none'

  const pick = (u) => { if (onFound) onFound(u); else navigate('user', { userId: u.id }); };

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

// T. User full size header — two columns (photo | details) plus a footer band
export function UserFullHeader({ user }) {
  const { t, L, fmtDate, fmtMoney, fmtNum } = useLang();
  const { settings, openPopup, userTotalSpent, userLastVisit, treatments, updateUser, showToast, userById } = useStore();
  const [showNotes, setShowNotes] = useState(false);
  if (!user) return null;

  const fullName = `${L(user.first)} ${L(user.last)}`;
  const procCount = treatments.filter((tr) => tr.userId === user.id).length;
  const last = userLastVisit(user.id);
  const referrer = user.referredBy ? userById(user.referredBy) : null;
  // photo height is expressed in text lines so it scales with the font setting
  const picSize = `${settings.avatarLines * 3.4}em`;

  const pickReferrer = () => openPopup('pickUser', {
    title: t('hdr.addRef'),
    onPick: (u) => { if (u.id !== user.id) { updateUser(user.id, { referredBy: u.id }); showToast(t('hdr.refSet')); } },
  });

  return (
    <div className="card uheader">
      <div className="uheader-main">
        <div className="pic">
          <img className="avatar" src={user.photo} alt={fullName} style={{ width: picSize, height: picSize, cursor: 'pointer' }}
            onClick={() => (user.photo ? openPopup('lightbox', { src: user.photo, name: fullName }) : openPopup('photo', { userId: user.id }))} />
          <button className="iconbtn editfab" onClick={() => openPopup('photo', { userId: user.id })}>
            <Icon name="edit" size={14} title={t('pp.title')} />
          </button>
        </div>

        <div className="details">
          {/* line 1 — name | wallet | referrer | alerts | notes */}
          <div className="row hdr-line1" style={{ flexWrap: 'wrap' }}>
            <h2>{fullName}</h2>
            <span className="tag partial"><Icon name="wallet" size={16} />{fmtNum(user.wallet)} {t('hdr.walletPoints')}</span>
            <span className="row hdr-ref" title={referrer ? t('hdr.changeRef') : t('hdr.addRef')}>
              <span className="muted">{t('hdr.ref')}:</span>
              {referrer ? (
                <img className="avatar" src={referrer.photo} width={30} height={30} alt={`${L(referrer.first)} ${L(referrer.last)}`}
                  onDoubleClick={pickReferrer} style={{ cursor: 'pointer' }} />
              ) : (
                <button className="iconbtn" onClick={pickReferrer}><Icon name="plus" size={14} title={t('hdr.addRef')} /></button>
              )}
            </span>
            {user.alerts.length > 0 && <span className="tag alert"><Icon name="alert" size={16} />{t('common.alerts')}</span>}
            <button className={`iconbtn ${showNotes ? 'on' : ''}`} onClick={() => setShowNotes((s) => !s)} title={showNotes ? t('hdr.hideNotes') : t('hdr.showNotes')}>
              <Icon name="note" size={16} title={showNotes ? t('hdr.hideNotes') : t('hdr.showNotes')} />
            </button>
          </div>

          {/* line 2 — age | id */}
          <div className="row muted hdr-line2">
            <span>{t('common.age')}: {ageOf(user.birth)}</span>
            <span>{t('common.id')}: {user.natId}</span>
          </div>

          {/* line 3 — phone | email | address */}
          <div className="row hdr-contact" style={{ flexWrap: 'wrap' }}>
            <span className="row"><Icon name="phone" size={18} />{user.phone}</span>
            <span className="row"><Icon name="mail" size={18} />{user.email}</span>
            <span className="row"><Icon name="pin" size={18} />{L(user.address)}</span>
          </div>

          <div style={{ height: '.5em' }} />

          <div className="socials">
            {SOCIALS.map((s) => (
              <span key={s} className={`soc ${user.social[s] ? '' : 'off'}`}
                title={user.social[s] ? t('hdr.following') : t('hdr.notFollowing')}>
                <Icon name={s} size={18} />
                <span className={`st ${user.social[s] ? 'y' : 'n'}`}>{user.social[s] ? '✓' : '✗'}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* B. Footer */}
      <div className="uheader-footer">
        {showNotes && (
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <Icon name="note" size={15} />
            <span>{user.notes.length === 0 ? t('tbl.noData') : user.notes.map((n) => L(n)).join(' · ')}</span>
            <button className="link-edit" onClick={() => openPopup('editNotes', { userId: user.id })}>{t('hdr.editLabel')}</button>
          </div>
        )}
        {user.alerts.length > 0 && (
          <div className="appt-alert"><Icon name="alert" size={15} />{user.alerts.map((a) => L(a)).join(' · ')}</div>
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
