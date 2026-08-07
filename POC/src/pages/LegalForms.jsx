import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../i18n.jsx';
import { useStore } from '../store.jsx';
import { Icon, DataTable, Modal, ModalHead } from '../components/common.jsx';
import { genId } from '../store.jsx';

function SignaturePad() {
  const { t, fmtDate } = useLang();
  const ref = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current;
    c.width = c.offsetWidth; c.height = 110;
    const ctx = c.getContext('2d');
    ctx.strokeStyle = '#e8a33d'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  }, []);

  const pos = (e) => { const r = ref.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = (e) => { drawing.current = true; const ctx = ref.current.getContext('2d'); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e) => { if (!drawing.current) return; const ctx = ref.current.getContext('2d'); const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
      <canvas ref={ref} className="sigpad" style={{ width: '100%', height: 110 }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <div className="spread">
        <span className="muted">{t('fb.signHere')} · {t('fb.sigDate')}: {fmtDate(new Date())}</span>
        <button className="btn ghost sm" onClick={clear}><Icon name="x" size={13} />{t('fb.clearSig')}</button>
      </div>
    </div>
  );
}

function RichTextBlock({ value, onChange }) {
  const { t } = useLang();
  const ref = useRef(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || ''; }, []);
  const cmd = (c) => { document.execCommand(c); ref.current?.focus(); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
      <div className="row">
        <button className="iconbtn" title={t('fb.bold')} onMouseDown={(e) => { e.preventDefault(); cmd('bold'); }}><b>B</b></button>
        <button className="iconbtn" title={t('fb.italic')} onMouseDown={(e) => { e.preventDefault(); cmd('italic'); }}><i>I</i></button>
        <button className="iconbtn" title={t('fb.underline')} onMouseDown={(e) => { e.preventDefault(); cmd('underline'); }}><u>U</u></button>
      </div>
      <div ref={ref} className="richtext" contentEditable data-placeholder={t('fb.richPlaceholder')}
        onInput={(e) => onChange(e.currentTarget.innerHTML)} suppressContentEditableWarning />
    </div>
  );
}

