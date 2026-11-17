# mySijil – Semakan Sijil Kejohanan Skuasy MSSB Miri 2026

Laman web statik untuk guru dan ibu bapa mencari serta memuat turun sijil pemenang (tempat 1–4) Kejohanan Skuasy MSSB Miri 2026 menggunakan nombor kad pengenalan / sijil lahir murid.

## Fail
- `index.html` – halaman carian + reka bentuk sijil (A4 potret), butang **Muat Turun PDF** dan **Cetak**.
- `data/sijil.json` – rekod pemenang yang **disulitkan**. Setiap rekod hanya boleh dibuka dengan No. KP murid itu sendiri (PBKDF2-SHA256 + AES-GCM), jadi nama dan No. KP tidak tersimpan dalam bentuk teks biasa.
- `assets/` – logo SK Jalan Bintang, MSSB Miri, SMK Riam, tandatangan Guru Besar dan latar logo MSSB.

## Sumber data
SMIS – Cetak Senarai Penyelia Peserta Skuasy MSSB Miri 2026 (nama, No. KP, sekolah) dan poster Keputusan Rasmi (kedudukan).

## Hosting
Aktifkan **GitHub Pages** (Settings → Pages → Deploy from a branch → `main` / root). Laman akan tersedia di `https://destarx.github.io/mysijil/`.

## Nota keselamatan
Penyulitan menghalang senarai murid dibaca terus daripada fail data, tetapi No. KP mempunyai corak yang boleh diteka (tarikh lahir + kod negeri), jadi ia bukan perlindungan mutlak. Jangan masukkan data yang lebih sensitif ke dalam repo ini.
