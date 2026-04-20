# 🍬 BUBBLEGUM - Task Management System

A modern fullstack task management web application designed for teams to collaborate efficiently.

---

## 🚀 Features

1. **User Authentication:** Log in and register to use JWT (JSON Web Token).

2. **Task Management:** Create a new task with a Title, Description, and Deadline.

3. **Status Update:** Change the task status (`TODO` -> `IN_PROGRESS` -> `DONE`).

4. **Assignment:** The creator or administrator can assign tasks to other users via their User ID.

---

## 🛠️ Tech Stack

- **Frontend:** Angular 17+
- **Backend:** Java 17, Spring Boot 3, Spring Security (JWT)
- **Database:** PostgreSQL
- **Deployment:** Docker, Google Cloud Run

---

## 📐 System Architecture
The system is designed using a 3-Tier Architecture:
- **Controller Layer:** Receives HTTP requests and authenticates JWT tokens.

- **Service Layer:** Handles business logic (permission checking, state flow validation).

- **Repository Layer:** Communicates with PostgreSQL via Spring Data JPA.

---

## 📸 Demo

<img width="1919" height="1068" alt="image" src="https://github.com/user-attachments/assets/5cbcd3c1-b9e1-4e9c-9339-dccb551c4e2e" />


---

## ⚙️ Installation

```bash
# Clone repo
git clone https://github.com/your-username/bubblegum-tms.git

# Run database with Docker

```bash
docker-compose up --build


# Run frontend
cd frontend
npm install
ng serve

# Run backend
cd backend
npm install
npm start
