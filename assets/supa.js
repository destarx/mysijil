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

  /* Log masuk Google (akaun DELIMa) – aliran PKCE */
  var PK = 'mysijil_pkce';
  function b64url(u) { var s = ''; u = new Uint8Array(u); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  async function masukGoogle(redirectTo, domain) {
    var verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
    var challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    try { localStorage.setItem(PK, verifier); } catch (e) { sessionStorage.setItem(PK, verifier); }
    var q = 'provider=google&redirect_to=' + encodeURIComponent(redirectTo) +
            '&code_challenge=' + challenge + '&code_challenge_method=s256&prompt=select_account' +
            (domain ? '&hd=' + encodeURIComponent(domain) : '');
    location.href = CFG.url + '/auth/v1/authorize?' + q;
  }
  /* Dipanggil semasa halaman dibuka: tukar ?code= kepada sesi. Pulangkan true jika log masuk berlaku. */
  async function terimaRedirect() {
    var u = new URL(location.href), h = new URLSearchParams(location.hash.replace(/^#/, ''));
    var err = u.searchParams.get('error_description') || h.get('error_description');
    var code = u.searchParams.get('code');
    function bersih() { history.replaceState(null, '', location.pathname); }
    if (err) { bersih(); throw Object.assign(new Error(err), { oauth: true }); }
    if (h.get('access_token')) {
      bersih();
      simpanToken({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: +h.get('expires_in') || 3600 });
      return true;
    }
    if (!code) return false;
    var v = null;
    try { v = localStorage.getItem(PK) || sessionStorage.getItem(PK); localStorage.removeItem(PK); sessionStorage.removeItem(PK); } catch (e) {}
    bersih();
    if (!v) throw Object.assign(new Error('Sesi log masuk tamat. Sila cuba semula.'), { oauth: true });
    simpanToken(await authReq('token?grant_type=pkce', { auth_code: code, code_verifier: v }));
    return true;
  }

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
    masuk: masuk, masukGoogle: masukGoogle, terimaRedirect: terimaRedirect, keluar: keluar, token: token, sesi: sesi,
    pilih: function (path) { return rest('GET', path); },
    tambah: function (table, rows, prefer) { return rest('POST', table, rows, prefer || 'return=representation'); },
    ubah: function (path, data) { return rest('PATCH', path, data, 'return=representation'); },
    padam: function (path) { return rest('DELETE', path, null, 'return=minimal'); },
    rpc: function (name, args) { return rest('POST', 'rpc/' + name, args || {}); }
  };
})(window);
