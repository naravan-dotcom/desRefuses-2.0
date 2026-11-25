# desRefusés 2.0 🎨✨
**Platform Showcase Karya Seni Digital Tanpa Dewan Juri (*Salon des Refusés*)**

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · NextAuth v5 (JWT) · PostgreSQL (`pg`)

---

**desRefusés 2.0** adalah platform *art showcase* multi-peran yang membalik konsep salon konvensional: semua karya yang diunggah kreator tampil langsung di galeri publik tanpa antrean seleksi atau sensor selera dewan juri. Apresiasi tumbuh secara organik dari komunitas melalui *likes*, komentar, *favorites*, *collections*, dan *following*, sementara kurator berperan menyelenggarakan tantangan (*challenge*) sukarela dan admin menjaga etika komunitas melalui moderasi laporan.

---

## 📑 Daftar Isi
- [✨ Fitur Utama & Implementasi Teknis](#-fitur-utama--implementasi-teknis)
- [👥 Peran Pengguna (Multi-Role)](#-peran-pengguna-multi-role)
- [📐 Arsitektur Sistem](#-arsitektur-sistem)
- [🗄️ Skema Basis Data (PostgreSQL)](#️-skema-basis-data-postgresql)
- [📂 Struktur Direktori](#-struktur-direktori)
- [🌐 Route Handlers & Server Actions](#-route-handlers--server-actions)
- [🚀 Panduan Instalasi Lokal](#-panduan-instalasi-lokal)
- [🧪 Linting & Build](#-linting--build)

---

## ✨ Fitur Utama & Implementasi Teknis

1. **Galeri Tanpa Juri & Eksplorasi Publik**
   - Karya langsung tampil di `/home` dan `/gallery` setelah diunggah oleh Member.
   - Pencarian berdasarkan judul, deskripsi, tag, atau kreator, serta filter kategori dan pengurutan (*Paling diapresiasi* / *Terbaru*).
2. **Autentikasi & Proteksi Rute Berbasis Peran (`NextAuth v5` + `src/proxy.js`)**
   - Menggunakan **Auth.js / NextAuth v5** (`Credentials` provider + strategi sesi **JWT**) pada `src/auth.js` dengan sinkronisasi status pengguna terbaru dari PostgreSQL.
   - `src/proxy.js` menjaga akses `/dashboard/*`, `/pending`, dan `/suspended` sesuai peran (`admin`, `member`, `curator`) serta status akun (`approved`, `pending`, `rejected`, `suspended`).
3. **Manajemen Karya, Tantangan & Validasi Server-Side (`pg` Raw SQL)**
   - Upload media karya dan banner tantangan ke penyimpanan lokal server melalui `src/lib/upload.js`.
   - Aturan bisnis penting ditegakkan di backend dan constraint PostgreSQL: batas 1 submisi per Member per tantangan, 1 karya per peringkat, dan pemilihan maksimal 3 pemenang (`rank` 1–3) yang hanya dibuka setelah tanggal selesai tantangan.
4. **Interaksi Komunitas & Moderasi Etika**
   - **Member** dapat menyukai karya (*like*), menyimpan ke *favorites*, mengelompokkan karya ke dalam *collections/moodboards*, mengikuti (*follow*) kreator lain, menulis/menghapus komentar, serta melaporkan karya atau komentar (maksimal 1 laporan per target per akun).
   - **Admin** meninjau antrean laporan di `/dashboard/moderation` dengan aksi *Dismiss Report* atau *Take Down*.

---

## 👥 Peran Pengguna (Multi-Role)

| Peran | Hak Akses & Fitur |
|---|---|
| **Public User (Guest)** | Menjelajahi beranda, galeri, detail karya, profil kreator, dan detail tantangan tanpa login. |
| **Member (Kreator)** | CRUD karya sendiri, interaksi (*like*, *favorites*, *collections*, *follow*, komentar), melaporkan karya/komentar, mengikuti/menarik submisi tantangan, kelola profil publik & akun. |
| **Curator** | Mendaftar dengan status awal `pending` (menunggu persetujuan Admin). Setelah disetujui, dapat CRUD tantangan, melihat karya submisi, dan memilih hingga 3 pemenang setelah tantangan berakhir. |
| **Admin** | Verifikasi pendaftaran Curator (`approved`/`rejected`), manajemen pengguna, CRUD kategori karya, moderasi laporan (*Dismiss*/*Take Down*), dan melihat statistik agregasi platform. |

---

## 📐 Arsitektur Sistem

Aplikasi dibangun menggunakan arsitektur **Fullstack Next.js App Router**:
- **Server Components** membaca data langsung dari PostgreSQL (`src/lib/db.js`) untuk halaman publik dan dashboard.
- **Client Components (`*-client.jsx`)** menangani interaktivitas UI, modal popup, filter, dan notifikasi toast.
- **Server Actions (`actions.js`)** dan **Route Handlers (`/api/*`)** memproses mutasi data, autentikasi, upload file, dan validasi otorisasi/waktu di sisi server.

```text
Browser (React 19 + Tailwind v4)
   ├── Navigasi & Proteksi Rute ──▶ src/proxy.js (JWT check via next-auth/jwt)
   ├── Login / Register        ──▶ /api/auth/[...nextauth] & /api/register
   ├── Server Components       ──▶ Pool (pg) ──▶ PostgreSQL
   └── Mutasi Data             ──▶ Server Actions ("use server") ──▶ PostgreSQL
```

---

## 🗄️ Skema Basis Data (PostgreSQL)

Skema didefinisikan pada [`init.sql`](./init.sql) menggunakan 12 tabel ternormalisasi:

- **Pengguna & Relasi**: `users` (`role`, `status`, `links JSONB`), `follows` (`UNIQUE(member_id, target_id)`).
- **Karya & Kategori**: `categories` (`name` & `slug` unik), `artworks` (`tags TEXT[]`, `likes_count`).
- **Interaksi & Koleksi**: `likes`, `favorites`, `collections`, `collection_items`, `comments`.
- **Moderasi**: `reports` (`type IN ('artwork', 'comment')`, `status IN ('open', 'dismissed', 'resolved')`, `UNIQUE(type, target_id, reporter_id)`).
- **Tantangan & Submisi**: `challenges` (`CHECK(end_date >= start_date)`), `submissions` (`rank CHECK(rank IN (1, 2, 3))`, `UNIQUE(challenge_id, member_id)`, `UNIQUE(challenge_id, artwork_id)`, `UNIQUE(challenge_id, rank)`).

---

## 📂 Struktur Direktori

```text
desrefuses2.0/
├── init.sql                        # Skema tabel PostgreSQL & data seed awal
├── next.config.mjs                 # Konfigurasi Next.js
├── package.json                    # Dependensi & skrip proyek
└── src/
    ├── auth.js                     # Konfigurasi NextAuth v5 (Credentials + JWT)
    ├── proxy.js                    # Route guard (/dashboard, /pending, /suspended)
    ├── app/
    │   ├── api/
    │   │   ├── auth/[...nextauth]/ # Endpoint autentikasi NextAuth
    │   │   └── register/           # Endpoint registrasi Member & Curator
    │   ├── artwork/[id]/           # Detail karya, interaksi, komentar & laporan
    │   ├── challenges/             # Daftar & detail tantangan publik
    │   ├── creator/[id]/           # Profil publik kreator & tombol follow
    │   ├── dashboard/              # Panel Member, Curator & Admin (+ actions.js)
    │   │   ├── account/            # Pengaturan email & password
    │   │   ├── artworks/           # CRUD karya Member
    │   │   ├── categories/         # CRUD kategori Admin
    │   │   ├── challenges/         # CRUD tantangan & pilih pemenang Curator
    │   │   ├── curators/           # Verifikasi Curator Admin
    │   │   ├── favorites/          # Karya favorit & moodboard/collections
    │   │   ├── moderation/         # Antrean moderasi laporan Admin
    │   │   ├── profile/            # Edit profil publik & avatar
    │   │   ├── submissions/        # Riwayat submisi tantangan Member
    │   │   └── users/              # Manajemen pengguna Admin
    │   ├── gallery/                # Halaman jelajah galeri publik
    │   ├── home/                   # Beranda utama, kronologi, prinsip & galeri
    │   ├── login/                  # Halaman masuk
    │   ├── register/               # Halaman daftar (Member / Curator)
    │   ├── pending/                # Halaman status Curator pending / rejected
    │   └── suspended/              # Halaman informasi akun disuspend
    ├── components/
    │   ├── artwork/                # Komponen kartu karya
    │   ├── auth/                   # AuthShell & SessionProvider
    │   ├── challenge/              # Komponen kartu tantangan
    │   ├── dashboard/              # Layout, shell & navigasi dashboard
    │   ├── shell/                  # Navbar, Footer, SiteShell & PageProgress
    │   └── ui/                     # Modal, Toast, ConfirmDialog, StatusBadge, dll.
    ├── hooks/                      # Custom hooks (useErrorNotify)
    └── lib/                        # db.js, password.js, upload.js, access.js, seed.js
```

---

## 🌐 Route Handlers & Server Actions

### Route Handlers (`/api/*`)
| Endpoint | Method | Deskripsi |
|---|---|---|
| `/api/auth/[...nextauth]` | `GET`, `POST` | Menangani login, logout, dan sesi JWT NextAuth v5 |
| `/api/register` | `POST` | Mendaftarkan akun `member` (`approved`) atau `curator` (`pending`) |

### Server Actions (`"use server"`)
- `src/app/artwork/[id]/actions.js` — Toggle *like*, *favorite*, tambah/hapus komentar, kirim laporan.
- `src/app/challenges/actions.js` — Submit dan tarik (*withdraw*) karya dari tantangan.
- `src/app/pending/actions.js` — Hapus akun bagi Curator yang pendaftarannya ditolak.
- `src/app/dashboard/**/actions.js` — Mutasi CRUD karya, tantangan, pemenang, kategori, moderasi laporan, manajemen user/kurator, koleksi favorit, profil, dan akun.

---

## 🚀 Panduan Instalasi Lokal

### Prasyarat
- **Node.js** (v18+)
- **PostgreSQL** (lokal atau cloud seperti Neon / Supabase)

### 1. Masuk ke Folder Proyek & Install Dependensi
```bash
cd desrefuses2.0
npm install
```

### 2. Konfigurasi Variabel Lingkungan
Buat file `.env.local` di dalam folder `desrefuses2.0/`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/desrefuses
AUTH_SECRET=ganti_dengan_secret_acak_minimal_32_karakter
```

### 3. Inisialisasi Skema & Seed PostgreSQL
Jalankan file `init.sql` ke database PostgreSQL Anda:
```bash
psql -U postgres -d desrefuses -f init.sql
```

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000) 🎉

### Akun Demo Bawaan (`init.sql`)
| Peran | Email | Password | Status |
|---|---|---|---|
| Admin | `admin@desrefuses.id` | `admin123` | `approved` |
| Member | `sora@desrefuses.id` | `member123` | `approved` |
| Curator | `musee@desrefuses.id` | `curator123` | `approved` |
| Curator | `dao@desrefuses.id` | `curator123` | `pending` |
| Curator | `nol@desrefuses.id` | `curator123` | `rejected` |

---

## 🧪 Linting & Build

- **Linting**: Jalankan pemeriksaan ESLint dengan:
  ```bash
  npm run lint
  ```
- **Production Build**:
  ```bash
  npm run build
  npm run start
  ```

---

Dibuat untuk Final Proyek Lab Web — **desRefusés 2.0**
© 2026 — *Unjuried since 1863*
