require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/todoapp';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB Connection ────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected at', MONGO_URI))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Todo Schema & Model ───────────────────────────────────────────────────────
const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title too long']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  dueDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

const Todo = mongoose.model('Todo', todoSchema);

// ─── API Routes ────────────────────────────────────────────────────────────────

// GET all todos
app.get('/api/todos', async (req, res) => {
  try {
    const { status, priority, category, search } = req.query;
    let filter = {};

    if (status === 'completed') filter.completed = true;
    if (status === 'active') filter.completed = false;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const todos = await Todo.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: todos.length, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single todo
app.get('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create todo
app.post('/api/todos', async (req, res) => {
  try {
    const todo = await Todo.create(req.body);
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH toggle complete
app.patch('/api/todos/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    todo.completed = !todo.completed;
    await todo.save();
    res.json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });
    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE all completed
app.delete('/api/todos/bulk/completed', async (req, res) => {
  try {
    const result = await Todo.deleteMany({ completed: true });
    res.json({ success: true, message: `${result.deletedCount} completed todos deleted` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stats
app.get('/api/stats', async (req, res) => {
  try {
    const total = await Todo.countDocuments();
    const completed = await Todo.countDocuments({ completed: true });
    const active = await Todo.countDocuments({ completed: false });
    const high = await Todo.countDocuments({ priority: 'high', completed: false });
    res.json({ success: true, data: { total, completed, active, high } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
