# Prestige Motors — Luxury Automobile Showroom & Admin Suite

> **Prestige Motors** is an executive luxury automotive dealership website and administration portal featuring a public client showroom and a **Security by Obscurity** hidden administrative login gateway with session cookie authentication and route protection middleware.

---

## 🔒 Security & Architecture Features

### 1. Hidden Custom Login Route (`/app-admin-gate`)
- The administrative login page is accessible **exclusively** via the secret URL route:
  ```
  admin.html#/app-admin-gate
  ```
- **Zero Public Visibility**: No "Login", "Admin", or "Dealer Portal" links exist anywhere on the public client showroom (`index.html`) header, navbar, body, or footer.

### 2. Route Protection Middleware (Auth Guard)
- The main administration dashboard route (`admin.html#/admin-dashboard`) is strictly protected by client-side routing middleware (`checkAuthAndRoute()`).
- **Unauthenticated Access Block**: If an unauthenticated user attempts to access `admin.html#/admin-dashboard` or guess common paths like `/admin` or `/login` directly, the middleware blocks access and renders a 404 "Page Not Found" screen.

### 3. Session Cookie Authentication
- **Secure Cookies**: Upon successful login, the system creates a 24-hour auth cookie (`pm_session_token`).
- **Logout Flow**: Triggering "Logout" clears the session cookie and redirects the administrator back to the public showroom homepage (`index.html`).

---

## 🚘 Project Structure

```
.
├── index.html            # Public Luxury Dealership Showroom
├── admin.html            # Admin Portal Shell (Login Gate, 404 Screen, Dashboard)
├── css/
│   ├── style.css         # Public Showroom Stylesheet
│   └── admin.css         # Admin Portal Stylesheet & Dark Mode Variables
├── js/
│   ├── main.js           # Public Showroom Logic (Filters, Search, Favourites)
│   └── admin.js          # Admin Suite Logic (Auth Cookie, Route Guard, Inventory CRUD)
└── README.md             # Project Documentation
```

---

## 🔑 Administrative Demo Credentials

- **Hidden Gate URL**: `admin.html#/app-admin-gate`
- **Email**: `admin@prestigemotors.com`
- **Password**: `Onyx2026!`

---

## 🚀 Getting Started

### Local Development Server

Run a local HTTP server to launch the project:

```bash
# Option A: Using Python (Built-in)
python -m http.server 8080

# Option B: Using Node.js / npx
npx serve -l 8080 .
```

### Accessing Local Routes

- **Public Showroom**: [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Hidden Admin Gate**: [http://localhost:8080/admin.html#/app-admin-gate](http://localhost:8080/admin.html#/app-admin-gate)
- **Protected Dashboard**: [http://localhost:8080/admin.html#/admin-dashboard](http://localhost:8080/admin.html#/admin-dashboard)

---

## 📄 License

© 2026 Prestige Motors Executive Ltd. All Rights Reserved.
