# JobConnect – Full Stack Job Portal

A full-stack job portal that connects students with recruiters through a centralized platform for job discovery, applications, and recruitment management.

## 🚀 Overview

JobConnect is designed to simplify the recruitment process by providing dedicated dashboards for students, recruiters, and administrators. Students can discover jobs and track applications, recruiters can publish job openings and manage applicants, and administrators can oversee platform activities.

## ✨ Features

### 👨‍🎓 Student
- User registration and login
- Password reset functionality
- Browse and search jobs
- View job details
- Apply for jobs
- Save and remove saved jobs
- Track application status
- Student dashboard

### 💼 Recruiter
- Recruiter authentication
- Recruiter dashboard
- Create and manage job postings
- View job applicants
- Update application statuses
- Manage recruitment activities

### 🛡️ Admin
- Admin dashboard
- User management
- Job management
- Platform statistics
- Administrative controls

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Java, Spring Boot |
| Database | MySQL |
| API | REST APIs |
| Authentication | JWT |
| Build Tool | Maven |
| Version Control | Git, GitHub |

## 📂 Project Structure

```text
JobConnect/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   └── pom.xml
│
├── database/
└── README.md
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js and npm
- Java JDK
- Maven
- MySQL
- Git

### 1. Clone Repository

```bash
git clone https://github.com/Namratha18-hub/JobConnect.git
cd JobConnect
```

### 2. Configure MySQL

Create a MySQL database:

```sql
CREATE DATABASE jobconnect_db;
```

Configure your database credentials in the backend application configuration.

### 3. Run Backend

```bash
cd backend
```

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend runs locally at:

`http://localhost:8080`

### 4. Run Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs locally at:

`http://localhost:5173`

## 🔐 Security

- Passwords are stored using password hashing.
- Authentication uses JWT.
- Sensitive configuration should be stored in environment variables.
- Production deployments should use secure password-reset verification and HTTPS.

Never commit database passwords, JWT secrets, email credentials, or environment files containing secrets.

## 📸 Screenshots

_Add screenshots of the Login, Student Dashboard, Recruiter Dashboard, and Admin Dashboard here._

## 🌐 Deployment

Deployment configuration and live application links will be added after cloud deployment.

## 👩‍💻 Developer

**Namratha Sanapala**

GitHub: [Namratha18-hub](https://github.com/Namratha18-hub)

## 📄 License

This project is available for educational and portfolio purposes. Add a license if you intend to specify reuse permissions.

---

⭐ If you find this project interesting, consider starring the repository!
