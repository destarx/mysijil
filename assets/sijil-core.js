/* mySijil – modul teras: penyulitan data, paparan sijil, PDF.
   Digunakan oleh index.html (carian awam) dan admin.html. */
(function (g) {
  'use strict';

  var GELARAN = { 1: 'JOHAN', 2: 'NAIB JOHAN', 3: 'KETIGA', 4: 'KEEMPAT' };
  var ITER = 310000;
  var ACARA_ASAL = {
    tajuk: 'KEJOHANAN SKUASY',
    subtajuk1: 'SEKOLAH RENDAH / SEKOLAH MENENGAH',
    subtajuk2: 'MAJLIS SUKAN SEKOLAH BAHAGIAN (MSSB) MIRI 2026',
    tempat: 'Gelanggang Skuasy SK Jalan Bintang',
    tarikh: '13-17 April 2026'
  };

  var te = new TextEncoder(), td = new TextDecoder();

  function norm(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function rand(n) { return crypto.getRandomValues(new Uint8Array(n)); }
  function b64e(buf) {
    var u = new Uint8Array(buf), s = '';
    for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64d(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function hex(u) { return Array.prototype.map.call(u, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }

  async function bits(secret, salt, iter, len) {
    var km = await crypto.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, km, len));
  }
  function aes(raw, use) { return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [use]); }

  function pickRec(r) {
    return { nama: String(r.nama || '').trim(), ic: String(r.ic || '').trim(), sekolah: String(r.sekolah || '').trim(),
             kategori: String(r.kategori || '').trim(), kedudukan: Number(r.kedudukan) || 1 };
  }

  /* Carian awam: rekod hanya dibuka dengan No. KP yang betul. */
  async function lookup(data, icRaw) {
    var ic = norm(icRaw);
    var d = await bits(ic, b64d(data.salt), data.iter, 384);
    var rows = data.r[hex(d.slice(0, 16))];
    if (!rows) return [];
    var key = await aes(d.slice(16, 48), 'decrypt');
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(rows[i][0]) }, key, b64d(rows[i][1]));
      out.push(JSON.parse(td.decode(pt)));
    }
    return out;
  }

  /* Bina fail data awam (data/sijil.json) daripada senarai rekod. */
  async function buildPublic(records, acara, onProgress) {
    var salt = rand(16), r = {}, groups = {};
    records.forEach(function (rec) { var k = norm(rec.ic); (groups[k] = groups[k] || []).push(pickRec(rec)); });
    var keys = Object.keys(groups), done = 0;
    for (var i = 0; i < keys.length; i++) {
      var d = await bits(keys[i], salt, ITER, 384);
      var key = await aes(d.slice(16, 48), 'encrypt');
      var rows = [];
      for (var j = 0; j < groups[keys[i]].length; j++) {
        var iv = rand(12);
        var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, te.encode(JSON.stringify(groups[keys[i]][j])));
        rows.push([b64e(iv), b64e(ct)]);
      }
      r[hex(d.slice(0, 16))] = rows;
      done++; if (onProgress) onProgress(done, keys.length);
    }
    return { v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64e(salt), acara: acara, r: r };
  }

  /* Fail admin (data/admin.json): senarai penuh, disulitkan dengan kata laluan admin. */
  async function encryptAdmin(payload, pw) {
    var salt = rand(16), iv = rand(12);
    var key = await aes(await bits(pw, salt, ITER, 256), 'encrypt');
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, te.encode(JSON.stringify(payload)));
    return { v: 1, kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64e(salt), iv: b64e(iv), ct: b64e(ct) };
  }
  async function decryptAdmin(file, pw) {
    var key = await aes(await bits(pw, b64d(file.salt), file.iter, 256), 'decrypt');
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(file.iv) }, key, b64d(file.ct));
    return JSON.parse(td.decode(pt));
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

  g.Sijil = { GELARAN: GELARAN, ACARA_ASAL: ACARA_ASAL, norm: norm, lookup: lookup, buildPublic: buildPublic,
              encryptAdmin: encryptAdmin, decryptAdmin: decryptAdmin, fill: fill, makeCert: makeCert,
              toPdf: toPdf, fileName: fileName, pickRec: pickRec };
})(window);
