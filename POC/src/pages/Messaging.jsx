import React, { useState } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, Tabs } from '../components/common.jsx';

export default function Messaging() {
  const { t, L, fmtDate } = useLang();
  const { messages, notes, markMsgRead, openPopup } = useStore();
  const [tab, setTab] = useState('all');

  const shown = messages.filter((m) =>
    tab === 'all' ? true : tab === 'unread' ? !m.read : tab === 'notes' ? false : m.kind === tab);

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="chat" size={22} />{t('msg.title')}</h1>
        <button className="btn" onClick={() => openPopup('note', {})}><Icon name="plus" size={15} />{t('msg.newNote')}</button>
      </div>
      <Tabs active={tab} onChange={setTab} tabs={[
        ['all', t('msg.all')], ['system', t('msg.system')], ['admin', t('msg.admin')],
        ['notes', t('msg.notes')], ['unread', t('msg.unread')],
      ]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6em' }}>
        {tab === 'notes' ? (
          notes.length === 0 ? <div className="card msgitem muted">{t('msg.empty')}</div> :
            notes.map((n) => (
              <div key={n.id} className="card msgitem">
                <Icon name="note" size={18} />
                <div style={{ flex: 1 }}>
                  <div>{L(n.text)}</div>
                  <div className="muted">{fmtDate(n.date)}</div>
                </div>
              </div>
            ))
        ) : shown.length === 0 ? <div className="card msgitem muted">{t('msg.empty')}</div> :
          shown.map((m) => (
            <div key={m.id} className={`card msgitem ${m.read ? '' : 'unread'}`}>
              <Icon name={m.kind === 'system' ? 'bell' : 'users'} size={18} />
              <div style={{ flex: 1 }}>
                <div className="spread">
                  <b>{L(m.title)}</b>
                  <span className="muted">{fmtDate(m.date)} · {m.kind === 'system' ? t('msg.system') : t('msg.admin')}</span>
                </div>
                <div className="muted" style={{ fontSize: '.95em' }}>{L(m.body)}</div>
              </div>
              {!m.read && (
                <button className="btn ghost sm" onClick={() => markMsgRead(m.id)}>
                  <Icon name="check" size={13} />{t('msg.markRead')}
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
