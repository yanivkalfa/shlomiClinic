import React, { useState, useCallback } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable } from '../components/common.jsx';

export default function UsersManagement() {
  const { t, L, fmtDate, fmtMoney } = useLang();
  const { users, navigate, openPopup, userLastVisit, userNextVisit, userPendingSum } = useStore();
  const [q, setQ] = useState('');

  const searchFn = useCallback((u, s) =>
    `${u.first[0]} ${u.last[0]} ${u.first[1]} ${u.last[1]}`.toLowerCase().includes(s) ||
    u.phone.replace(/-/g, '').includes(s.replace(/-/g, '')) || u.natId.includes(s), []);

  const columns = [
    {
      key: 'name', label: t('common.name'),
      sortVal: (u) => `${u.first[0]} ${u.last[0]}`,
      render: (u) => (
        <button className="row" onClick={() => navigate('user', { userId: u.id })}>
          <img className="avatar" src={u.photo} width={34} height={34} alt="" />
          <b>{L(u.first)} {L(u.last)}</b>
        </button>
      ),
    },
    { key: 'phone', label: t('common.phone'), sortVal: (u) => u.phone, render: (u) => <span className="muted">{u.phone}</span> },
    {
      key: 'last', label: t('users.lastVisit'),
      sortVal: (u) => userLastVisit(u.id)?.date || '',
      render: (u) => { const v = userLastVisit(u.id); return v ? fmtDate(v.date) : t('users.never'); },
    },
    {
      key: 'next', label: t('users.nextVisit'),
      sortVal: (u) => userNextVisit(u.id)?.date || '',
      render: (u) => { const v = userNextVisit(u.id); return v ? fmtDate(v.date) : t('users.never'); },
    },
    {
      key: 'pending', label: t('users.pendingPay'),
      sortVal: (u) => userPendingSum(u.id),
      render: (u) => { const s = userPendingSum(u.id); return s > 0 ? <span className="tag pending"><Icon name="alert" size={12} />{fmtMoney(s)}</span> : <span className="muted">—</span>; },
    },
    {
      key: 'flags', label: t('common.notes'),
      render: (u) => (
        <span className="row">
          {u.notes.length > 0 && <Icon name="note" size={16} title={t('common.notes')} />}
          {u.alerts.length > 0 && <span className="tag alert"><Icon name="alert" size={12} />{t('common.alerts')}</span>}
        </span>
      ),
    },
    {
      key: 'open', label: t('common.actions'),
      render: (u) => (
        <button className="btn ghost sm" onClick={() => navigate('user', { userId: u.id })}>
          <Icon name="arrowR" size={13} />{t('users.openProfile')}
        </button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="users" size={22} />{t('users.title')}</h1>
        <button className="btn" onClick={() => openPopup('addUser', {})}><Icon name="plus" size={15} />{t('users.addNew')}</button>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <div className="row" style={{ marginBottom: '.7em' }}>
          <Icon name="search" size={16} />
          <input style={{ flex: 1, maxWidth: '22em' }} placeholder={t('qa.placeholder')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <DataTable columns={columns} rows={users} searchText={q} searchFn={searchFn} pageSize={8} />
      </div>
    </div>
  );
}
