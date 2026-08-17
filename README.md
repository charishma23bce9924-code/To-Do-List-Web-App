# TASKR — Full-Stack To-Do App

A polished full-stack To-Do List app built with:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose)

---

## 📁 Project Structure

```
todo-app/
├── server.js          ← Express server + MongoDB + REST API
├── package.json       ← Dependencies
├── .env               ← Environment variables (port, DB URI)
└── public/
    ├── index.html     ← Frontend UI
    ├── style.css      ← Styles (dark editorial theme)
    └── app.js         ← Frontend JavaScript
```

---

## ⚙️ Prerequisites

Make sure the following are installed on your system:

1. **Node.js** (v16+) → https://nodejs.org
2. **MongoDB Community Server** → https://www.mongodb.com/try/download/community

### Verify installations:
```bash
node -v
npm -v
mongod --version
```

---

## 🚀 Setup & Run

### Step 1 — Install MongoDB and start it

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download and install from https://www.mongodb.com/try/download/community
Then start MongoDB service from Services panel or run:
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Step 2 — Navigate to the project folder
```bash
cd path/to/todo-app
```

### Step 3 — Install Node dependencies
```bash
npm install
```

### Step 4 — Configure environment (optional)
Edit `.env` to change port or MongoDB URI:
```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/todoapp
```

### Step 5 — Start the server
```bash
# Normal start
npm start

# OR with auto-restart on file change (development)
npm run dev
```

### Step 6 — Open the app
```
http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/todos` | Get all todos (supports filters) |
| GET | `/api/todos/:id` | Get a single todo |
| POST | `/api/todos` | Create a new todo |
| PUT | `/api/todos/:id` | Update a todo |
| PATCH | `/api/todos/:id/toggle` | Toggle complete/incomplete |
| DELETE | `/api/todos/:id` | Delete a todo |
| DELETE | `/api/todos/bulk/completed` | Delete all completed todos |
| GET | `/api/stats` | Get statistics |

### Query Parameters for GET /api/todos
- `status` → `all`, `active`, `completed`
- `priority` → `low`, `medium`, `high`
- `search` → text search on title
- `category` → filter by category

### Example POST Body
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "medium",
  "category": "Personal",
  "dueDate": "2025-12-31"
}
```

---

## 🗃️ Viewing MongoDB Data

Install **MongoDB Compass** (GUI) for easy database browsing:
→ https://www.mongodb.com/try/download/compass

Or use the CLI:
```bash
mongosh
use todoapp
db.todos.find().pretty()
```

---

## ✨ Features

- Add tasks with title, description, priority, category, due date
- Toggle tasks complete/incomplete
- Edit tasks via modal
- Delete individual tasks or bulk-clear completed
- Filter by status (All / Active / Completed)
- Filter by priority
- Live search
- Overdue date highlighting
- Stats bar (total, active, done, urgent)
- Fully persistent with MongoDB
- Beautiful dark editorial UI

---

## 🛑 Troubleshooting

**"MongoDB connection error"**
→ Make sure MongoDB is running: `brew services start mongodb-community` (macOS) or `sudo systemctl start mongodb` (Linux)

**"Port 3000 already in use"**
→ Change PORT in `.env` to another number like 3001

**"Cannot find module"**
→ Run `npm install` again in the project folder
