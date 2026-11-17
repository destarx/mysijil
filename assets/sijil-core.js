/* mySijil – modul teras: paparan sijil dan PDF.
   Digunakan oleh index.html (carian awam) dan admin.html. */
(function (g) {
  'use strict';

  var GELARAN = { 1: 'JOHAN', 2: 'NAIB JOHAN', 3: 'KETIGA', 4: 'KEEMPAT' };
  var GELARAN_PPD = { 1: 'JOHAN', 2: 'NAIB JOHAN', 3: 'TEMPAT KETIGA', 4: 'TEMPAT KEEMPAT' };
  var REKA = { asal: { w: 794, h: 1123, page: 'A4', pdf: 'a4', mm: [210, 297] },
               ppd:  { w: 816, h: 1056, page: 'letter', pdf: 'letter', mm: [215.9, 279.4] } };
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
      else if (f === 'gelaran_ppd') v = GELARAN_PPD[rec.kedudukan] || '';
      else if (f === 'kategori_ppd') v = kategoriPpd(rec.kategori);
      else if (Object.prototype.hasOwnProperty.call(rec, f)) v = rec[f];
      else v = acara[f] != null ? acara[f] : (ACARA_ASAL[f] || '');
      s.textContent = v;
    });
    var nb = el.querySelector('[data-namabox]');
    if (nb) {
      var n = String(rec.nama || '').length, fs = (nb.getAttribute('data-fs') || '30,26,23').split(',');
      nb.style.fontSize = (n <= 24 ? fs[0] : (n <= 30 ? fs[1] : fs[2])) + 'px';
    }
    return el;
  }
  /* "Sekolah Menengah - Lelaki B18 (L18TKB)" -> "( KATEGORI L18TKB )" seperti templat PPD */
  function kategoriPpd(k) {
    k = String(k || '').trim();
    var m = k.match(/\(([^()]+)\)\s*$/);
    return '( ' + (m ? 'KATEGORI ' + m[1].trim() : k).toUpperCase() + ' )';
  }
  function rekaBentuk(rec, acara) {
    var r = (acara && acara.reka_bentuk) || (rec && rec.reka_bentuk) || 'asal';
    return REKA[r] ? r : 'asal';
  }
  function saiz(el) { return el && el.classList.contains('sijil-ppd') ? REKA.ppd : REKA.asal; }
  function makeCert(rec, acara) {
    var w = document.createElement('div');
    w.innerHTML = rekaBentuk(rec, acara) === 'ppd' ? g.SIJIL_HTML_PPD : g.SIJIL_HTML;
    return fill(w.firstElementChild, rec, acara);
  }
  /* Saiz kertas cetakan mengikut reka bentuk */
  function setHalaman(el) {
    var st = document.getElementById('gayaHalaman');
    if (!st) { st = document.createElement('style'); st.id = 'gayaHalaman'; document.head.appendChild(st); }
    st.textContent = '@page{size:' + saiz(el).page + ' portrait;margin:0}';
  }

  async function toPdf(recs, acara, filename, onProgress) {
    if (!(g.html2canvas && g.jspdf)) throw new Error('pdf-lib');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    var holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none';
    document.body.appendChild(holder);
    try {
      var pdf = null;
      for (var i = 0; i < recs.length; i++) {
        var el = makeCert(recs[i], acara), z = saiz(el);
        holder.innerHTML = ''; holder.appendChild(el);
        await Promise.all(Array.prototype.map.call(el.querySelectorAll('img'), function (im) {
          return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
        }));
        var canvas = await g.html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, width: z.w, height: z.h, windowWidth: 1200 });
        if (!pdf) pdf = new g.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: z.pdf, compress: true });
        else pdf.addPage(z.pdf, 'p');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, z.mm[0], z.mm[1]);
        if (onProgress) onProgress(i + 1, recs.length);
      }
      pdf.save(filename);
    } finally { holder.remove(); }
  }

  function fileName(s) { return String(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  g.Sijil = { GELARAN: GELARAN, ACARA_ASAL: ACARA_ASAL, norm: norm, fill: fill, makeCert: makeCert,
              toPdf: toPdf, fileName: fileName, pickRec: pickRec, saiz: saiz, setHalaman: setHalaman };
})(window);
