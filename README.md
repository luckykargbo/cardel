# 🚘 SaloneAutoLink

**Sierra Leone's Premier Luxury Car Dealership**

A 100% real, fully functional luxury automotive dealership website backed by a live SQLite database, Node.js/Express API, and a complete admin control suite.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server (DB auto-initializes on first run)
npm start
```

Then open:
- **Showroom** → [http://localhost:3000](http://localhost:3000)
- **Admin Portal** → [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🔐 Default Admin Credentials

| Field    | Value                          |
|----------|-------------------------------|
| Email    | `admin@saloneautolink.com`    |
| Password | `Onyx2026!`                   |

> ⚠️ Change the password immediately via **Settings → Change Password** after first login.

---

## 🏗️ Architecture

```
cardel/
├── server.js              # Express API server
├── database/
│   └── db.js              # sql.js SQLite engine (pure JS, no compilation)
├── middleware/
│   └── auth.js            # JWT authentication
├── uploads/               # Uploaded vehicle photos
├── css/
│   ├── style.css          # Public site styles
│   └── admin.css          # Admin dashboard styles
├── js/
│   ├── main.js            # Public site — live API integration
│   └── admin.js           # Admin suite — live API integration
├── index.html             # Public showroom
└── admin.html             # Admin control suite
```

---

## 📡 API Endpoints

### Public
| Method | Endpoint              | Description                         |
|--------|-----------------------|-------------------------------------|
| GET    | `/api/vehicles`       | List vehicles (with filters)        |
| GET    | `/api/vehicles/:id`   | Get single vehicle                  |
| POST   | `/api/inquiries`      | Submit a purchase inquiry           |
| POST   | `/api/financing`      | Submit a financing application      |
| POST   | `/api/newsletter`     | Subscribe to newsletter             |

### Admin (JWT required)
| Method | Endpoint                       | Description                |
|--------|--------------------------------|----------------------------|
| POST   | `/api/auth/login`              | Admin login                |
| GET    | `/api/auth/me`                 | Get current admin profile  |
| PATCH  | `/api/auth/password`           | Change password            |
| POST   | `/api/vehicles`                | Add vehicle (+ image upload)|
| PUT    | `/api/vehicles/:id`            | Update vehicle             |
| PATCH  | `/api/vehicles/:id/status`     | Quick status update        |
| PATCH  | `/api/vehicles/:id/featured`   | Toggle featured flag       |
| DELETE | `/api/vehicles/:id`            | Delete vehicle             |
| GET    | `/api/inquiries`               | List all inquiries         |
| PATCH  | `/api/inquiries/:id/status`    | Update inquiry status      |
| DELETE | `/api/inquiries/:id`           | Delete inquiry             |
| GET    | `/api/financing`               | List financing applications|
| PATCH  | `/api/financing/:id/status`    | Update finance status      |
| DELETE | `/api/financing/:id`           | Delete finance application |
| GET    | `/api/stats`                   | Live dashboard metrics     |
| GET    | `/api/newsletter`              | List subscribers           |
| POST   | `/api/upload`                  | Upload images standalone   |

---

## ✨ Features

### Public Showroom (`index.html`)
- **Live Vehicle Catalog** — fetched dynamically from SQLite
- **Smart Filtering** — Brand, Year, Fuel, Body, Transmission, Price, Mileage, Colour, Location
- **Quick View Modal** — detailed specs, multi-image gallery, full pricing
- **WhatsApp Enquiry** — pre-filled vehicle details
- **Send Enquiry Form** — saves directly to database
- **Financing Application** — full form stored in database
- **Favourites** — saved to localStorage
- **Newsletter Subscription** — emails stored in database

### Admin Control Suite (`admin.html`)
- **Secure JWT Login** — bcrypt-hashed passwords
- **Executive Dashboard** — live stats: inventory, enquiries, financing, subscribers
- **Full Inventory CRUD** — Add, Edit, Delete vehicles with multi-image upload
- **Enquiries Management** — view, mark as read/responded, WhatsApp reply
- **Financing Applications** — review, approve/reject applications
- **CSV Export** — download full inventory
- **Password Management** — real password update via API
- **Dark/Light Theme** — persistent theme preference

---

## 🛡️ Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Backend     | Node.js + Express             |
| Database    | SQLite via sql.js (pure JS)   |
| Auth        | JWT + bcryptjs                |
| File Upload | multer                        |
| Frontend    | Vanilla HTML/CSS/JS           |
| Fonts       | Google Fonts (Outfit + Plus Jakarta Sans) |

---

## 📄 License

© 2025 SaloneAutoLink Executive Ltd. Sierra Leone. All Rights Reserved.
