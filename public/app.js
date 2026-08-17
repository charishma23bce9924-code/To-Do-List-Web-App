// ── CONFIG ──────────────────────────────────────────────────────────
const API = '/api/todos';
const NOTIF_CHECK_INTERVAL = 60 * 1000; // check every 60 seconds

// ── STATE ────────────────────────────────────────────────────────────
let todos = [];
let currentFilter = 'all';
let currentPriority = '';
let searchQuery = '';
let searchTimer = null;

// ── DOM REFS ─────────────────────────────────────────────────────────
const todoList       = document.getElementById('todoList');
const emptyState     = document.getElementById('emptyState');
const loadingState   = document.getElementById('loadingState');
const titleInput     = document.getElementById('titleInput');
const descInput      = document.getElementById('descInput');
const prioritySelect = document.getElementById('prioritySelect');
const categoryInput  = document.getElementById('categoryInput');
const dueDateInput   = document.getElementById('dueDateInput');
const addBtn         = document.getElementById('addBtn');
const toggleExtra    = document.getElementById('toggleExtra');
const extraFields    = document.getElementById('extraFields');
const clearDoneBtn   = document.getElementById('clearDoneBtn');
const searchInput    = document.getElementById('searchInput');
const priorityFilter = document.getElementById('priorityFilter');
const toast          = document.getElementById('toast');
const modalOverlay   = document.getElementById('modalOverlay');
const modalClose     = document.getElementById('modalClose');
const modalCancel    = document.getElementById('modalCancel');
const modalSave      = document.getElementById('modalSave');

const notifBanner     = document.getElementById('notifBanner');
const notifList       = document.getElementById('notifList');
const btnAllowNotif   = document.getElementById('btnAllowNotif');
const btnDismissNotif = document.getElementById('btnDismissNotif');

// Stats
const statTotal  = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statDone   = document.getElementById('statDone');
const statHigh   = document.getElementById('statHigh');

// Notification state
let notifDismissed = false;
let notifIntervalId = null;

// ── INIT ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTodos();
  loadStats();
  setupEvents();
  initNotifications();
});

// ── API CALLS ─────────────────────────────────────────────────────────

