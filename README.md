# StatNusa

Aplikasi web untuk mengambil data dari [BPS Web API](https://webapi.bps.go.id), menampilkannya dalam tabel interaktif yang bisa diedit, mengunduh sebagai CSV, dan membuat visualisasi langsung di [Datawrapper](https://www.datawrapper.de).

---

## Fitur

- **Ambil data BPS** — tempel URL API BPS, data langsung ter-parse ke tabel
- **Edit nama kolom** — klik header tabel untuk mengganti nama kolom sebelum divisualisasikan
- **Unduh CSV** — ekspor tabel hasil ke file `.csv`
- **Visualisasi Datawrapper** — buat chart langsung dari data dengan satu klik:
  - Pilih tipe chart (bar, grouped bar, stacked, line, area, pie, tabel)
  - Pilih kolom dan baris yang ingin divisualisasikan
  - Pilih palet warna (Biru BPS, Merah–Oranye, Hijau Alam, dll.)
  - Opsi urut dari nilai terbesar ke terkecil (untuk bar chart)
  - Tambahkan deskripsi dan catatan/footnote
- **API key aman** — BPS API key dan Datawrapper API key disimpan di server, tidak terekspos ke browser

---

## Mendapatkan API Key

### 1. BPS Web API Key

BPS menyediakan akses API gratis setelah mendaftar akun.

1. Buka [https://webapi.bps.go.id](https://webapi.bps.go.id) dan klik **Daftar** (pojok kanan atas).
2. Isi formulir pendaftaran dengan email aktif, lalu verifikasi email.
3. Setelah login, buka menu **Profil** atau **API Key** di dashboard.
4. Salin **WebAPI Key** yang ditampilkan — formatnya berupa string alfanumerik panjang.

> API key BPS bersifat gratis dan tidak ada batas kuota yang ketat untuk penggunaan normal.

**Cara menggunakan URL BPS:**

URL API BPS mengandung placeholder `WebAPI_KEY` di bagian akhir, misalnya:

```
https://webapi.bps.go.id/v1/api/view/domain/all/model/wilayah/key/WebAPI_KEY
```

Di aplikasi ini, **tidak perlu mengganti `WebAPI_KEY`** — cukup tempel URL apa adanya, server yang akan mengganti placeholder dengan API key yang sebenarnya secara otomatis.

Untuk menemukan URL yang diinginkan, buka [dokumentasi BPS API](https://webapi.bps.go.id/documentation/) dan salin contoh URL dari endpoint yang relevan.

---

### 2. Datawrapper API Key

Datawrapper menyediakan akun gratis dengan 10.000 views/bulan per chart.

1. Buka [https://app.datawrapper.de/register](https://app.datawrapper.de/register) dan daftarkan akun (gratis).
2. Setelah login, buka **Settings** → **API Tokens** (atau langsung ke [https://app.datawrapper.de/account/api-tokens](https://app.datawrapper.de/account/api-tokens)).
3. Klik **Create new token**.
4. Beri nama token (misalnya `StatNusa`), lalu centang permission:
   - `chart:read`
   - `chart:write`
   - `chart:delete` (opsional, untuk membersihkan chart uji coba)
5. Klik **Create** dan salin token yang ditampilkan — token **hanya ditampilkan sekali**.

> Akun Datawrapper gratis mendukung pembuatan chart tanpa batas, dengan 10.000 embed views/bulan per chart secara gratis.

---

## Konfigurasi

Aplikasi membutuhkan dua environment variable yang disimpan di server (**tidak** di frontend):

| Variabel | Keterangan |
|---|---|
| `BPS_API_KEY` | WebAPI Key dari webapi.bps.go.id |
| `DATAWRAPPER_API_KEY` | API Token dari app.datawrapper.de |

Di Replit, tambahkan keduanya melalui menu **Secrets** (ikon gembok di sidebar kiri). Nama variabel harus persis seperti di tabel di atas.

---

## Cara Pakai

### Mengambil Data BPS

1. Buka aplikasi di browser.
2. Salin URL API BPS dari [dokumentasi](https://webapi.bps.go.id/documentation/) — biarkan `WebAPI_KEY` apa adanya.
3. Tempel URL ke kolom input dan klik **Ambil Data**.
4. Data akan tampil dalam bentuk tabel. Klik header kolom untuk mengganti namanya.

**Contoh URL yang bisa dicoba:**

```
# Daftar semua domain/wilayah BPS
https://webapi.bps.go.id/v1/api/domain/type/all/key/WebAPI_KEY

# Data SIMDASI (contoh: Perceraian Menurut Faktor)
https://webapi.bps.go.id/v1/api/interoperabilitas/datasource/simdasi/id/25/tahun/2025/id_tabel/aWhSR0ViS3hxc1hWZlZEbExjNVpDUT09/wilayah/0000000/key/WebAPI_KEY
```

### Mengunduh CSV

Setelah data tampil, klik tombol **Unduh CSV** di atas tabel untuk menyimpan data ke file `.csv`.

### Membuat Visualisasi di Datawrapper

1. Setelah data tampil, gulir ke bagian **Buat Visualisasi di Datawrapper**.
2. Isi **judul chart** (otomatis terisi dari judul tabel BPS).
3. Pilih **tipe chart**:
   - *Bar Chart (1 seri)* — satu kolom data, cocok untuk perbandingan antar wilayah
   - *Grouped Bars* — beberapa kolom data ditampilkan berdampingan per baris
   - *Stacked Bars* — beberapa kolom data ditumpuk per baris
   - *Multiple Lines* — cocok untuk data deret waktu
   - *Area Chart* — seperti line chart tapi area di bawah diisi
   - *Pie Chart* — cocok untuk komposisi satu baris
   - *Tabel Interaktif* — tabel yang bisa dicari dan diurutkan
4. (Opsional) Centang **Urutkan dari nilai terbesar ke terkecil** untuk bar chart.
5. (Opsional) Buka **Warna Chart** untuk memilih palet warna.
6. (Opsional) Buka **Kolom yang divisualisasikan** untuk memilih/menghapus kolom tertentu.
7. (Opsional) Buka **Baris yang divisualisasikan** untuk memilih wilayah/baris tertentu.
8. Klik **Buat Visualisasi** — chart akan dibuat dan dipublikasikan di Datawrapper.
9. Klik **Edit di Datawrapper** untuk menyempurnakan desain, atau **Lihat Chart Publik** untuk melihat hasilnya.

> **Tips Column Chart:** Untuk tipe Column Chart (vertikal), pilih maksimal 5–10 baris saja agar chart tidak terlalu padat. Untuk semua provinsi (34 baris), gunakan Grouped/Stacked Bars (horizontal).

---

## Arsitektur

```
Browser (React + Vite)
    │
    ├─ GET/POST /api/bps/*       ─► Express API Server ─► BPS Web API
    │                                  (sisipkan BPS_API_KEY)
    │
    └─ POST /api/datawrapper/*   ─► Express API Server ─► Datawrapper API
                                       (gunakan DATAWRAPPER_API_KEY)
```

- **Frontend** (`artifacts/bps-extractor`): React + Vite, Tailwind CSS, shadcn/ui
- **Backend** (`artifacts/api-server`): Express + TypeScript, berjalan di port 8080
- API key tidak pernah dikirim ke browser — semua request ke BPS dan Datawrapper dilakukan dari server

---

## Format API BPS yang Didukung

| Format | Keterangan |
|---|---|
| `dataview` | Format tabel BPS standar (paling umum) |
| `SIMDASI` | Data Sistem Informasi Manajemen Statistik |
| `list` | Format daftar domain/wilayah |

Format lain akan tetap ditampilkan sebagai JSON mentah.

---

## Lisensi

Data BPS tersedia untuk publik sesuai [Ketentuan Penggunaan BPS](https://www.bps.go.id/id/website-information/terms-and-conditions).
Visualisasi dibuat menggunakan [Datawrapper](https://www.datawrapper.de) — chart yang dibuat adalah milik akun Datawrapper pengguna.
