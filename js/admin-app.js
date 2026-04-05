/* ================================================================
   KredIT - Admin Portal Application Logic (No Emojis, 2-Role)
   ================================================================ */

var currentReviewFilter = 'pending';

// ---- Dashboard ----
function renderAdminDashboard() {
  var allUsers = getAllUsers();
  var students = allUsers.filter(function (u) { return u.role === 'student'; });
  var allLogs = getAllLogs();
  var pendingLogs = allLogs.filter(function (l) { return l.status === 'pending'; });
  var approvedLogs = allLogs.filter(function (l) { return l.status === 'approved'; });
  var totalHours = allLogs.reduce(function (s, l) { return s + (l.duration || 0); }, 0);

  document.getElementById('adminStats').innerHTML =
    '<div class="stat-card blue"><div class="stat-value">' + students.length + '</div><div class="stat-label">Registered Students</div></div>' +
    '<div class="stat-card gold"><div class="stat-value">' + pendingLogs.length + '</div><div class="stat-label">Pending Reviews</div></div>' +
    '<div class="stat-card green"><div class="stat-value">' + approvedLogs.length + '</div><div class="stat-label">Approved Logs</div></div>' +
    '<div class="stat-card red"><div class="stat-value">' + Math.round(totalHours) + '</div><div class="stat-label">Total Hours Tracked</div></div>';

  // Heatmap
  var heatmap = document.getElementById('heatmapGrid');
  heatmap.innerHTML = CLUBS_DATA.map(function (club) {
    var count = allLogs.filter(function (l) { return l.clubId === club.id; }).length;
    var level = count === 0 ? 0 : count < 5 ? 1 : count < 10 ? 2 : count < 20 ? 3 : 4;
    return '<div class="heatmap-cell level-' + level + '" title="' + club.name + ': ' + count + ' logs">' +
      '<div class="cell-name">' + (club.name.length > 12 ? club.name.substring(0, 10) + '...' : club.name) + '</div>' +
      '<div class="cell-value">' + count + '</div></div>';
  }).join('');

  // Recent activity
  var recentLogs = allLogs.slice(0, 8);
  document.getElementById('systemActivity').innerHTML = recentLogs.length > 0 ? recentLogs.map(function (log) {
    var student = getUserById(log.studentId);
    var club = getClubById(log.clubId);
    var statusInfo = getStatusDisplay(log.status);
    return '<div class="activity-item"><div class="activity-dot ' + (statusInfo.badge === 'success' ? 'approved' : 'pending') + '"></div>' +
      '<div class="activity-content"><div class="activity-text"><strong>' + (student ? student.name : 'Unknown') + '</strong> &rarr; ' + (club ? club.name : '') + '</div>' +
      '<div class="activity-time">' + statusInfo.label + ' | ' + formatDate(log.date) + '</div></div></div>';
  }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:20px">No activity yet.</p>';

  // Category summary
  var tierSummary = document.getElementById('tierSummary');
  var techClubs = getClubsByCategory(CLUB_CATEGORIES.TECHNICAL);
  var nonTechClubs = getClubsByCategory(CLUB_CATEGORIES.NON_TECHNICAL);
  var techLogs = techClubs.reduce(function (s, c) { return s + getLogsByClub(c.id).length; }, 0);
  var nonTechLogs = nonTechClubs.reduce(function (s, c) { return s + getLogsByClub(c.id).length; }, 0);

  tierSummary.innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">' +
      '<div class="card" style="padding:20px;border-top:3px solid #2979ff"><h4 style="font-size:15px;margin-bottom:12px">' + CLUB_CATEGORIES.TECHNICAL + '</h4>' +
        '<div style="font-size:13px;color:var(--text-tertiary);line-height:2">' + techClubs.length + ' clubs | ' + techLogs + ' logs</div>' +
        '<div style="margin-top:12px;font-size:11px;color:var(--text-muted)">' + TECHNICAL_CRITERIA.map(function (c) { return c.label + ': ' + c.weight + '%'; }).join(' | ') + '</div></div>' +
      '<div class="card" style="padding:20px;border-top:3px solid #ffd600"><h4 style="font-size:15px;margin-bottom:12px">' + CLUB_CATEGORIES.NON_TECHNICAL + '</h4>' +
        '<div style="font-size:13px;color:var(--text-tertiary);line-height:2">' + nonTechClubs.length + ' clubs | ' + nonTechLogs + ' logs</div>' +
        '<div style="margin-top:12px;font-size:11px;color:var(--text-muted)">' + NON_TECHNICAL_CRITERIA.map(function (c) { return c.label + ': ' + c.weight + '%'; }).join(' | ') + '</div></div>' +
    '</div>' +
    '<h4 style="font-size:14px;margin-bottom:12px">Event Level Multipliers</h4>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">' +
    Object.keys(EVENT_LEVELS).map(function (key) {
      var info = EVENT_LEVELS[key];
      var count = CLUBS_DATA.filter(function (c) { return c.eventLevel === key; }).length;
      return '<div class="card" style="padding:14px;border-left:3px solid ' + info.color + '"><div style="font-weight:600;font-size:13px;margin-bottom:4px">' + info.label + '</div>' +
        '<div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;color:' + info.color + '">x' + info.multiplier + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px">' + count + ' clubs</div></div>';
    }).join('') + '</div>';
}

// ---- Review Logs ----
function renderReviewLogs() {
  var clubFilter = document.getElementById('reviewClubFilter');
  CLUBS_DATA.forEach(function (club) {
    var opt = document.createElement('option');
    opt.value = club.id;
    opt.textContent = club.name;
    clubFilter.appendChild(opt);
  });
  clubFilter.addEventListener('change', renderReviewQueue);
  renderReviewQueue();
}

function filterReviews(status, btn) {
  currentReviewFilter = status;
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderReviewQueue();
}

function renderReviewQueue() {
  var clubFilter = document.getElementById('reviewClubFilter').value;
  var allLogs = clubFilter ? getLogsByClub(clubFilter) : getAllLogs();
  var logs = currentReviewFilter === 'all' ? allLogs : allLogs.filter(function (l) { return l.status === currentReviewFilter; });

  var queue = document.getElementById('reviewQueue');
  if (logs.length === 0) {
    queue.innerHTML = '<div class="empty-state"><h3>' + (currentReviewFilter === 'pending' ? 'All caught up!' : 'No logs found.') + '</h3><p>' + (currentReviewFilter === 'pending' ? 'No pending reviews at the moment.' : 'No logs match the current filter.') + '</p></div>';
    return;
  }

  queue.innerHTML = logs.map(function (log) {
    var student = getUserById(log.studentId);
    var club = getClubById(log.clubId);
    var isPending = log.status === 'pending';
    var statusInfo = getStatusDisplay(log.status);
    var clubCriteria = club ? getEvaluationCriteria(club.id) : [];

    return '<div class="review-card" id="review-' + log.id + '">' +
      '<div class="review-card-header"><div class="review-student"><div class="student-avatar">' + (student ? getInitials(student.name) : '??') + '</div><div>' +
        '<div class="student-name">' + (student ? student.name : 'Unknown') + (student ? ' (' + student.rollNumber + ')' : '') + '</div>' +
        '<div class="student-meta">' + (club ? club.name : '') + ' | ' + (club ? club.category : '') + '</div></div></div>' +
      '<span class="status-badge ' + statusInfo.badge + '">' + statusInfo.label + '</span></div>' +
      '<div class="review-card-body"><p class="review-description">' + log.description + '</p>' +
        '<div class="review-meta"><span class="review-meta-item">' + formatDate(log.date) + '</span>' +
          '<span class="review-meta-item">' + log.timeIn + ' - ' + log.timeOut + '</span>' +
          '<span class="review-meta-item">' + formatHours(log.duration) + '</span>' +
          '<span class="review-meta-item">' + log.category + '</span>' +
          '<span class="review-meta-item">' + getEventLevelInfo(log.eventLevel || 'club-internal').label + '</span></div>' +
        (log.proofUrl ? '<div class="review-proofs"><div class="review-proof-thumb"><span style="font-size:1rem">' + (log.proofType === 'photo' ? 'IMG' : log.proofType === 'github' ? 'CODE' : 'FILE') + '</span></div></div>' : '') + '</div>' +
      (isPending ? '<div class="review-card-footer">' +
        '<div class="review-eval-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
        clubCriteria.map(function (c) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:rgba(255,255,255,0.03);border-radius:6px">' +
            '<span style="font-size:11px;color:var(--text-secondary)">' + c.label + ' (' + c.weight + '%)</span>' +
            '<div class="star-rating" id="eval-' + log.id + '-' + c.id + '">' +
            [1,2,3,4,5].map(function (i) { return '<span class="star" data-value="' + i + '" onclick="setEvalScore(\'' + log.id + '\',\'' + c.id + '\',' + i + ')">&#9733;</span>'; }).join('') +
            '</div></div>';
        }).join('') + '</div>' +
        '<div class="review-comment"><input type="text" id="feedback-' + log.id + '" placeholder="Add feedback..."></div>' +
        '<div class="review-actions">' +
          '<button class="btn btn-success btn-sm" onclick="approveLog(\'' + log.id + '\')">Approve</button>' +
          '<button class="btn btn-outline btn-sm" onclick="requestRevision(\'' + log.id + '\')">Request Revision</button>' +
          '<button class="btn btn-danger btn-sm" onclick="rejectLog(\'' + log.id + '\')">Reject</button></div></div>'
      : '<div class="review-card-footer"><div style="font-size:12px;color:var(--text-muted)">' + (log.feedback ? 'Feedback: "' + log.feedback + '"' : '') + '</div></div>') +
      '</div>';
  }).join('');
}

