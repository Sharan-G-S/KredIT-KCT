/* ================================================================
   KredIT — Evaluator Portal Application Logic (Updated)
   Serves Core Team, Club President, and Faculty Advisor roles
   ================================================================ */

let currentStatusFilter = 'pending';

// ---- Dashboard ----
function renderEvaluatorDashboard(user) {
  const roleInfo = ROLE_HIERARCHY[user.role] || {};
  document.getElementById('evalSubtitle').textContent = `${user.name} · ${roleInfo.label || user.role} · ${user.department}`;

  const allStudents = getStudentsByClubs(user.clubs);
  const allLogs = getLogsByClubs(user.clubs);
  const myPending = getPendingLogsForRole(user.clubs, user.role);
  const approvedLogs = allLogs.filter(l => l.status === 'approved');
  const totalHours = approvedLogs.reduce((s, l) => s + (l.duration || 0), 0);

  document.getElementById('evalStats').innerHTML = `
    <div class="stat-card blue">
      <div class="stat-icon">👥</div>
      <div class="stat-value">${allStudents.length}</div>
      <div class="stat-label">Students in My Clubs</div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon">⏳</div>
      <div class="stat-value">${myPending.length}</div>
      <div class="stat-label">Awaiting My Review</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">✅</div>
      <div class="stat-value">${approvedLogs.length}</div>
      <div class="stat-label">Fully Approved</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">⏱</div>
      <div class="stat-value">${Math.round(totalHours)}</div>
      <div class="stat-label">Total Hours Tracked</div>
    </div>
  `;

  // Pending preview
  const preview = myPending.slice(0, 5);
  document.getElementById('pendingPreview').innerHTML = preview.length > 0
    ? preview.map(log => {
      const student = getUserById(log.studentId);
      const club = getClubById(log.clubId);
      return `
        <div class="activity-item">
          <div class="activity-dot pending"></div>
          <div class="activity-content">
            <div class="activity-text"><strong>${student ? student.name : 'Unknown'}</strong> — ${log.description.substring(0, 50)}...</div>
            <div class="activity-time">${club ? club.name : ''} · ${formatDate(log.date)} · ${formatHours(log.duration)}</div>
          </div>
        </div>
      `;
    }).join('')
    : '<p style="color: var(--text-muted); text-align: center; padding: 20px;">🎉 No pending reviews for your role!</p>';

  // Clubs overview
  document.getElementById('clubsOverview').innerHTML = user.clubs.map(clubId => {
    const club = getClubById(clubId);
    if (!club) return '';
    const clubStudents = getStudentsByClub(clubId);
    const clubLogs = getLogsByClub(clubId);
    const evtInfo = getEventLevelInfo(club.eventLevel);

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">${club.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${club.category} · ${evtInfo.label}</div>
        </div>
        <div style="display: flex; gap: 16px; font-size: 12px; color: var(--text-tertiary);">
          <span>👥 ${clubStudents.length}</span>
          <span>📋 ${clubLogs.length} logs</span>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Review Logs ----
function renderReviewLogs(user) {
  const clubFilter = document.getElementById('reviewClubFilter');
  user.clubs.forEach(clubId => {
    const club = getClubById(clubId);
    if (club) {
      const opt = document.createElement('option');
      opt.value = club.id;
      opt.textContent = club.name;
      clubFilter.appendChild(opt);
    }
  });

  clubFilter.addEventListener('change', () => renderReviewQueue(user));
  renderReviewQueue(user);
}

function filterReviews(status, btn) {
  currentStatusFilter = status;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const user = getCurrentUser();
  renderReviewQueue(user);
}

function renderReviewQueue(user) {
  const clubFilter = document.getElementById('reviewClubFilter').value;
  let logs;

  if (currentStatusFilter === 'pending') {
    // Show only logs pending for THIS role
    logs = clubFilter
      ? getPendingLogsForRole([clubFilter], user.role)
      : getPendingLogsForRole(user.clubs, user.role);
  } else if (currentStatusFilter === 'approved') {
    logs = clubFilter ? getLogsByClub(clubFilter).filter(l => l.status === 'approved') : getLogsByClubs(user.clubs).filter(l => l.status === 'approved');
  } else {
    logs = clubFilter ? getLogsByClub(clubFilter) : getLogsByClubs(user.clubs);
  }

  const queue = document.getElementById('reviewQueue');

  if (logs.length === 0) {
    queue.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${currentStatusFilter === 'pending' ? '🎉' : '📋'}</div>
        <h3>${currentStatusFilter === 'pending' ? 'All caught up!' : 'No logs found'}</h3>
        <p>${currentStatusFilter === 'pending' ? 'No logs awaiting your review.' : 'No logs match the current filter.'}</p>
      </div>
    `;
    return;
  }

  const criteria = null; // will get per-club
  const isPendingForMe = (log) => {
    const statusMap = { core_team: 'pending_core', president: 'pending_president', faculty_advisor: 'pending_faculty' };
    return log.status === statusMap[user.role];
  };

  queue.innerHTML = logs.map(log => {
    const student = getUserById(log.studentId);
    const club = getClubById(log.clubId);
    const pendingForMe = isPendingForMe(log);
    const statusInfo = getStatusDisplay(log.status);
    const clubCriteria = club ? getEvaluationCriteria(club.id) : [];

    // Approval history
    const historyHtml = (log.approvalHistory || []).map(h => {
      const reviewer = getUserById(h.by);
      return `<span style="font-size: 11px; color: var(--text-muted);">
        ${getRoleIcon(h.role)} ${reviewer ? reviewer.name : h.role} — ${h.action} (${formatDate(h.at)})
      </span><br>`;
    }).join('');

    return `
      <div class="review-card" id="review-${log.id}">
        <div class="review-card-header">
          <div class="review-student">
            <div class="student-avatar">${student ? getInitials(student.name) : '??'}</div>
            <div>
              <div class="student-name">${student ? student.name : 'Unknown'} ${student ? `(${student.rollNumber})` : ''}</div>
              <div class="student-meta">${club ? club.name : ''} · ${club ? club.category : ''}</div>
            </div>
          </div>
          <span class="status-badge ${statusInfo.badge}">${statusInfo.icon} ${statusInfo.label}</span>
        </div>

        <div class="review-card-body">
          <p class="review-description">${log.description}</p>
          <div class="review-meta">
            <span class="review-meta-item">📅 ${formatDate(log.date)}</span>
            <span class="review-meta-item">⏰ ${log.timeIn} – ${log.timeOut}</span>
            <span class="review-meta-item">⏱ ${formatHours(log.duration)}</span>
            <span class="review-meta-item">🏷 ${log.category}</span>
            <span class="review-meta-item">🌍 ${getEventLevelInfo(log.eventLevel || 'club-internal').label}</span>
          </div>
          ${log.proofUrl ? `
            <div class="review-proofs">
              <div class="review-proof-thumb">
                <span style="font-size: 1.5rem;">${log.proofType === 'photo' ? '📸' : log.proofType === 'github' ? '💻' : '📄'}</span>
              </div>
            </div>
          ` : ''}
          ${historyHtml ? `<div style="margin-top: 8px; padding: 8px 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid var(--border-subtle);"><div style="font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Approval History</div>${historyHtml}</div>` : ''}
        </div>

        ${pendingForMe ? `
          <div class="review-card-footer">
            <!-- Evaluation Criteria Scores -->
            <div class="review-eval-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
              ${clubCriteria.map(c => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.03); border-radius: 6px;">
                  <span style="font-size: 11px; color: var(--text-secondary);">${c.label} (${c.weight}%)</span>
                  <div class="star-rating" id="eval-${log.id}-${c.id}">
                    ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}" onclick="setEvalScore('${log.id}', '${c.id}', ${i})">★</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            <div class="review-comment">
              <input type="text" id="feedback-${log.id}" placeholder="Add feedback...">
            </div>
            <div class="review-actions">
              <button class="btn btn-success btn-sm" onclick="approveLog('${log.id}')">✅ Approve</button>
              <button class="btn btn-outline btn-sm" onclick="requestRevision('${log.id}')">🔄 Revision</button>
              <button class="btn btn-danger btn-sm" onclick="rejectLog('${log.id}')">❌ Reject</button>
            </div>
          </div>
        ` : `
          <div class="review-card-footer">
            <div style="font-size: 12px; color: var(--text-muted);">
              ${log.feedback ? `Feedback: "${log.feedback}"` : ''}
            </div>
          </div>
        `}
      </div>
    `;
  }).join('');
}

// Evaluation scores per criteria
let evalScores = {};

function setEvalScore(logId, criteriaId, value) {
  if (!evalScores[logId]) evalScores[logId] = {};
  evalScores[logId][criteriaId] = value;

  const stars = document.querySelectorAll(`#eval-${logId}-${criteriaId} .star`);
  stars.forEach(star => {
    star.classList.toggle('active', parseInt(star.dataset.value) <= value);
  });
}

function approveLog(logId) {
  const user = getCurrentUser();
  const scores = evalScores[logId] || {};

  // Check if any scores are provided (at least one criteria)
  if (Object.keys(scores).length === 0) {
    showToast('Please evaluate at least one criteria before approving', 'warning');
    return;
  }

  const feedback = document.getElementById(`feedback-${logId}`)?.value || 'Approved. Good work!';
  const result = advanceApproval(logId, user.role, user.id, 'approved', feedback, scores);

  if (result) {
    const nextStatus = getStatusDisplay(result.status);
    showToast(`Log approved! → ${nextStatus.label}`, 'success');
    const card = document.getElementById(`review-${logId}`);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateX(30px)';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => renderReviewQueue(user), 300);
    }
  }
}

function requestRevision(logId) {
  const user = getCurrentUser();
  const feedback = document.getElementById(`feedback-${logId}`)?.value || 'Please revise and resubmit.';
  advanceApproval(logId, user.role, user.id, 'revision', feedback, {});
  showToast('Revision requested', 'info');
  setTimeout(() => renderReviewQueue(user), 300);
}

function rejectLog(logId) {
  const user = getCurrentUser();
  const feedback = document.getElementById(`feedback-${logId}`)?.value || 'Log rejected.';
  advanceApproval(logId, user.role, user.id, 'rejected', feedback, {});
  showToast('Log rejected', 'error');
  setTimeout(() => renderReviewQueue(user), 300);
}

// ---- Student Progress ----
function renderStudentProgress(user) {
  const students = getStudentsByClubs(user.clubs);

  function renderTable(studentList) {
    const tbody = document.getElementById('studentTableBody');
    if (studentList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No students found</td></tr>';
      return;
    }

    let rows = '';
    studentList.forEach(student => {
      student.clubs.filter(c => user.clubs.includes(c)).forEach(clubId => {
        const credit = calculateStudentCredit(student.id, clubId);
        if (!credit) return;
        const club = getClubById(clubId);

        rows += `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="user-avatar student" style="width: 32px; height: 32px; font-size: 11px;">${getInitials(student.name)}</div>
                <div>
                  <span style="color: var(--text-primary); font-weight: 500;">${student.name}</span>
                  <div style="font-size: 10px; color: var(--text-muted);">${getRoleLabel(student.role)}</div>
                </div>
              </div>
            </td>
            <td>${student.rollNumber}</td>
            <td><span class="badge badge-primary">${club ? club.name : clubId}</span></td>
            <td>${Math.round(credit.approvedHours)}h</td>
            <td>${credit.approvedActivities}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div class="progress-bar" style="width: 60px; height: 6px;">
                  <div class="progress-bar-fill ${credit.qualityScore >= 70 ? 'green' : credit.qualityScore >= 50 ? 'gold' : 'blue'}" style="width: ${Math.min(100, credit.qualityScore)}%"></div>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary);">${credit.qualityScore}%</span>
              </div>
            </td>
            <td>
              <span style="font-family: var(--font-display); font-weight: 700; color: var(--color-primary-400);">${credit.earnedCredits}</span>
              <span style="color: var(--text-muted); font-size: 12px;">/ ${credit.maxSemesterCredits}</span>
            </td>
          </tr>
        `;
      });
    });

    tbody.innerHTML = rows || '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">No matching students</td></tr>';
  }

  renderTable(students);

  document.getElementById('studentSearch').addEventListener('input', debounce((e) => {
    const q = e.target.value.toLowerCase();
    const filtered = students.filter(s => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q));
    renderTable(filtered);
  }));
}
