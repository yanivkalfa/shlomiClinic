import React, { useState, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, Modal, ModalHead } from './common.jsx';
import { ADMIN } from '../data.js';

// Deletion gate: warning + the admin's own password before anything is removed.
export function AdminPassConfirm({ close, title, subject, onConfirm }) {
  const { t } = useLang();
  const { showToast } = useStore();
  const [pass, setPass] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    if (pass !== ADMIN.password) { setErr(true); return; }
    onConfirm();
    showToast(t('confirm.deleted'));
    close();
  };

  return (
    <Modal onClose={close} className="narrow">
      <ModalHead title={title || t('confirm.title')} icon="trash" onClose={close} />
      {subject && <b>{subject}</b>}
      <div className="row" style={{ color: '#f08c8c' }}><Icon name="alert" size={16} />{t('confirm.warning')}</div>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '.6em' }}>
        <label>{t('confirm.pass')}
          <input type="password" value={pass} autoFocus style={{ width: '100%' }}
            onChange={(e) => { setPass(e.target.value); setErr(false); }} />
        </label>
        {err && <div className="err">{t('confirm.wrongPass')}</div>}
        <div className="row">
          <button type="submit" className="btn danger"><Icon name="trash" size={14} />{t('common.delete')}</button>
          <button type="button" className="btn ghost" onClick={close}>{t('common.cancel')}</button>
        </div>
      </form>
    </Modal>
  );
}

// react-hook-form + the store's dirty-form registry.
// While the form is dirty, navigating raises the "unsaved changes" popup; the
// store calls the reset we register here when the admin chooses to leave.
export function useGuardedForm(options = {}) {
  const id = useId();
  const { registerDirty, clearDirty } = useStore();
  const form = useForm({ mode: 'onChange', ...options });
  const { isDirty } = form.formState;
  const { reset } = form;

  useEffect(() => {
    if (isDirty) registerDirty(id, () => reset());
    else clearDirty(id);
    return () => clearDirty(id);
  }, [isDirty, id, registerDirty, clearDirty, reset]);

  // call after a successful save so leaving the page no longer prompts
  const settle = (values) => reset(values ?? form.getValues());
  return { ...form, settle };
}

// Popup shown when navigation is blocked by a dirty form.
export function LeaveGuardPopup() {
  const { t } = useLang();
  const { pendingNav, confirmLeave, cancelLeave } = useStore();
  if (!pendingNav) return null;
  return (
    <Modal onClose={cancelLeave} className="narrow">
      <ModalHead title={t('nav.dirtyTitle')} icon="alert" onClose={cancelLeave} />
      <div>{t('nav.dirtyBody')}</div>
      <div className="row">
        <button className="btn danger" onClick={confirmLeave}><Icon name="arrowR" size={14} />{t('nav.leave')}</button>
        <button className="btn ghost" onClick={cancelLeave}>{t('nav.stay')}</button>
      </div>
    </Modal>
  );
}