var evalScores = {};
function setEvalScore(logId, criteriaId, value) {
  if (!evalScores[logId]) evalScores[logId] = {};
  evalScores[logId][criteriaId] = value;
  var stars = document.querySelectorAll('#eval-' + logId + '-' + criteriaId + ' .star');
  stars.forEach(function (star) { star.classList.toggle('active', parseInt(star.dataset.value) <= value); });
}

function approveLog(logId) {
  var scores = evalScores[logId] || {};
  if (Object.keys(scores).length === 0) { showToast('Please evaluate at least one criteria before approving.', 'warning'); return; }
  var feedback = (document.getElementById('feedback-' + logId) || {}).value || 'Approved.';
  updateLog(logId, { status: 'approved', evaluation: scores, feedback: feedback });
  showToast('Log approved successfully.', 'success');
  var card = document.getElementById('review-' + logId);
  if (card) { card.style.opacity = '0'; card.style.transform = 'translateX(30px)'; card.style.transition = 'all 0.3s ease'; }
  setTimeout(renderReviewQueue, 300);
}

function requestRevision(logId) {
  var feedback = (document.getElementById('feedback-' + logId) || {}).value || 'Please revise and resubmit.';
  updateLog(logId, { status: 'revision', feedback: feedback });
  showToast('Revision requested.', 'info');
  setTimeout(renderReviewQueue, 300);
}

