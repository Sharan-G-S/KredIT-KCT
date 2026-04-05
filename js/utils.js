/* ================================================================
   KredIT - Utility Helpers (No Emojis, 2-Role System)
   ================================================================ */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function calculateDuration(timeIn, timeOut) {
  const [h1, m1] = timeIn.split(':').map(Number);
  const [h2, m2] = timeOut.split(':').map(Number);
  return Math.max(0, ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60);
}

function formatHours(hours) {
  if (hours < 1) return Math.round(hours * 60) + 'm';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
}

function showToast(message, type) {
  type = type || 'info';
  var container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var iconMap = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
  toast.innerHTML = '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>' +
    '<span class="toast-message">' + message + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
  container.appendChild(toast);
  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}

function createProgressRing(size, strokeWidth, progress, color) {
  color = color || '#2979ff';
  var radius = (size - strokeWidth) / 2;
  var circumference = 2 * Math.PI * radius;
  var offset = circumference - (progress / 100) * circumference;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<circle class="progress-ring-bg" cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + radius + '" stroke-width="' + strokeWidth + '" />' +
    '<circle class="progress-ring-fill" cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + radius + '" stroke-width="' + strokeWidth + '" stroke="' + color + '" style="stroke-dasharray: ' + circumference + '; stroke-dashoffset: ' + offset + ';" />' +
    '</svg>';
}

function requireAuth(allowedRoles) {
  allowedRoles = allowedRoles || [];
  var user = getCurrentUser();
  if (!user) {
    window.location.href = getBasePath() + 'index.html';
    return null;
  }
  if (allowedRoles.length > 0 && allowedRoles.indexOf(user.role) === -1) {
    redirectToPortal(user.role);
    return null;
  }
  return user;
}

function getBasePath() {
  var path = window.location.pathname;
  if (path.indexOf('/student/') !== -1 || path.indexOf('/admin/') !== -1) return '../';
  return '';
}

function redirectToPortal(role) {
  var portals = { student: 'student/dashboard.html', admin: 'admin/dashboard.html' };
  window.location.href = getBasePath() + (portals[role] || 'index.html');
}

function logout() {
  clearCurrentUser();
  window.location.href = getBasePath() + 'index.html';
}

function getStatusDisplay(status) {
  var map = {
    'pending': { label: 'Pending Review', badge: 'pending' },
    'approved': { label: 'Approved', badge: 'success' },
    'revision': { label: 'Needs Revision', badge: 'revision' },
    'rejected': { label: 'Rejected', badge: 'danger' },
  };
  return map[status] || { label: status, badge: 'neutral' };
}

function buildSidebar(portalType, activePage) {
  var user = getCurrentUser();
  if (!user) return '';

  var navItems = {
    student: [
      { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
      { id: 'log-entry', label: 'New Log Entry', href: 'log-entry.html' },
      { id: 'my-logs', label: 'My Logs', href: 'my-logs.html' },
      { id: 'credit-tracker', label: 'Credit Tracker', href: 'credit-tracker.html' },
      { id: 'achievements', label: 'Achievements', href: 'achievements.html' },
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
      { id: 'review-logs', label: 'Review Logs', href: 'review-logs.html' },
      { id: 'manage-clubs', label: 'Manage Clubs', href: 'manage-clubs.html' },
      { id: 'manage-users', label: 'Manage Users', href: 'manage-users.html' },
      { id: 'credit-config', label: 'Credit Config', href: 'credit-config.html' },
      { id: 'reports', label: 'Reports & Export', href: 'reports.html' },
    ]
  };

  var items = navItems[portalType] || [];
  var navHtml = '';
  items.forEach(function (item) {
    var isActive = activePage === item.id ? 'active' : '';
    navHtml += '<a href="' + item.href + '" class="nav-item ' + isActive + '" id="nav-' + item.id + '">' +
      '<span>' + item.label + '</span></a>';
  });

  var portalLabel = portalType === 'admin' ? 'ADMIN PORTAL' : 'STUDENT PORTAL';
  var avatarClass = portalType === 'admin' ? 'admin' : 'student';
  var roleLabel = portalType === 'admin' ? 'Administrator' : 'Student';

  return '<aside class="sidebar" id="sidebar">' +
    '<div class="sidebar-brand">' +
      '<div class="brand-logo">K</div>' +
      '<div class="brand-text"><span class="brand-name">KredIT</span><span class="brand-sub">KCT Credit Tracker</span></div>' +
    '</div>' +
    '<button class="sidebar-close" id="sidebarClose" onclick="document.getElementById(\'sidebar\').classList.remove(\'open\')">&times;</button>' +
    '<div class="sidebar-section"><div class="sidebar-section-label">' + portalLabel + '</div>' + navHtml + '</div>' +
    '<div class="sidebar-footer"><div class="sidebar-user" onclick="logout()">' +
      '<div class="user-avatar ' + avatarClass + '">' + getInitials(user.name) + '</div>' +
      '<div class="user-info"><span class="user-name">' + user.name + '</span>' +
      '<span class="user-role">' + roleLabel + ' | Sign Out</span></div></div></div></aside>' +
    '<button class="mobile-menu-btn" id="mobileMenuBtn" onclick="document.getElementById(\'sidebar\').classList.toggle(\'open\')">&#9776;</button>';
}

function debounce(fn, ms) {
  ms = ms || 300;
  var timer;
  return function () {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}
