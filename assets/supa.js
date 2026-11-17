/* mySijil – sambungan ringkas ke Supabase (REST + Auth) tanpa perpustakaan luar.
   Kunci "publishable" memang direka untuk diletakkan dalam laman awam: akses data
   dikawal oleh Row Level Security dalam pangkalan data. */
(function (g) {
  'use strict';
  var CFG = {
    url: 'https://smeykkqkbxpivipsmuck.supabase.co',
    key: 'sb_publishable_aq8GaCJ7SEPlgf2-UeDY8g_sufdWMkJ'
  };
  var SK = 'mysijil_sesi';

  function sesi() { try { return JSON.parse(localStorage.getItem(SK)); } catch (e) { return g.__mysijilSesi || null; } }
  function simpan(s) {
    g.__mysijilSesi = s;
    try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) {}
  }

  function ralat(j, status, asal) {
    var e = new Error((j && (j.error_description || j.msg || j.message || j.hint)) || asal || ('HTTP ' + status));
    e.status = status; e.code = j && (j.code || j.error_code || j.error); e.details = j && j.details;
    return e;
  }

  async function authReq(path, body, tok) {
    var h = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (tok) h.Authorization = 'Bearer ' + tok;
    var r = await fetch(CFG.url + '/auth/v1/' + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) });
    var txt = await r.text(), j = null;
    try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) throw ralat(j, r.status, 'auth');
    return j;
  }
  function simpanToken(j) {
    var s = { access_token: j.access_token, refresh_token: j.refresh_token,
              expires_at: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)),
              user: j.user ? { id: j.user.id, email: j.user.email } : null };
    simpan(s); return s;
  }

  async function masuk(email, pw) { return simpanToken(await authReq('token?grant_type=password', { email: email, password: pw })); }

  var segar = null;
  async function token() {
    var s = sesi();
    if (!s) return null;
    if (s.expires_at - 60 < Date.now() / 1000) {
      if (!segar) segar = authReq('token?grant_type=refresh_token', { refresh_token: s.refresh_token })
        .then(simpanToken).catch(function () { simpan(null); return null; })
        .finally(function () { segar = null; });
      s = await segar;
      if (!s) return null;
    }
    return s.access_token;
  }

  async function keluar() {
    var t = await token();
    simpan(null);
    if (t) { try { await authReq('logout', {}, t); } catch (e) {} }
  }

  async function rest(method, path, body, prefer) {
    var t = await token();
    var h = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (t) h.Authorization = 'Bearer ' + t;
    if (prefer) h.Prefer = prefer;
    var r = await fetch(CFG.url + '/rest/v1/' + path, { method: method, headers: h, body: body != null ? JSON.stringify(body) : undefined });
    var txt = await r.text(), j = null;
    try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) throw ralat(j, r.status);
    return j;
  }

  g.Supa = {
    masuk: masuk, keluar: keluar, token: token, sesi: sesi,
    pilih: function (path) { return rest('GET', path); },
    tambah: function (table, rows, prefer) { return rest('POST', table, rows, prefer || 'return=representation'); },
    ubah: function (path, data) { return rest('PATCH', path, data, 'return=representation'); },
    padam: function (path) { return rest('DELETE', path, null, 'return=minimal'); },
    rpc: function (name, args) { return rest('POST', 'rpc/' + name, args || {}); }
  };
})(window);
