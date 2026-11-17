# mySijil – Semakan Sijil Kejohanan Skuasy MSSB Miri 2026

Laman web statik untuk guru dan ibu bapa mencari serta memuat turun sijil pemenang (tempat 1–4) Kejohanan Skuasy MSSB Miri 2026 menggunakan nombor kad pengenalan / sijil lahir murid.

## Fail
- `index.html` – halaman carian + reka bentuk sijil (A4 potret), butang **Muat Turun PDF** dan **Cetak**.
- `data/sijil.json` – rekod pemenang yang **disulitkan**. Setiap rekod hanya boleh dibuka dengan No. KP murid itu sendiri (PBKDF2-SHA256 + AES-GCM), jadi nama dan No. KP tidak tersimpan dalam bentuk teks biasa.
- `assets/` – logo SK Jalan Bintang, MSSB Miri, SMK Riam, tandatangan Guru Besar dan latar logo MSSB.

## Admin (`admin.html`)
Log masuk dengan kata laluan admin. Kata laluan **tidak disimpan dalam kod**: ia ialah kunci yang membuka `data/admin.json` (senarai penuh pemenang yang disulitkan).

Fungsi admin:
- Lihat, tapis dan cari semua pemenang (ikut kategori, sekolah, kedudukan)
- Tambah, sunting dan padam rekod (semakan pendua No. KP dan kedudukan bertindih)
- Import dari Excel (lajur: Nama Murid, No. KP, Nama Sekolah, Kategori, Kedudukan), tambah ke senarai atau ganti semua; butang **Templat Excel** sebagai panduan
- Cetak semua / PDF semua sijil (ikut tapisan)
- Tetapan acara (tajuk, subtajuk, tempat, tarikh) yang dipaparkan pada sijil
- Tukar kata laluan admin
- **Simpan**: menulis semula `data/sijil.json` dan `data/admin.json` terus ke repo melalui GitHub API menggunakan token *fine-grained* (Contents: Read and write, repo ini sahaja). Pilihan lain: muat turun kedua-dua fail dan muat naik sendiri ke folder `data/`.

## Sumber data
SMIS – Cetak Senarai Penyelia Peserta Skuasy MSSB Miri 2026 (nama, No. KP, sekolah) dan poster Keputusan Rasmi (kedudukan).

## Hosting
Aktifkan **GitHub Pages** (Settings → Pages → Deploy from a branch → `main` / root). Laman akan tersedia di `https://destarx.github.io/mysijil/`.

## Nota keselamatan
Penyulitan menghalang senarai murid dibaca terus daripada fail data, tetapi No. KP mempunyai corak yang boleh diteka (tarikh lahir + kod negeri), jadi ia bukan perlindungan mutlak. Jangan masukkan data yang lebih sensitif ke dalam repo ini.