function rejectLog(logId) {
  var feedback = (document.getElementById('feedback-' + logId) || {}).value || 'Log rejected.';
  updateLog(logId, { status: 'rejected', feedback: feedback });
  showToast('Log rejected.', 'error');
  setTimeout(renderReviewQueue, 300);
}

// ---- Manage Clubs ----
function renderManageClubs() { renderClubGrid('all'); }

function filterClubs(filter, btn) {
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
  btn.classList.add('active');
  renderClubGrid(filter);
}

function renderClubGrid(filter) {
  var clubs = CLUBS_DATA;
  if (filter === 'technical') clubs = getClubsByCategory(CLUB_CATEGORIES.TECHNICAL);
  else if (filter === 'non-technical') clubs = getClubsByCategory(CLUB_CATEGORIES.NON_TECHNICAL);
  else if (EVENT_LEVELS[filter]) clubs = CLUBS_DATA.filter(function (c) { return c.eventLevel === filter; });

  document.getElementById('clubGrid').innerHTML = clubs.map(function (club) {
    var evtInfo = getEventLevelInfo(club.eventLevel);
    var students = getStudentsByClub(club.id);
    var logs = getLogsByClub(club.id);
    return '<div class="club-card"><div class="club-card-header"><div><div class="club-name">' + club.name + '</div>' +
      '<div class="club-category">' + club.category + '</div></div>' +
      '<span class="badge badge-primary" style="font-size:10px">' + evtInfo.label + ' x' + evtInfo.multiplier + '</span></div>' +
      '<p style="font-size:12px;color:var(--text-tertiary);margin-bottom:8px">' + club.description + '</p>' +
      '<div class="club-stats"><span>' + students.length + ' students</span><span>' + logs.length + ' logs</span></div></div>';
  }).join('');
}

