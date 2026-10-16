# MyWahana HSE

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white)

Aplikasi Health, Safety & Environment (K3) PT Wahana Baratama Mining. MyWahana HSE menggantikan formulir K3 berbasis kertas dengan aplikasi web yang dapat diinstal di ponsel (PWA), sehingga pekerja dapat melapor langsung dari lapangan dan tim HSE dapat memantau serta menindaklanjuti data dari semua site.

## Fitur Utama

- **Bugar Selamat (Fit to Work)** — pekerja melaporkan kondisi fisik sebelum bekerja (jam tidur, sakit, obat, alkohol, dll.). Status kelayakan (layak / catatan / dilarang) dihitung otomatis.
- **Laporan Bahaya** — pelaporan potensi bahaya dengan PIC, alur review, status tindakan, dan lampiran.
- **SAP (Safety Accountability Program)** — Observasi Keselamatan, Komunikasi JSA, serta Inspeksi Tambang, Workshop, Kantor, dan Mess lengkap dengan re-inspeksi.
- **Assessment & HR Assessment** — kuis berbatas waktu dengan penilaian otomatis dan feedback.
- **Gamifikasi** — streak harian, badge, dan target partisipasi per level jabatan.
- **Panel Admin** — kelola user, site, target, dan bank soal; export Excel/PDF; hapus data per batch atau rentang tanggal.
- **Notifikasi** — inbox dalam aplikasi dan Web Push, termasuk pengingat harian otomatis.
- **Multi-site** — data dan akses dibatasi per site.

## Akun Pengguna

Pendaftaran mandiri dinonaktifkan. Akun hanya dibuat oleh admin IT melalui **Admin → Users** (input manual atau import Excel). Pengguna login menggunakan NIK.

## Tech Stack

| Layer      | Teknologi |
|------------|-----------|
| Backend    | Laravel 12 (PHP 8.3+), Laravel Fortify (login, 2FA, passkey) |
| Frontend   | React 19 + Inertia.js v3 + TypeScript |
| Styling    | Tailwind CSS v4 |
| Database   | MySQL 8.0 |
| Queue      | Laravel Queue (database driver) |
| Notifikasi | Web Push (VAPID) |
| Dokumen    | Export PDF & Excel |

## Struktur Proyek

```
app/            Business logic (Models, Controllers, Notifications, Console commands)
resources/js/   Frontend React + Inertia (pages, components)
routes/         Definisi route dan jadwal (console.php)
database/       Migration, factory, seeder
tests/          Pest test suite
```

## Instalasi

### Prasyarat

- PHP 8.3+ dan Composer
- Node.js & npm
- MySQL 8.0

### Langkah

```bash
composer install
npm install

cp .env.example .env
php artisan key:generate
php artisan webpush:vapid      # isi VAPID_* di .env
# sesuaikan kredensial database di .env

php artisan migrate --seed
php artisan storage:link
npm run build
```

Seeder membuat akun admin awal dengan NIK `ADM-001`. Segera ganti password setelah login pertama.

### Development

```bash
composer run dev
```

Perintah di atas menjalankan server Laravel, queue worker, dan Vite secara bersamaan.

### Produksi

Jalankan queue worker dan scheduler (`php artisan schedule:run` setiap menit) untuk pengingat harian, kedaluwarsa assessment, dan pembersihan data lama.

## Testing & Code Style

```bash
php artisan test --compact
vendor/bin/pint
npm run lint:check
npm run types:check
```
