# StatNusa

Aplikasi web untuk mengambil data dari [BPS Web API](https://webapi.bps.go.id), menampilkannya dalam tabel interaktif yang bisa diedit, mengunduh sebagai CSV, dan membuat visualisasi langsung di [Datawrapper](https://www.datawrapper.de).

---

## Fitur

- **Ambil data BPS** — tempel URL API BPS, data langsung ter-parse ke tabel
- **Gabung data multi-tahun** — otomatis menggabungkan data dari beberapa tahun menjadi satu tabel (untuk URL BPS standar)
- **Ambil semua tahun** — toggle untuk mengambil semua data tahun yang tersedia untuk URL BPS standar
- **Edit nama kolom** — klik header tabel untuk mengganti nama kolom sebelum divisualisasikan
- **Unduh CSV** — ekspor tabel hasil ke file `.csv`
- **Visualisasi Datawrapper** — buat chart langsung dari data dengan satu klik:
   - Pilih tipe chart (bar, grouped bar, stacked, line, multiple lines, area, pie, tabel)
   - Pilih kolom dan baris yang ingin divisualisasikan
   - Pilih palet warna (Biru BPS, Merah–Oranye, Hijau Alam, dll.)
   - Opsi urut dari nilai terbesar ke terkecil (untuk bar chart)
   - Toggle transpose untuk memutar orientasi chart
   - Tambahkan deskripsi dan catatan/footnote
   - Generator deskripsi otomatis menggunakan AI
- **Tanya data dengan AI** — chatbot berbasis Gemma 3 12B (NVIDIA) yang memahami isi tabel dan menjawab pertanyaan dalam bahasa Indonesia:
  - Analisis, ringkasan, dan perbandingan nilai
  - Tombol cepat untuk menghasilkan deskripsi grafik siap pakai untuk Datawrapper (juga tersedia langsung di form Datawrapper)
  - Respons di-render sebagai markdown (bold, list, tabel)
  - Fallback otomatis ke model lain jika model utama tidak tersedia
- **API key aman** — BPS API key, Datawrapper API key, dan NVIDIA API key disimpan di server, tidak terekspos ke browser

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

### 2. NVIDIA API Key

NVIDIA menyediakan akses ke berbagai model AI besar, termasuk Gemma 3 12B, melalui platform NVIDIA API Catalog.

1. Buka [https://integrate.api.nvidia.com](https://integrate.api.nvidia.com) dan buat akun NVIDIA (gratis).
2. Setelah login, buka menu **API Keys** di dashboard.
3. Klik **Generate API Key** dan salin key yang muncul — formatnya diawali `nvapi-`.

> Akun baru NVIDIA API Catalog mendapatkan kredit gratis untuk ujicoba. Pantau penggunaan di dashboard untuk menghindari biaya tak terduga.

---

### 3. Datawrapper API Key

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

Aplikasi membutuhkan tiga environment variable yang disimpan di server (**tidak** di frontend):

| Variabel | Keterangan |
|---|---|
| `BPS_API_KEY` | WebAPI Key dari webapi.bps.go.id |
| `DATAWRAPPER_API_KEY` | API Token dari app.datawrapper.de |
| `NVIDIA_API_KEY` | API Key dari integrate.api.nvidia.com (untuk fitur chat AI) |

Di Replit, tambahkan ketiganya melalui menu **Secrets** (ikon gembok di sidebar kiri). Nama variabel harus persis seperti di tabel di atas.

> Fitur chat AI akan otomatis dinonaktifkan (panel tidak muncul) jika data belum dimuat, tapi tidak ada cek apakah `NVIDIA_API_KEY` dikonfigurasi — error baru muncul saat tombol kirim ditekan pertama kali.

---

## Cara Pakai

### Mengambil Data BPS

1. Buka aplikasi di browser.
2. Salin URL API BPS dari [dokumentasi](https://webapi.bps.go.id/documentation/) — biarkan `WebAPI_KEY` apa adanya.
3. Tempel URL ke kolom input.
4. (Opsional) Centang **Ambil semua tahun** jika ingin mengambil data dari semua tahun yang tersedia untuk URL BPS standar.
5. Klik **Ambil Data**.
6. Data akan tampil dalam bentuk tabel. Klik header kolom untuk mengganti namanya.

### Menggabungkan Data Multi-Tahun

Untuk URL BPS standar (bukan SIMDASI), aplikasi dapat menggabungkan data dari beberapa tahun menjadi satu tabel:

1. Masukkan URL BPS standar (misalnya data per wilayah).
2. Centang opsi **Gabung data multi-tahun** yang muncul di bawah kolom input.
3. Pilih tahun-tahun yang ingin digabungkan.
4. Klik **Ambil Data** — data dari semua tahun terpilih akan digabungkan berdasarkan kolom wilayah/identifier.

> **Catatan:** Fitur ini hanya tersedia untuk format `dataview` (URL BPS standar), tidak untuk SIMDASI atau format lainnya.

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
   - *Line Chart* — satu seri data untuk deret waktu
   - *Multiple Lines* — beberapa seri data untuk deret waktu
   - *Area Chart* — seperti line chart tapi area di bawah diisi
   - *Pie Chart* — cocok untuk komposisi satu baris
   - *Tabel Interaktif* — tabel yang bisa dicari dan diurutkan
4. (Opsional) Centang **Transpose** untuk memutar orientasi chart (menukar baris dan kolom).
5. (Opsional) Centang **Urutkan dari nilai terbesar ke terkecil** untuk bar chart.
6. (Opsional) Buka **Warna Chart** untuk memilih palet warna.
7. (Opsional) Buka **Kolom yang divisualisasikan** untuk memilih/menghapus kolom tertentu.
8. (Opsional) Buka **Baris yang divisualisasikan** untuk memilih wilayah/baris tertentu.
9. Klik **Buat Visualisasi** — chart akan dibuat dan dipublikasikan di Datawrapper.
10. Klik **Edit di Datawrapper** untuk menyempurnakan desain, atau **Lihat Chart Publik** untuk melihat hasilnya.

> **Tips Column Chart:** Untuk tipe Column Chart (vertikal), pilih maksimal 5–10 baris saja agar chart tidak terlalu padat. Untuk semua provinsi (34 baris), gunakan Grouped/Stacked Bars (horizontal).

> **AI Description Generator:** Di dalam form Datawrapper, terdapat tombol untuk menghasilkan deskripsi chart secara otomatis menggunakan AI. Cukup klik tombol tersebut dan deskripsi akan terisi otomatis di field **Deskripsi**.

### Tanya Data dengan AI

Setelah data tampil, gulir ke bagian **Tanya Data dengan AI** (di bawah panel Datawrapper) dan klik untuk membuka panel chat.

**Tombol cepat yang tersedia saat panel pertama dibuka:**

| Tombol | Fungsi |
|---|---|
| ✦ Buat deskripsi untuk grafik Datawrapper | Menghasilkan 2 kalimat deskripsi siap pakai untuk field *Deskripsi* di panel Datawrapper (juga tersedia langsung di form Datawrapper) |
| Mana nilai tertinggi dan terendah? | Menemukan nilai ekstrem dalam data |
| Berikan ringkasan data ini | Ringkasan umum seluruh dataset |
| Apa tren yang terlihat? | Analisis pola atau tren |
| Bandingkan 5 nilai teratas | Perbandingan ranking teratas |

Atau ketik pertanyaan sendiri di kolom input. Tekan **Enter** untuk kirim, **Shift+Enter** untuk baris baru.

**Catatan teknis:**
- Model utama: `google/gemma-3-12b-it`. Jika model sedang tidak tersedia (DEGRADED), sistem otomatis mencoba `meta/llama-3.1-70b-instruct` lalu `meta/llama-3.1-8b-instruct`.
- Maksimal 150 baris pertama dari tabel dikirim sebagai konteks ke model.
- Klik ikon **×** di kiri input untuk menghapus seluruh percakapan.

---

## Arsitektur

```
Browser (React + Vite)
    │
    ├─ POST /api/bps/fetch       ─► Express API Server ─► BPS Web API
    │                                  (sisipkan BPS_API_KEY)
    │
    ├─ POST /api/datawrapper/*   ─► Express API Server ─► Datawrapper API
    │                                  (gunakan DATAWRAPPER_API_KEY)
    │
    └─ POST /api/chat            ─► Express API Server ─► NVIDIA API (Gemma 3 / Llama)
         streaming SSE ◄──────────       (gunakan NVIDIA_API_KEY)
```

- **Frontend** (`artifacts/bps-extractor`): React + Vite, Tailwind CSS
- **Backend** (`artifacts/api-server`): Express + TypeScript, berjalan di port 8080
- API key tidak pernah dikirim ke browser — semua request ke BPS, Datawrapper, dan NVIDIA dilakukan dari server
- Chat menggunakan Server-Sent Events (SSE) untuk streaming respons kata per kata

---

## Format API BPS yang Didukung

| Format | Keterangan |
|---|---|
| `dataview` | Format tabel BPS standar (paling umum) — mendukung penggabungan multi-tahun dan ambil semua tahun |
| `SIMDASI` | Data Sistem Informasi Manajemen Statistik |
| `list` | Format daftar domain/wilayah |

Format lain akan tetap ditampilkan sebagai JSON mentah.

---

## Lisensi

Data BPS tersedia untuk publik sesuai [Ketentuan Penggunaan BPS](https://www.bps.go.id/id/website-information/terms-and-conditions).
Visualisasi dibuat menggunakan [Datawrapper](https://www.datawrapper.de) — chart yang dibuat adalah milik akun Datawrapper pengguna.
