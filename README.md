# Employee Management System

A comprehensive Employee Management System built with NestJS (Backend) and React + Vite (Frontend).

## Features

- 👥 **Employee Management**: Complete employee profiles, departments, and branches
- ⏰ **Attendance Tracking**: Clock in/out with automatic status detection (Present/Late/Absent)
- 📅 **Leave Management**: Request, approve, and track employee leave requests
- 🔔 **Notifications**: Real-time notifications for leave requests and announcements
- 📢 **Announcements**: Company-wide announcements for admins and HR managers
- 📊 **Dashboards**: Role-based dashboards for Admin, HR Manager, Branch Manager, and Department Head
- 🔐 **Authentication**: JWT-based authentication with role-based access control
- 📈 **Analytics**: Gender ratio, attendance statistics, and organizational insights

## Tech Stack

### Backend
- NestJS (Node.js framework)
- TypeORM (Database ORM)
- PostgreSQL (Database)
- JWT (Authentication)
- Nodemailer (Email notifications)
- Passport (Authentication strategies)

### Frontend
- React 18
- Vite (Build tool)
- TypeScript
- Tailwind CSS (Styling)
- React Router (Routing)
- Axios (HTTP client)
- Recharts (Charts)
- Heroicons (Icons)

## Project Structure

```
employee-management-system/
├── backend/          # NestJS backend application
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── employees/ # Employee management
│   │   ├── attendance/ # Attendance tracking
│   │   ├── leaves/    # Leave management
│   │   ├── dashboard/ # Dashboard stats
│   │   └── ...
│   └── ...
├── frontend/         # React frontend application
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/ # Reusable components
│   │   ├── contexts/  # React contexts
│   │   └── ...
│   └── ...
└── ...
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd employee-management-system
```

2. Backend Setup:
```bash
cd backend
npm install
cp .env.example .env  # Create .env file and configure
npm run start:dev
```

3. Frontend Setup:
```bash
cd frontend
npm install
cp .env.example .env  # Create .env file and set VITE_API_URL
npm run dev
```

### Environment Variables

See `ENV_SETUP.md` for detailed environment variable configuration.

## Deployment

This project is configured for deployment on:
- **Backend**: Railway
- **Frontend**: Vercel

See `RAILWAY_VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

Quick deployment guide: `QUICK_START_DEPLOYMENT.md`

## User Roles

- **System Admin**: Full system access
- **HR Manager**: Employee and leave management
- **Branch Manager**: Branch-specific management
- **Department Head**: Department-specific management
- **Employee**: Personal dashboard and requests

## License

Private/Proprietary

## Support

For deployment help, see the deployment guides in the repository root.

