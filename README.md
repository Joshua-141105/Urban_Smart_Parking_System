# 🅿️ ParkSmart - Smart Parking Management System

A full-stack smart parking management system built with **Spring Boot** (Backend) and **React + Vite** (Frontend). The system enables real-time parking slot booking, navigation, and management across 50+ Tamil Nadu cities.

---

## ✨ Features

### For Drivers
- 🔍 **Find Parking** - Search and discover nearby parking lots with real-time availability
- 📍 **Live Navigation** - Turn-by-turn directions using OpenStreetMap/OSRM
- 📅 **Book & Extend** - Reserve slots in advance, extend bookings on-the-go
- ⭐ **Rate & Review** - Share feedback after completed bookings
- 🧾 **Download Receipts** - Printable payment receipts for completed bookings
- 🔔 **Real-time Notifications** - WebSocket-powered occupancy updates

### For Parking Managers
- 🏢 **Lot Management** - Create, edit, and delete parking lots and spaces
- 📊 **Dashboard** - View occupancy stats and booking analytics
- 🚗 **Space Monitoring** - Real-time slot status tracking

### For System Admins
- 👥 **User Management** - Create, activate, and deactivate managers/city admins
- 📈 **Analytics** - Platform-wide statistics and occupancy predictions
- ⚙️ **Settings** - System configuration and preferences

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, React Router, Recharts, Leaflet Maps |
| **Backend** | Spring Boot 3, Spring Security, Spring Data JPA |
| **Database** | MySQL |
| **Auth** | JWT (JSON Web Tokens) |
| **Real-time** | WebSocket (STOMP) |
| **Maps** | OpenStreetMap + OSRM for routing |

---

## 📁 Project Structure

```
Parking System/
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── api/             # Axios configuration
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # Auth & WebSocket context
│   │   ├── layout/          # Page layouts
│   │   └── pages/           # Route pages
│   │       ├── admin/       # Admin pages
│   │       ├── driver/      # Driver pages
│   │       └── manager/     # Manager pages
│   └── package.json
│
└── parkingsystem/           # Spring Boot Backend
    ├── src/main/java/com/example/parkingsystem/
    │   ├── config/          # App configuration & DataSeeder
    │   ├── controller/      # REST API controllers
    │   ├── dto/             # Data Transfer Objects
    │   ├── entity/          # JPA Entities
    │   ├── repository/      # Spring Data repositories
    │   ├── security/        # JWT & Security config
    │   └── service/         # Business logic
    └── pom.xml
```

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+**
- **Node.js 18+**
- **MySQL 8+**
- **Maven**

### Database Setup
```sql
CREATE DATABASE parking_system;
```

### Backend Setup
```bash
cd parkingsystem
# Update application.properties with your MySQL credentials
mvn spring-boot:run
```
Backend runs on: `http://localhost:8080`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 👤 Default Users

| Role | Username | Password |
|------|----------|----------|
| System Admin | `admin` | `admin123` |
| City Admin | `cityadmin` | `city123` |
| Parking Manager | `manager` | `manager123` |
| Driver | `driver` | `driver123` |

---

## 🗺️ Coverage

The system includes **90+ parking lots** across **53 Tamil Nadu cities**, with concentrated coverage in:
- **Coimbatore** - 15 lots
- **Chennai** - 8 lots
- **Madurai** - 5 lots
- **Tiruchirappalli** - 4 lots

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

### Parking
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parking/all` | Get all lots with occupancy |
| GET | `/api/parking/{id}` | Get lot details |
| GET | `/api/parking/{id}/route` | Get navigation route |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings/user` | Get user's bookings |
| POST | `/api/bookings` | Create booking |
| PUT | `/api/bookings/{id}/cancel` | Cancel booking |
| PUT | `/api/bookings/{id}/extend` | Extend booking |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/{id}/activate` | Activate user |
| DELETE | `/api/admin/parking-lots/{id}` | Delete lot (archives bookings) |

---

## 📄 License

This project is for educational purposes.

---

## 👨‍💻 Author

**Durgesh S V**

---

*Built with ❤️ for smarter parking solutions in Tamil Nadu*
