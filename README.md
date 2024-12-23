# Chat API dengan Gemini AI

API backend untuk aplikasi chat yang menggunakan Google's Gemini AI. Sistem ini mendukung manajemen pengguna dan riwayat chat dengan penyimpanan MongoDB.

## Fitur

- 🤖 Integrasi dengan Gemini AI untuk respons chat
- 👤 Sistem autentikasi (register & login)
- 💬 Manajemen riwayat chat
- 📝 Pengelolaan judul chat
- 🗑️ Penghapusan chat
- 🔒 Keamanan berbasis pengguna

## Prasyarat

- Node.js (v14 atau lebih baru)
- MongoDB
- API Key Gemini AI

## Instalasi

1. Clone repositori ini

```bash
git clone [url-repositori]
cd [nama-folder]
```

2. Install dependensi

```bash
npm install
```

3. Buat file `.env` di root folder dan isi dengan:

```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=your_mongodb_connection_string
```

4. Jalankan server

```bash
node index.js
```

## Endpoint API

### Autentikasi

#### Register User

```http
POST /api/register
Content-Type: application/json
{
"username": "string",
"password": "string"
}
```

#### Login

```http
POST /api/login
Content-Type: application/json
{
"username": "string",
"password": "string"
}
```

### Manajemen Chat

#### Membuat/Melanjutkan Chat

```http
POST /api/chat
Content-Type: application/json
{
"idChat": "string",
"question": "string",
"username": "string",
"title": "string" (opsional)
}
```

#### Mengubah Judul Chat

```http
PUT /api/chat/title
Content-Type: application/json
{
"idChat": "string",
"title": "string",
"username": "string"
}
```

#### Mendapatkan Daftar Chat User

```http
GET /api/user/chats/:username
```

#### Menghapus Chat

```http
DELETE /api/chat/:idChat
Content-Type: application/json
{
"username": "string"
}
```

## Struktur Database

### User Collection

```javascript
{
username: String,
password: String (hashed),
chats: [String]
}
```

### Chat Collection

```javascript
{
idChat: String,
title: String,
history: Array,
timestamp: Date
}
```

## Keamanan

- Password di-hash menggunakan bcrypt
- Validasi kepemilikan chat untuk setiap operasi
- Sanitasi input untuk semua endpoint

## Dependencies

- express
- mongoose
- @google/generative-ai
- bcrypt
- dotenv

## Pengembangan Selanjutnya

- Implementasi JWT untuk autentikasi
- Rate limiting
- Caching untuk optimasi performa
- Logging yang lebih baik
- Unit testing

## Lisensi

[Masukkan lisensi proyek Anda di sini]
