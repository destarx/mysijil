/* mySijil – modul teras: paparan sijil dan PDF.
   Digunakan oleh index.html (carian awam) dan admin.html. */
(function (g) {
  'use strict';

  var GELARAN = { 1: 'JOHAN', 2: 'NAIB JOHAN', 3: 'KETIGA', 4: 'KEEMPAT' };
  var ACARA_ASAL = {
    tajuk: 'KEJOHANAN SKUASY',
    subtajuk1: 'SEKOLAH RENDAH / SEKOLAH MENENGAH',
    subtajuk2: 'MAJLIS SUKAN SEKOLAH BAHAGIAN (MSSB) MIRI 2026',
    tempat: 'Gelanggang Skuasy SK Jalan Bintang',
    tarikh: '13-17 April 2026'
  };

  function norm(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function pickRec(r) {
    return { nama: String(r.nama || '').trim(), ic: String(r.ic || '').trim(), sekolah: String(r.sekolah || '').trim(),
             kategori: String(r.kategori || '').trim(), kedudukan: Number(r.kedudukan) || 1 };
  }

  /* Paparan sijil */
  function fill(el, rec, acara) {
    acara = acara || ACARA_ASAL;
    el.querySelectorAll('[data-f]').forEach(function (s) {
      var f = s.getAttribute('data-f'), v;
      if (f === 'gelaran') v = GELARAN[rec.kedudukan] || '';
      else if (Object.prototype.hasOwnProperty.call(rec, f)) v = rec[f];
      else v = acara[f] != null ? acara[f] : (ACARA_ASAL[f] || '');
      s.textContent = v;
    });
    var nb = el.querySelector('[data-namabox]');
    if (nb) { var n = String(rec.nama || '').length; nb.style.fontSize = (n <= 24 ? 30 : (n <= 30 ? 26 : 23)) + 'px'; }
    return el;
  }
  function makeCert(rec, acara) {
    var w = document.createElement('div');
    w.innerHTML = g.SIJIL_HTML;
    return fill(w.firstElementChild, rec, acara);
  }

  async function toPdf(recs, acara, filename, onProgress) {
    if (!(g.html2canvas && g.jspdf)) throw new Error('pdf-lib');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;pointer-events:none';
    document.body.appendChild(holder);
    try {
      var pdf = new g.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      for (var i = 0; i < recs.length; i++) {
        var el = makeCert(recs[i], acara);
        holder.innerHTML = ''; holder.appendChild(el);
        await Promise.all(Array.prototype.map.call(el.querySelectorAll('img'), function (im) {
          return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
        }));
        var canvas = await g.html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, width: 794, height: 1123, windowWidth: 1200 });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
        if (onProgress) onProgress(i + 1, recs.length);
      }
      pdf.save(filename);
    } finally { holder.remove(); }
  }

  function fileName(s) { return String(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  g.Sijil = { GELARAN: GELARAN, ACARA_ASAL: ACARA_ASAL, norm: norm, fill: fill, makeCert: makeCert,
              toPdf: toPdf, fileName: fileName, pickRec: pickRec };
})(window);
