# mySijil – Semakan Sijil Kejohanan

Laman web untuk guru dan ibu bapa mencari serta memuat turun sijil pemenang (tempat 1–4) kejohanan menggunakan nombor kad pengenalan / sijil lahir murid. Dihoskan di GitHub Pages; data disimpan dalam Supabase (projek **erph-skjb**, jadual `sijil_*`, berasingan daripada jadual eRPH).

## Fail
- `index.html` – laman carian awam: masukkan No. KP → sijil A4 potret, **Muat Turun PDF** / **Cetak**.
- `admin.html` – halaman admin (log masuk dengan akaun eRPH).
- `assets/supa.js` – sambungan ringkas ke Supabase (REST + Auth). Kunci *publishable* memang selamat diletakkan dalam laman awam; akses data dikawal oleh Row Level Security.
- `assets/sijil-core.js`, `assets/cert.js` – reka bentuk sijil dan penjanaan PDF.
- `assets/*.webp` – logo SK Jalan Bintang, MSSB Miri, SMK Riam, tandatangan Guru Besar, latar logo MSSB.

## Pangkalan data (Supabase)
| Objek | Kegunaan |
|---|---|
| `sijil_acara` | Kejohanan: tajuk, subtajuk, tempat, tarikh, `aktif` |
| `sijil_pemenang` | Pemenang setiap acara (nama, No. KP, sekolah, kategori, kedudukan 1–4) |
| `sijil_admin` | Guru tambahan yang dibenarkan mengurus mySijil |
| `sijil_cari(p_ic)` | Carian awam – padanan **tepat** No. KP sahaja, untuk acara aktif |
| `sijil_is_admin()` | Pentadbir eRPH, atau guru dalam `sijil_admin` |

Orang awam tidak boleh membaca jadual `sijil_pemenang` secara terus; mereka hanya boleh bertanya satu No. KP pada satu masa melalui `sijil_cari`.

## Admin
- Log masuk dengan e-mel dan kata laluan **eRPH**. Semua pentadbir eRPH ialah admin mySijil; pentadbir boleh menambah guru lain melalui **Urus admin**.
- Pilih / cipta acara, ubah tetapan acara (aktif atau tidak).
- Tambah, sunting, padam pemenang; import dari Excel (lajur: Nama Murid, No. KP, Nama Sekolah, Kategori, Kedudukan) – tambah/kemas kini atau ganti semua; **Templat Excel**.
- Cetak semua / PDF semua sijil (ikut tapisan).
- Perubahan disimpan serta-merta.

## Hosting
GitHub Pages: Settings → Pages → `main` / root → `https://destarx.github.io/mysijil/`.