function FormBuilder({ form, onBack }) {
  const { t, L } = useLang();
  const { addForm, updateForm, showToast } = useStore();
  const [name, setName] = useState(form ? L(form.name) : '');
  const [blocks, setBlocks] = useState(form ? form.blocks.map((b) => ({ ...b, q: b.q ? L(b.q) : undefined, html: b.html ? L(b.html) : undefined, options: b.options ? b.options.map((o) => L(o)) : undefined })) : []);
  const [err, setErr] = useState(null);

  const add = (type) => setBlocks((bs) => [...bs, {
    id: genId(), type,
    ...(type === 'rich' ? { html: '' } : {}),
    ...(type === 'toggle' ? { q: '' } : {}),
    ...(type === 'options' ? { q: '', options: [''] } : {}),
  }]);
  const patch = (id, p) => setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, ...p } : b)));
  const remove = (id) => setBlocks((bs) => bs.filter((b) => b.id !== id));

  const save = () => {
    if (!name.trim()) { setErr(t('fb.nameRequired')); return; }
    const norm = blocks.map((b) => ({
      id: b.id, type: b.type,
      ...(b.type === 'rich' ? { html: [b.html || '', b.html || ''] } : {}),
      ...(b.type === 'toggle' ? { q: [b.q || '', b.q || ''] } : {}),
      ...(b.type === 'options' ? { q: [b.q || '', b.q || ''], options: (b.options || []).filter((o) => o.trim()).map((o) => [o, o]) } : {}),
    }));
    if (form) updateForm(form.id, { name: [name, name], blocks: norm });
    else addForm({ name: [name, name], blocks: norm });
    showToast(t('common.save'));
    onBack();
  };

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row">
          <button className="iconbtn" onClick={onBack}><Icon name="chevL" size={15} title={t('common.back')} /></button>
          <Icon name="legal" size={22} />{t('fb.title')}
        </h1>
        <button className="btn" onClick={save}><Icon name="check" size={15} />{t('common.save')}</button>
      </div>

      <div className="card" style={{ padding: '1em' }}>
        <label>{t('lg.formName')}
          <input value={name} onChange={(e) => { setName(e.target.value); setErr(null); }} style={{ width: '100%', maxWidth: '26em' }} />
        </label>
        {err && <div className="err">{err}</div>}
      </div>

      <div className="row" style={{ flexWrap: 'wrap' }}>
        <span className="muted">{t('fb.addBlock')}</span>
        <button className="btn ghost sm" onClick={() => add('rich')}><Icon name="doc" size={13} />{t('fb.addRich')}</button>
        <button className="btn ghost sm" onClick={() => add('toggle')}><Icon name="check" size={13} />{t('fb.addToggle')}</button>
        <button className="btn ghost sm" onClick={() => add('options')}><Icon name="plus" size={13} />{t('fb.addOptions')}</button>
        <button className="btn ghost sm" onClick={() => add('signature')}><Icon name="edit" size={13} />{t('fb.addSig')}</button>
      </div>

      {blocks.map((b) => (
        <div key={b.id} className="card fb-block">
          <button className="iconbtn rm" onClick={() => remove(b.id)}><Icon name="x" size={13} title={t('fb.remove')} /></button>
          {b.type === 'rich' && <RichTextBlock value={b.html} onChange={(html) => patch(b.id, { html })} />}
          {b.type === 'toggle' && (
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <input style={{ flex: 1, minWidth: '14em' }} placeholder={t('fb.qPlaceholder')} value={b.q} onChange={(e) => patch(b.id, { q: e.target.value })} />
              <span className="row"><span className="chip on">{t('common.yes')}</span><span className="chip">{t('common.no')}</span></span>
            </div>
          )}
          {b.type === 'options' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4em' }}>
              <input placeholder={t('fb.qPlaceholder')} value={b.q} onChange={(e) => patch(b.id, { q: e.target.value })} />
              {(b.options || []).map((o, i) => (
                <div key={i} className="row">
                  <Icon name="chevR" size={12} />
                  <input style={{ flex: 1 }} placeholder={t('fb.optPlaceholder')} value={o}
                    onChange={(e) => patch(b.id, { options: b.options.map((x, j) => (j === i ? e.target.value : x)) })} />
                  <button className="iconbtn" onClick={() => patch(b.id, { options: b.options.filter((_, j) => j !== i) })}><Icon name="x" size={12} title={t('common.delete')} /></button>
                </div>
              ))}
              <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => patch(b.id, { options: [...(b.options || []), ''] })}>{t('fb.addOpt')}</button>
            </div>
          )}
          {b.type === 'signature' && <SignaturePad />}
        </div>
      ))}
    </div>
  );
}

export default function LegalForms() {
  const { t, L, fmtDate } = useLang();
  const { forms, removeForm } = useStore();
  const [editing, setEditing] = useState(null); // null | 'new' | form
  const [confirmDel, setConfirmDel] = useState(null);

  if (editing) return <FormBuilder form={editing === 'new' ? null : editing} onBack={() => setEditing(null)} />;

  const cols = [
    { key: 'created', label: t('lg.created'), sortVal: (f) => f.created, render: (f) => fmtDate(f.created) },
    { key: 'name', label: t('lg.formName'), sortVal: (f) => L(f.name), render: (f) => <b className="row"><Icon name="doc" size={15} />{L(f.name)}</b> },
    {
      key: 'actions', label: t('common.actions'),
      render: (f) => (
        <span className="row">
          <button className="btn ghost sm" onClick={() => setEditing(f)}><Icon name="edit" size={13} />{t('common.edit')}</button>
          <button className="btn danger sm" onClick={() => setConfirmDel(f)}><Icon name="trash" size={13} />{t('common.delete')}</button>
        </span>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="spread">
        <h1 className="row"><Icon name="legal" size={22} />{t('lg.title')}</h1>
        <button className="btn" onClick={() => setEditing('new')}><Icon name="plus" size={15} />{t('lg.add')}</button>
      </div>
      <div className="card" style={{ padding: '1em' }}>
        <DataTable columns={cols} rows={forms} pageSize={8} />
      </div>
      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)} className="narrow">
          <ModalHead title={t('lg.confirmDelete')} icon="trash" onClose={() => setConfirmDel(null)} />
          <b>{L(confirmDel.name)}</b>
          <div className="row">
            <button className="btn danger" onClick={() => { removeForm(confirmDel.id); setConfirmDel(null); }}><Icon name="trash" size={14} />{t('common.yes')}</button>
            <button className="btn ghost" onClick={() => setConfirmDel(null)}>{t('common.no')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