async function loadTodos() {
  showLoading(true);
  try {
    const params = new URLSearchParams();
    if (currentFilter !== 'all') params.set('status', currentFilter);
    if (currentPriority) params.set('priority', currentPriority);
    if (searchQuery) params.set('search', searchQuery);

    const res = await fetch(`${API}?${params}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    todos = data.data;
    renderTodos();
  } catch (err) {
    showToast('Failed to load todos: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function createTodo() {
  const title = titleInput.value.trim();
  if (!title) { titleInput.focus(); return; }

  const body = {
    title,
    description: descInput.value.trim(),
    priority: prioritySelect.value,
    category: categoryInput.value.trim() || 'General',
    dueDate: dueDateInput.value || null,
  };

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    titleInput.value = '';
    descInput.value = '';
    categoryInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'medium';

    showToast('Task added ✓', 'success');
    await loadTodos();
    await loadStats();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function toggleTodo(id) {
  try {
    const res = await fetch(`${API}/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    await loadTodos();
    await loadStats();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteTodo(id) {
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Task deleted', 'success');
    await loadTodos();
    await loadStats();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function updateTodo(id, updates) {
  try {
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast('Task updated ✓', 'success');
    closeModal();
    await loadTodos();
    await loadStats();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function clearCompleted() {
  try {
    const res = await fetch(`${API}/bulk/completed`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast(data.message, 'success');
    await loadTodos();
    await loadStats();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (!data.success) return;
    const { total, completed, active, high } = data.data;
    statTotal.textContent  = total;
    statActive.textContent = active;
    statDone.textContent   = completed;
    statHigh.textContent   = high;
  } catch {}
}

// ── RENDER ─────────────────────────────────────────────────────────

function renderTodos() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  todos.forEach(todo => {
    const item = createTodoElement(todo);
    todoList.appendChild(item);
  });
}

function createTodoElement(todo) {
  const div = document.createElement('div');
  div.className = `todo-item priority-${todo.priority}${todo.completed ? ' completed' : ''}`;
  div.dataset.id = todo._id;

  const created = new Date(todo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dueStr = todo.dueDate ? formatDue(todo.dueDate) : '';
  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

  div.innerHTML = `
    <div class="todo-check" data-id="${todo._id}" title="Toggle complete">${todo.completed ? '✓' : ''}</div>
    <div class="todo-content">
      <div class="todo-top">
        <span class="todo-title">${escHtml(todo.title)}</span>
      </div>
      ${todo.description ? `<div class="todo-desc">${escHtml(todo.description)}</div>` : ''}
      <div class="todo-meta">
        <span class="badge badge-priority-${todo.priority}">${todo.priority}</span>
        ${todo.category !== 'General' ? `<span class="badge badge-category">${escHtml(todo.category)}</span>` : ''}
        ${dueStr ? `<span class="badge badge-due${isOverdue ? ' overdue' : ''}">Due ${dueStr}</span>` : ''}
        <span class="todo-date">${created}</span>
      </div>
    </div>
    <div class="todo-actions">
      <button class="btn-icon edit-btn" data-id="${todo._id}" title="Edit">✎</button>
      <button class="btn-icon delete btn-delete" data-id="${todo._id}" title="Delete">✕</button>
    </div>
  `;

  // Events
  div.querySelector('.todo-check').addEventListener('click', () => toggleTodo(todo._id));
  div.querySelector('.btn-delete').addEventListener('click', () => deleteTodo(todo._id));
  div.querySelector('.edit-btn').addEventListener('click', () => openEditModal(todo));

  return div;
}

function formatDue(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── MODAL ───────────────────────────────────────────────────────────

function openEditModal(todo) {
  document.getElementById('editId').value = todo._id;
  document.getElementById('editTitle').value = todo.title;
  document.getElementById('editDesc').value = todo.description || '';
  document.getElementById('editPriority').value = todo.priority;
  document.getElementById('editCategory').value = todo.category || '';
  document.getElementById('editDueDate').value = todo.dueDate
    ? new Date(todo.dueDate).toISOString().split('T')[0]
    : '';
  modalOverlay.classList.remove('hidden');
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

// ── EVENTS ───────────────────────────────────────────────────────────

function setupEvents() {
  // Add task
  addBtn.addEventListener('click', createTodo);
  titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') createTodo(); });

  // Extra fields toggle
  toggleExtra.addEventListener('click', () => {
    const open = extraFields.classList.toggle('open');
    toggleExtra.textContent = open ? '− less options' : '+ more options';
  });

  // Filter tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      loadTodos();
    });
  });

  // Priority filter
  priorityFilter.addEventListener('change', () => {
    currentPriority = priorityFilter.value;
    loadTodos();
  });

  // Search
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      loadTodos();
    }, 350);
  });

  // Clear done
  clearDoneBtn.addEventListener('click', () => {
    if (confirm('Delete all completed tasks?')) clearCompleted();
  });

  // Modal
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

  modalSave.addEventListener('click', () => {
    const id = document.getElementById('editId').value;
    const updates = {
      title:       document.getElementById('editTitle').value.trim(),
      description: document.getElementById('editDesc').value.trim(),
      priority:    document.getElementById('editPriority').value,
      category:    document.getElementById('editCategory').value.trim() || 'General',
      dueDate:     document.getElementById('editDueDate').value || null,
    };
    if (!updates.title) { document.getElementById('editTitle').focus(); return; }
    updateTodo(id, updates);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Notification banner buttons
  btnAllowNotif.addEventListener('click', requestNotifPermission);
  btnDismissNotif.addEventListener('click', () => {
    notifBanner.classList.add('hidden');
    notifDismissed = true;
    // Re-show on next interval check
    setTimeout(() => { notifDismissed = false; }, NOTIF_CHECK_INTERVAL);
  });
}

// ── UI HELPERS ────────────────────────────────────────────────────────

let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

function showLoading(show) {
  if (show) {
    loadingState.classList.remove('hidden');
    todoList.classList.add('hidden');
    emptyState.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
    todoList.classList.remove('hidden');
  }
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────

function initNotifications() {
  // Update button state based on current permission
  if (Notification.permission === 'granted') {
    btnAllowNotif.textContent = '✓ Alerts On';
    btnAllowNotif.classList.add('granted');
  } else if (Notification.permission === 'denied') {
    btnAllowNotif.textContent = 'Blocked in Browser';
    btnAllowNotif.classList.add('granted');
  }

  // Run check immediately on load, then every 60s
  checkDueTasks();
  notifIntervalId = setInterval(checkDueTasks, NOTIF_CHECK_INTERVAL);
}

async function checkDueTasks() {
  try {
    const res = await fetch(`${API}?status=active`);
    const data = await res.json();
    if (!data.success) return;

    const now = new Date();
    const todayStr = now.toDateString();

    const overdue = [];
    const dueToday = [];

    data.data.forEach(todo => {
      if (!todo.dueDate) return;
      const due = new Date(todo.dueDate);
      if (due < now && due.toDateString() !== todayStr) {
        overdue.push(todo);
      } else if (due.toDateString() === todayStr) {
        dueToday.push(todo);
      }
    });

    const urgent = [...overdue, ...dueToday];

    if (urgent.length === 0) {
      notifBanner.classList.add('hidden');
      document.querySelector('.stat-pill.urgent')?.classList.remove('has-urgent');
      return;
    }

    // Show in-app banner
    if (!notifDismissed) {
      const lines = [];
      if (overdue.length > 0) {
        lines.push(`⚠ Overdue (${overdue.length}): ${overdue.slice(0, 2).map(t => t.title).join(', ')}${overdue.length > 2 ? ` +${overdue.length - 2} more` : ''}`);
      }
      if (dueToday.length > 0) {
        lines.push(`📅 Due today (${dueToday.length}): ${dueToday.slice(0, 2).map(t => t.title).join(', ')}${dueToday.length > 2 ? ` +${dueToday.length - 2} more` : ''}`);
      }
      notifList.textContent = lines.join('   ·   ');
      notifBanner.classList.remove('hidden');
    }

    // Pulse the urgent stat pill
    document.querySelector('.stat-pill.urgent')?.classList.add('has-urgent');

    // Send browser desktop notifications (only if granted and not sent this session)
    if (Notification.permission === 'granted') {
      sendDesktopNotifications(overdue, dueToday);
    }

  } catch (err) {
    console.warn('Notification check failed:', err.message);
  }
}

// Track which task IDs we've already notified this session
const notifiedIds = new Set();

function sendDesktopNotifications(overdue, dueToday) {
  overdue.forEach(todo => {
    if (notifiedIds.has(todo._id)) return;
    notifiedIds.add(todo._id);
    const n = new Notification('⚠ Overdue Task — TASKR', {
      body: `"${todo.title}" is past its due date!`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%230a0a0f"/><text x="16" y="22" text-anchor="middle" font-size="18">⚠</text></svg>',
      tag: `overdue-${todo._id}`,
      requireInteraction: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
  });

  dueToday.forEach(todo => {
    if (notifiedIds.has(todo._id)) return;
    notifiedIds.add(todo._id);
    const n = new Notification('📅 Due Today — TASKR', {
      body: `"${todo.title}" is due today.`,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="%230a0a0f"/><text x="16" y="22" text-anchor="middle" font-size="18">📅</text></svg>',
      tag: `today-${todo._id}`,
      requireInteraction: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
  });
}

async function requestNotifPermission() {
  if (!('Notification' in window)) {
    showToast('Your browser does not support notifications', 'error');
    return;
  }
  if (Notification.permission === 'denied') {
    showToast('Notifications blocked — enable them in browser settings', 'error');
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    btnAllowNotif.textContent = '✓ Alerts On';
    btnAllowNotif.classList.add('granted');
    showToast('Desktop notifications enabled ✓', 'success');
    // Send any pending notifications immediately
    checkDueTasks();
  } else {
    showToast('Notification permission denied', 'error');
  }
}