// ---- Manage Users ----
function renderManageUsers() {
  var allUsers = getAllUsers();
  function renderTable(users) {
    document.getElementById('usersTableBody').innerHTML = users.map(function (user) {
      var clubNames = (user.clubs || []).map(function (id) { var c = getClubById(id); return c ? c.name : id; });
      return '<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="user-avatar ' + user.role + '" style="width:32px;height:32px;font-size:11px">' + getInitials(user.name) + '</div><div>' +
        '<div style="font-weight:600;font-size:14px;color:var(--text-primary)">' + user.name + '</div>' +
        (user.rollNumber ? '<div style="font-size:11px;color:var(--text-muted)">' + user.rollNumber + '</div>' : '') +
        '</div></div></td><td style="font-size:13px">' + user.email + '</td>' +
        '<td><span class="badge badge-' + (user.role === 'admin' ? 'danger' : 'primary') + '">' + (user.role === 'admin' ? 'Admin' : 'Student') + '</span></td>' +
        '<td style="font-size:13px;color:var(--text-secondary)">' + (user.department || '--') + '</td>' +
        '<td><div style="display:flex;flex-wrap:wrap;gap:4px">' + (clubNames.length > 0 ? clubNames.slice(0, 2).map(function (n) { return '<span class="tag">' + n + '</span>'; }).join('') + (clubNames.length > 2 ? '<span class="tag">+' + (clubNames.length - 2) + '</span>' : '') : '<span style="color:var(--text-muted);font-size:12px">--</span>') + '</div></td>' +
        '<td style="font-size:12px;color:var(--text-tertiary)">' + formatDate(user.createdAt) + '</td></tr>';
    }).join('');
  }
  renderTable(allUsers);
  function applyFilters() {
    var filtered = allUsers;
    var search = document.getElementById('userSearch').value.toLowerCase();
    var role = document.getElementById('userRoleFilter').value;
    if (search) filtered = filtered.filter(function (u) { return u.name.toLowerCase().indexOf(search) !== -1 || u.email.toLowerCase().indexOf(search) !== -1; });
    if (role) filtered = filtered.filter(function (u) { return u.role === role; });
    renderTable(filtered);
  }
  document.getElementById('userSearch').addEventListener('input', debounce(applyFilters));
  document.getElementById('userRoleFilter').addEventListener('change', applyFilters);
}

