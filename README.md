# JobConnect – Full Stack Job Portal

JobConnect is a full-stack job and internship portal that connects **students**, **recruiters**, and **administrators** on one platform. Students discover and apply for opportunities, recruiters publish jobs and manage applicants, and admins oversee the whole system.

**🌐 Live demo:** https://frontend-hz78.vercel.app

> ⏳ **Note:** the backend runs on a free hosting plan and sleeps after ~15 minutes of inactivity. The first request after a quiet period can take 1–3 minutes while the server wakes up. After that, everything runs normally.

---

## ✨ Features

### 👨‍🎓 Student
- Register, log in, and manage a profile (education, experience, skills)
- Browse, search, and filter jobs and internships
- Upload a resume and apply to jobs with a cover letter
- Track application status and upcoming interviews
- Save jobs and external internships for later
- In-app notifications

### 💼 Recruiter
- Recruiter dashboard with company and job management
- Create, edit, publish, and close job or internship postings
- View applicants, update application statuses, and schedule interviews
- Download applicant resumes

### 🛡️ Admin
- Admin dashboard with platform statistics
- User, company, job, and application management
- Company verification and an audit trail of admin actions

### 🌍 External Internships
- Live internship listings fetched from the [Adzuna API](https://developer.adzuna.com/) and refreshed on a schedule
- Listings are automatically classified by category and B.Tech year eligibility
- Applications continue on the original listing's website

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, Axios |
| Styling | Tailwind CSS 4, Lucide icons |
| Backend | Java 21, Spring Boot 4, Spring Security, Spring Data JPA (Hibernate) |
| Authentication | JWT (JJWT) with role-based access (Student / Recruiter / Admin) |
| Database | MySQL-compatible (MySQL 8 locally, TiDB Cloud in production) |
| Build | Maven (backend), npm (frontend) |
| Hosting | Vercel (frontend), Render (backend, Docker), TiDB Cloud (database) |

---

## 📂 Project Structure

```text
JobConnect/
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── pages/        # auth, student, recruiter, admin pages
│   │   └── services/     # API calls (axios)
│   └── vercel.json       # SPA routing for Vercel
│
├── backend/              # Spring Boot REST API
│   ├── src/main/java/    # controllers, services, entities, security
│   ├── Dockerfile        # used for deployment on Render
│   └── pom.xml
│
├── database/
│   ├── schema.sql                # tables and indexes
│   ├── updates.sql               # extra tables/columns required by the code (run after schema.sql)
│   ├── external_internships.sql  # table for external internships
│   └── sample_data.sql           # optional demo data
│
└── README.md
```

---

## ⚙️ Run Locally

### Prerequisites
- Node.js 20+ and npm
- JDK 21
- MySQL 8
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Namratha18-hub/JobConnect.git
cd JobConnect
```

### 2. Set up the database

Run the SQL files in this order using MySQL Workbench or the `mysql` command line:

1. `database/schema.sql`
2. `database/external_internships.sql`
3. `database/updates.sql`
4. `database/sample_data.sql` *(optional demo data; the sample users cannot log in because their password hashes are placeholders, so register new accounts)*

### 3. Configure the backend

Set these values either as environment variables or in `backend/src/main/resources/application.properties`.
**Never commit real passwords or secrets to Git.**

| Setting | Environment variable | Description |
|---|---|---|
| Database URL | `SPRING_DATASOURCE_URL` | e.g. `jdbc:mysql://localhost:3306/jobconnect_db` |
| Database user | `SPRING_DATASOURCE_USERNAME` | your MySQL user |
| Database password | `SPRING_DATASOURCE_PASSWORD` | your MySQL password |
| JWT secret | `JWT_SECRET` | a random string of **at least 32 characters** |
| Frontend URL | `JOBCONNECT_FRONTEND_URL` | allowed CORS origin, e.g. `http://localhost:5173` |
| Adzuna switch | `ADZUNA_ENABLED` | `true` to fetch external internships, otherwise `false` |
| Adzuna keys | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | from developer.adzuna.com (only if enabled) |
| Email | `MAIL_ENABLED` | `true` only if you configure `SPRING_MAIL_*` settings |

### 4. Start the backend

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The API runs on **http://localhost:8080**.

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**. By default it talks to `http://localhost:8080`.
To point it at another backend, create `frontend/.env` containing:

```env
VITE_API_URL=https://your-backend-url
```

---

## 🚀 Deployment

The live version uses free tiers of three services:

| Part | Service | Key settings |
|---|---|---|
| Database | [TiDB Cloud Starter](https://tidbcloud.com/) (MySQL-compatible) | Spending limit `0`; TLS is required |
| Backend | [Render](https://render.com/) web service | Root directory `backend`, runtime Docker |
| Frontend | [Vercel](https://vercel.com/) | Root directory `frontend`, env var `VITE_API_URL` |

**Backend environment variables on Render:** the ones in the table above. For TiDB the JDBC URL looks like:

```text
jdbc:mysql://<tidb-host>:4000/jobconnect_db?sslMode=REQUIRED&serverTimezone=Asia/Kolkata
```

**Order of setup:** create the database → load the SQL files → deploy the backend → deploy the frontend → set `JOBCONNECT_FRONTEND_URL` on the backend to the Vercel URL (no trailing slash) and redeploy.

**TiDB notes**
- TiDB does not support MySQL's `FULLTEXT` index the same way. Remove or skip the `CREATE FULLTEXT INDEX` line in `schema.sql`; the app does not use full-text search.
- Because `spring.jpa.hibernate.ddl-auto=none`, tables are **not** created automatically. All SQL files must be run manually.

---

## ⚠️ Known Limitations

- **Cold starts:** the free backend sleeps when idle (see the note at the top).
- **Resume uploads** are stored on the server's local disk, which free hosts reset on every restart or redeploy. For production use, move file storage to a service such as S3 or Cloudinary.
- **Adzuna feed** may occasionally return temporary errors (HTTP 503); the next scheduled sync fills in the data.

---

## 🔐 Security Notes

- Passwords are hashed with BCrypt and APIs are protected with JWT and role-based rules.
- Keep all secrets (database password, `JWT_SECRET`, API keys) in environment variables, never in the repository.
- Create admin accounts directly in the database rather than through public registration.

---

## 🗺️ Roadmap

- [ ] Cloud storage for resumes
- [ ] Email notifications for status changes and interviews
- [ ] Better error messages for failed logins (401 instead of 500)
- [ ] Automated tests and CI

---

## 👩‍💻 Author

**Namratha** – [@Namratha18-hub](https://github.com/Namratha18-hub)

If you find this project useful, please consider giving it a ⭐.
