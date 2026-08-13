import { jsPDF } from 'jspdf';

// Signed-document export.
//
// jsPDF's built-in fonts carry no Hebrew glyphs, so instead of embedding a font we
// paint the page onto a canvas — which renders Hebrew and honours `direction: rtl`
// from the system fonts — and place that canvas into the PDF as a single image.
// The document therefore stays fully translated in both languages.
const W = 1240, H = 1754; // A4 at ~150dpi

export function downloadSignedDocs({ forms, user, visit, procedures, logo, isRTL, strings, fmtDate }) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.direction = isRTL ? 'rtl' : 'ltr';
  ctx.textAlign = isRTL ? 'right' : 'left';
  const X = isRTL ? W - 80 : 80;      // text origin
  const INDENT = isRTL ? -40 : 40;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // header band
  ctx.fillStyle = '#0e2a52';
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#e8a33d';
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(strings.clinic, X, 70);
  ctx.fillStyle = '#dbe3f2';
  ctx.font = '26px Arial, sans-serif';
  ctx.fillText(strings.title, X, 115);

  let y = 220;
  ctx.fillStyle = '#17233b';
  ctx.font = 'bold 30px Arial, sans-serif';
  ctx.fillText(`${strings.patient}: ${user.name}`, X, y); y += 44;
  ctx.font = '26px Arial, sans-serif';
  ctx.fillText(`${strings.id}: ${user.natId}`, X, y); y += 40;
  ctx.fillText(`${strings.date}: ${fmtDate(visit.date)}`, X, y); y += 40;
  if (procedures.length) { ctx.fillText(`${strings.procedures}: ${procedures.join(', ')}`, X, y); y += 40; }

  y += 20;
  ctx.strokeStyle = '#c9d2e4';
  ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(W - 80, y); ctx.stroke();
  y += 50;

  const wrap = (text, font, lineH, maxWidth) => {
    ctx.font = font;
    const words = String(text).split(/\s+/);
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, X + INDENT, y); y += lineH; line = w;
      } else line = test;
    }
    if (line) { ctx.fillText(line, X + INDENT, y); y += lineH; }
  };

  for (const form of forms) {
    if (y > H - 320) break;
    ctx.fillStyle = '#0e2a52';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(form.name, X, y); y += 44;
    ctx.fillStyle = '#17233b';

    for (const block of form.blocks) {
      if (y > H - 300) break;
      if (block.type === 'rich') { wrap(block.text, '24px Arial, sans-serif', 34, W - 240); y += 12; }
      else if (block.type === 'qa') {
        wrap(`• ${block.q}  —  ${block.a}`, '24px Arial, sans-serif', 34, W - 240);
        if (block.alert) {
          ctx.fillStyle = '#b23a3a';
          ctx.font = 'bold 22px Arial, sans-serif';
          ctx.fillText(`⚠ ${strings.alert}`, X + INDENT * 2, y); y += 34;
          ctx.fillStyle = '#17233b';
        }
      }
    }
    y += 24;
  }

  // signature block
  const sigY = H - 240;
  ctx.strokeStyle = '#c9d2e4';
  ctx.beginPath(); ctx.moveTo(80, sigY - 40); ctx.lineTo(W - 80, sigY - 40); ctx.stroke();
  ctx.fillStyle = '#17233b';
  ctx.font = '24px Arial, sans-serif';
  ctx.fillText(`${strings.signedOn}: ${fmtDate(visit.date)}`, X, sigY);
  ctx.strokeStyle = '#0e2a52';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const sx = isRTL ? W - 460 : 80;
  ctx.moveTo(sx, sigY + 90);
  ctx.bezierCurveTo(sx + 70, sigY + 30, sx + 140, sigY + 120, sx + 210, sigY + 55);
  ctx.bezierCurveTo(sx + 260, sigY + 20, sx + 300, sigY + 95, sx + 370, sigY + 60);
  ctx.stroke();
  ctx.font = '20px Arial, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(strings.signature, X, sigY + 130);

  const finish = () => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph);
    pdf.save(`${strings.fileName}.pdf`);
  };

  if (!logo) { finish(); return; }
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, isRTL ? 80 : W - 190, 30, 90, 90);
    finish();
  };
  img.onerror = finish;
  img.src = logo;
}

// Merge the current comparison view into one downloadable image, logo bottom-right.
export function exportComparison({ beforeSrc, afterSrc, mode, opacity, logo, border, fileName }) {
  const load = (src) => new Promise((res, rej) => {
    if (!src) return res(null);
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej;
    i.src = src;
  });

  return Promise.all([load(beforeSrc), load(afterSrc), load(logo)]).then(([b, a, lg]) => {
    const cell = 700;
    const cvs = document.createElement('canvas');
    if (mode === 'stack') { cvs.width = cell; cvs.height = cell * 2; }
    else if (mode === 'side') { cvs.width = cell * 2; cvs.height = cell; }
    else { cvs.width = cell; cvs.height = cell; }
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#0a1830';
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    const cover = (img, x, y, w, h, alpha = 1) => {
      if (!img) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const s = Math.max(w / img.width, h / img.height);
      const dw = img.width * s, dh = img.height * s;
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.restore();
    };

    if (mode === 'stack') { cover(b, 0, 0, cell, cell); cover(a, 0, cell, cell, cell); }
    else if (mode === 'side') { cover(b, 0, 0, cell, cell); cover(a, cell, 0, cell, cell); }
    else { cover(b, 0, 0, cell, cell); cover(a, 0, 0, cell, cell, opacity / 100); }

    if (border && mode !== 'overlay') {
      ctx.strokeStyle = 'rgba(232,163,61,.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (mode === 'stack') { ctx.moveTo(0, cell); ctx.lineTo(cell, cell); }
      else { ctx.moveTo(cell, 0); ctx.lineTo(cell, cell); }
      ctx.stroke();
    }

    if (lg) {
      const size = 110;
      ctx.globalAlpha = 0.92;
      ctx.drawImage(lg, cvs.width - size - 28, cvs.height - size - 28, size, size);
      ctx.globalAlpha = 1;
    }

    const a2 = document.createElement('a');
    a2.href = cvs.toDataURL('image/png');
    a2.download = `${fileName}.png`;
    a2.click();
  });
}