// ---- Credit Config ----
function renderCreditConfig() {
  var settings = getSettings();
  document.getElementById('semesterStart').value = settings.semesterStart || '';
  document.getElementById('semesterEnd').value = settings.semesterEnd || '';
  document.getElementById('thresholdConfig').innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">' +
      '<div class="card" style="padding:16px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Max Per Semester</div><div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--color-primary-400)">' + CREDIT_CONFIG.maxPerSemester + '</div></div>' +
      '<div class="card" style="padding:16px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Max Per Year</div><div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--color-success-400)">' + CREDIT_CONFIG.maxPerYear + '</div></div>' +
      '<div class="card" style="padding:16px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Max Degree Total</div><div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--color-accent-500)">' + CREDIT_CONFIG.maxDegreeCredits + '</div></div></div>';
  document.getElementById('tierConfig').innerHTML =
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +
      '<div><h4 style="font-size:14px;margin-bottom:12px">Technical Club Criteria</h4><table class="data-table"><thead><tr><th>Criteria</th><th>Weight</th></tr></thead><tbody>' +
        TECHNICAL_CRITERIA.map(function (c) { return '<tr><td>' + c.label + '</td><td style="font-weight:700;color:var(--color-primary-400)">' + c.weight + '%</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div><h4 style="font-size:14px;margin-bottom:12px">Non-Technical Club Criteria</h4><table class="data-table"><thead><tr><th>Criteria</th><th>Weight</th></tr></thead><tbody>' +
        NON_TECHNICAL_CRITERIA.map(function (c) { return '<tr><td>' + c.label + '</td><td style="font-weight:700;color:var(--color-accent-500)">' + c.weight + '%</td></tr>'; }).join('') + '</tbody></table></div></div>';
}

function saveConfig() {
  updateSettings({ semesterStart: document.getElementById('semesterStart').value, semesterEnd: document.getElementById('semesterEnd').value });
  showToast('Configuration saved.', 'success');
}

// ---- Reports ----
function generateReport(type) {
  var output = document.getElementById('reportOutput');
  var title = document.getElementById('reportTitle');
  var content = document.getElementById('reportContent');
  output.style.display = 'block';

  if (type === 'semester') {
    title.textContent = 'Semester Credit Report';
    var students = getAllUsers().filter(function (u) { return u.role === 'student'; });
    var html = '<table class="data-table"><thead><tr><th>Student</th><th>Roll No.</th><th>Club</th><th>Category</th><th>Quality</th><th>Credits</th></tr></thead><tbody>';
    students.forEach(function (s) {
      (s.clubs || []).forEach(function (clubId) {
        var credit = calculateStudentCredit(s.id, clubId);
        if (!credit) return;
        html += '<tr><td style="font-weight:500">' + s.name + '</td><td>' + s.rollNumber + '</td><td><span class="badge badge-primary">' + credit.clubName + '</span></td><td>' + credit.category + '</td><td>' + credit.qualityScore + '%</td><td style="font-weight:700;color:var(--color-primary-400)">' + credit.earnedCredits + ' / ' + credit.maxSemesterCredits + '</td></tr>';
      });
    });
    html += '</tbody></table>';
    content.innerHTML = html;
  } else if (type === 'club') {
    title.textContent = 'Club Performance Report';
    var html2 = '<table class="data-table"><thead><tr><th>Club</th><th>Category</th><th>Event Level</th><th>Students</th><th>Approved</th><th>Pending</th></tr></thead><tbody>';
    CLUBS_DATA.forEach(function (club) {
      var students2 = getStudentsByClub(club.id);
      var logs = getLogsByClub(club.id);
      html2 += '<tr><td style="font-weight:500">' + club.name + '</td><td>' + club.category + '</td><td>' + getEventLevelInfo(club.eventLevel).label + '</td><td>' + students2.length + '</td><td>' + logs.filter(function (l) { return l.status === 'approved'; }).length + '</td><td>' + logs.filter(function (l) { return l.status === 'pending'; }).length + '</td></tr>';
    });
    html2 += '</tbody></table>';
    content.innerHTML = html2;
  } else if (type === 'awards') {
    title.textContent = 'Awards Shortlist';
    var students3 = getAllUsers().filter(function (u) { return u.role === 'student'; });
    var html3 = '<table class="data-table"><thead><tr><th>Student</th><th>Club</th><th>Award</th></tr></thead><tbody>';
    var hasAwards = false;
    students3.forEach(function (s) {
      calculateAwards(s.id).forEach(function (a) { hasAwards = true; html3 += '<tr><td style="font-weight:500">' + s.name + '</td><td>' + (a.club || 'Overall') + '</td><td>' + a.name + '</td></tr>'; });
    });
    if (!hasAwards) html3 += '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--text-muted)">No awards earned yet.</td></tr>';
    html3 += '</tbody></table>';
    content.innerHTML = html3;
  }
  output.scrollIntoView({ behavior: 'smooth' });
}

function exportCSV() {
  var logs = getAllLogs();
  var headers = ['Log ID', 'Student Name', 'Roll Number', 'Club', 'Category', 'Event Level', 'Date', 'Duration', 'Description', 'Status', 'Quality Score', 'Feedback'];
  var rows = logs.map(function (log) {
    var student = getUserById(log.studentId);
    var club = getClubById(log.clubId);
    return [log.id, student ? student.name : '', student ? student.rollNumber : '', club ? club.name : '', log.category,
      getEventLevelInfo(log.eventLevel || 'club-internal').label, log.date, log.duration,
      '"' + (log.description || '').replace(/"/g, '""') + '"', getStatusDisplay(log.status).label,
      calculateLogScore(log), '"' + (log.feedback || '').replace(/"/g, '""') + '"'].join(',');
  });
  var csv = [headers.join(',')].concat(rows).join('\n');
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'kredit_export_' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
  showToast('CSV exported successfully.', 'success');
}
