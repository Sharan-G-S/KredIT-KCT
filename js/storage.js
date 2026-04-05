/* ================================================================
   KredIT - Data Layer (localStorage + Supabase-Ready)
   Two Roles: Student + Admin
   ================================================================ */

const DB_KEYS = {
  USERS: 'kredit_users',
  LOGS: 'kredit_logs',
  CURRENT_USER: 'kredit_current_user',
  SETTINGS: 'kredit_settings',
  INITIALIZED: 'kredit_initialized_v2',
};

// ---- Supabase Integration (configure in supabase-config.js) ----
// If window.supabaseClient exists, data will be synced to Supabase.
// Otherwise falls back to localStorage only.
function useSupabase() {
  return typeof window !== 'undefined' && window.supabaseClient;
}

// ---- Initialize ----
function initializeDatabase() {
  if (localStorage.getItem(DB_KEYS.INITIALIZED)) return;

  const seedUsers = [
    {
      id: 'admin-001', name: 'Sharan', email: 'sharan.admin@kct.ac.in',
      password: 'Sharan.admin@kct', role: 'admin', department: 'Administration',
      year: null, rollNumber: null, clubs: [], createdAt: '2026-01-01T00:00:00'
    },
  ];

  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(seedUsers));
  localStorage.setItem(DB_KEYS.LOGS, JSON.stringify([]));
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify({
    semesterStart: '2026-01-13',
    semesterEnd: '2026-05-15',
    academicYear: '2025-2026',
    semester: 'Even',
  }));
  localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
}

// ---- CRUD: Users ----
function getAllUsers() {
  return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
}

function getUserById(id) {
  return getAllUsers().find(u => u.id === id);
}

function getUserByEmail(email) {
  return getAllUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

function createUser(userData) {
  const users = getAllUsers();
  const newUser = {
    id: 'std-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

  // Sync to Supabase
  if (useSupabase()) {
    window.supabaseClient.from('users').insert(newUser).then();
  }
  return newUser;
}

function updateUser(id, updates) {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    if (useSupabase()) {
      window.supabaseClient.from('users').update(updates).eq('id', id).then();
    }
    return users[idx];
  }
  return null;
}

// ---- CRUD: Logs ----
function getAllLogs() {
  return JSON.parse(localStorage.getItem(DB_KEYS.LOGS) || '[]');
}

function getLogById(id) {
  return getAllLogs().find(l => l.id === id);
}

function getLogsByStudent(studentId) {
  return getAllLogs().filter(l => l.studentId === studentId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getLogsByClub(clubId) {
  return getAllLogs().filter(l => l.clubId === clubId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getLogsByClubs(clubIds) {
  return getAllLogs().filter(l => clubIds.includes(l.clubId)).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function createLog(logData) {
  const logs = getAllLogs();
  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    ...logData,
    status: 'pending',
    evaluation: {},
    feedback: '',
    createdAt: new Date().toISOString()
  };
  logs.unshift(newLog);
  localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));

  if (useSupabase()) {
    window.supabaseClient.from('logs').insert(newLog).then();
  }
  return newLog;
}

function updateLog(id, updates) {
  const logs = getAllLogs();
  const idx = logs.findIndex(l => l.id === id);
  if (idx !== -1) {
    logs[idx] = { ...logs[idx], ...updates };
    localStorage.setItem(DB_KEYS.LOGS, JSON.stringify(logs));
    if (useSupabase()) {
      window.supabaseClient.from('logs').update(updates).eq('id', id).then();
    }
    return logs[idx];
  }
  return null;
}

// ---- Session ----
function setCurrentUser(user) {
  localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
}

function getCurrentUser() {
  const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

function clearCurrentUser() {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
}

// ---- Settings ----
function getSettings() {
  return JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS) || '{}');
}

function updateSettings(updates) {
  const settings = getSettings();
  Object.assign(settings, updates);
  localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  return settings;
}

// ---- Helpers ----
function getStudentsByClub(clubId) {
  return getAllUsers().filter(u => u.role === 'student' && u.clubs && u.clubs.includes(clubId));
}

function getStudentsByClubs(clubIds) {
  return getAllUsers().filter(u => u.role === 'student' && u.clubs && u.clubs.some(c => clubIds.includes(c)));
}

function getUsersByRole(role) {
  return getAllUsers().filter(u => u.role === role);
}

// Initialize
initializeDatabase();
