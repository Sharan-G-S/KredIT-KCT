/* ================================================================
   KredIT - Student Portal Application Logic (No Emojis)
   ================================================================ */

function renderStudentDashboard(user) {
  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('welcomeTitle').textContent = greeting;
  document.getElementById('studentGreeting').textContent = 'Hello, ' + user.name.split(' ')[0] + '!';
  document.getElementById('studentInfo').textContent = user.rollNumber + ' | ' + user.department + ' | Year ' + user.year;

  var clubNames = (user.clubs || []).map(function (id) { var c = getClubById(id); return c ? c.name : id; });
  document.getElementById('studentMeta').innerHTML = '<span class="meta-item">' + clubNames.join(', ') + '</span>';

  var creditData = calculateTotalCredits(user.id);
  var maxSem = CREDIT_CONFIG.maxPerYear / 2;
  var totalPct = maxSem > 0 ? Math.round((creditData.totalEarned / maxSem) * 100) : 0;
  document.getElementById('mainProgressRing').innerHTML =
    createProgressRing(140, 10, Math.min(totalPct, 100), '#2979ff') +
    '<div class="progress-ring-text"><div class="ring-value">' + creditData.totalEarned + '</div><div class="ring-label">of ' + maxSem + ' credits</div></div>';

  var allLogs = getLogsByStudent(user.id);
  var approvedLogs = allLogs.filter(function (l) { return l.status === 'approved'; });
  var pendingLogs = allLogs.filter(function (l) { return l.status === 'pending'; });
  var totalHours = allLogs.reduce(function (s, l) { return s + (l.duration || 0); }, 0);
  var scores = approvedLogs.map(function (l) { return calculateLogScore(l); }).filter(function (s) { return s > 0; });
  var avgQuality = scores.length > 0 ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : 0;

  document.getElementById('statsGrid').innerHTML =
    '<div class="stat-card blue"><div class="stat-value">' + Math.round(totalHours) + '</div><div class="stat-label">Total Hours Logged</div></div>' +
    '<div class="stat-card green"><div class="stat-value">' + approvedLogs.length + '</div><div class="stat-label">Approved Entries</div></div>' +
    '<div class="stat-card gold"><div class="stat-value">' + pendingLogs.length + '</div><div class="stat-label">Pending Review</div></div>' +
    '<div class="stat-card red"><div class="stat-value">' + avgQuality + '%</div><div class="stat-label">Quality Score</div></div>';

  // Club progress
  var clubHtml = '';
  creditData.clubs.forEach(function (club) {
    var pct = getCreditProgress(club.earnedCredits, club.maxSemesterCredits);
    clubHtml += '<div class="progress-bar-container">' +
      '<div class="progress-bar-label"><span>' + club.clubName + ' <span class="badge badge-primary" style="margin-left:6px;font-size:10px">' + club.category + '</span></span>' +
      '<span>' + club.earnedCredits + ' / ' + club.maxSemesterCredits + ' credits</span></div>' +
      '<div class="progress-bar"><div class="progress-bar-fill blue" style="width:' + pct + '%"></div></div></div>';
  });
  if (!clubHtml) clubHtml = '<p style="color:var(--text-muted);font-size:14px;text-align:center;padding:24px">No club data yet. Submit your first log.</p>';
  document.getElementById('clubProgressList').innerHTML = clubHtml;

  // Activity feed
  var recentLogs = allLogs.slice(0, 8);
  var feedHtml = '';
  recentLogs.forEach(function (log) {
    var club = getClubById(log.clubId);
    var statusInfo = getStatusDisplay(log.status);
    feedHtml += '<div class="activity-item"><div class="activity-dot ' + (statusInfo.badge === 'success' ? 'approved' : 'pending') + '"></div>' +
      '<div class="activity-content"><div class="activity-text">' + log.description.substring(0, 60) + (log.description.length > 60 ? '...' : '') + '</div>' +
      '<div class="activity-time">' + (club ? club.name : '') + ' | ' + formatDate(log.date) + ' | ' + formatHours(log.duration) + '</div></div>' +
      '<span class="status-badge ' + statusInfo.badge + '">' + statusInfo.label + '</span></div>';
  });
  if (!feedHtml) feedHtml = '<p style="color:var(--text-muted);font-size:14px;text-align:center;padding:24px">No activity yet.</p>';
  document.getElementById('activityFeed').innerHTML = feedHtml;
}

function initLogEntryForm(user) {
  var clubSelect = document.getElementById('logClub');
  (user.clubs || []).forEach(function (clubId) {
    var club = getClubById(clubId);
    if (club) {
      var opt = document.createElement('option');
      opt.value = club.id;
      opt.textContent = club.name + ' (' + club.category + ' | ' + getEventLevelInfo(club.eventLevel).label + ')';
      clubSelect.appendChild(opt);
    }
  });
  document.getElementById('logDate').value = new Date().toISOString().split('T')[0];

  var timeIn = document.getElementById('logTimeIn');
  var timeOut = document.getElementById('logTimeOut');
  var durDisplay = document.getElementById('durationDisplay');
  function updateDuration() {
    if (timeIn.value && timeOut.value) {
      durDisplay.querySelector('.duration-value').textContent = formatHours(calculateDuration(timeIn.value, timeOut.value));
    }
  }
  timeIn.addEventListener('change', updateDuration);
  timeOut.addEventListener('change', updateDuration);

  var tagContainer = document.getElementById('categoryTags');
  var selectedCategory = '';
  ACTIVITY_CATEGORIES.forEach(function (cat) {
    var tag = document.createElement('span');
    tag.className = 'category-tag';
    tag.textContent = cat;
    tag.addEventListener('click', function () {
      tagContainer.querySelectorAll('.category-tag').forEach(function (t) { t.classList.remove('selected'); });
      tag.classList.add('selected');
      selectedCategory = cat;
    });
    tagContainer.appendChild(tag);
  });

  var proofInput = document.getElementById('proofFileInput');
  var proofPreview = document.getElementById('proofPreview');
  proofInput.addEventListener('change', function () {
    proofPreview.innerHTML = '';
    Array.from(proofInput.files).forEach(function (file) {
      var item = document.createElement('div');
      item.className = 'proof-item';
      if (file.type.startsWith('image/')) {
        var reader = new FileReader();
        reader.onload = function (e) { item.innerHTML = '<img src="' + e.target.result + '" alt="proof"><button class="proof-remove" onclick="this.parentElement.remove()">&times;</button>'; };
        reader.readAsDataURL(file);
      } else {
        item.innerHTML = '<span class="proof-file-icon">PDF</span><button class="proof-remove" onclick="this.parentElement.remove()">&times;</button>';
      }
      proofPreview.appendChild(item);
    });
  });

  document.getElementById('logEntryForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var clubId = clubSelect.value;
    var date = document.getElementById('logDate').value;
    var tIn = timeIn.value;
    var tOut = timeOut.value;
    var description = document.getElementById('logDescription').value.trim();
    var proofLink = document.getElementById('proofLink').value.trim();

    if (!clubId || !date || !tIn || !tOut || !description) { showToast('Please fill in all required fields.', 'error'); return; }
    if (!selectedCategory) { showToast('Please select an activity category.', 'error'); return; }
    var duration = calculateDuration(tIn, tOut);
    if (duration <= 0) { showToast('Time Out must be after Time In.', 'error'); return; }
    var hasFile = proofInput.files && proofInput.files.length > 0;
    if (!hasFile && !proofLink) { showToast('Please upload proof or provide a proof link.', 'error'); return; }

    var club = getClubById(clubId);
    createLog({ studentId: user.id, clubId: clubId, date: date, timeIn: tIn, timeOut: tOut, duration: duration, description: description, category: selectedCategory, eventLevel: club ? club.eventLevel : 'club-internal', proofType: hasFile ? 'photo' : 'github', proofUrl: proofLink || 'uploaded-file' });
    showToast('Log submitted successfully. Pending admin review.', 'success');
    setTimeout(function () { window.location.href = 'my-logs.html'; }, 1000);
  });
}

function renderMyLogs(user) {
  var allLogs = getLogsByStudent(user.id);
  var clubFilter = document.getElementById('logsFilterClub');
  (user.clubs || []).forEach(function (clubId) {
    var club = getClubById(clubId);
    if (club) { var opt = document.createElement('option'); opt.value = club.id; opt.textContent = club.name; clubFilter.appendChild(opt); }
  });

  function renderTable(logs) {
    var tbody = document.getElementById('logsTableBody');
    if (logs.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No logs found.</td></tr>'; return; }
    tbody.innerHTML = logs.map(function (log) {
      var club = getClubById(log.clubId);
      var statusInfo = getStatusDisplay(log.status);
      var score = calculateLogScore(log);
      return '<tr><td style="color:var(--text-primary);font-weight:500">' + formatDate(log.date) + '</td>' +
        '<td><span class="badge badge-primary">' + (club ? club.name : log.clubId) + '</span></td>' +
        '<td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + log.description + '">' + log.description + '</td>' +
        '<td>' + formatHours(log.duration) + '</td><td><span class="tag">' + log.category + '</span></td>' +
        '<td><span class="status-badge ' + statusInfo.badge + '">' + statusInfo.label + '</span></td>' +
        '<td style="font-size:13px;color:' + (score > 0 ? 'var(--color-accent-500)' : 'var(--text-muted)') + '">' + (score > 0 ? score + '%' : '--') + '</td></tr>';
    }).join('');
  }
  renderTable(allLogs);

  function applyFilters() {
    var filtered = allLogs;
    var search = document.getElementById('logsSearch').value.toLowerCase();
    var cId = clubFilter.value;
    var status = document.getElementById('logsFilterStatus').value;
    if (search) filtered = filtered.filter(function (l) { return l.description.toLowerCase().indexOf(search) !== -1; });
    if (cId) filtered = filtered.filter(function (l) { return l.clubId === cId; });
    if (status) filtered = filtered.filter(function (l) { return l.status === status; });
    renderTable(filtered);
  }
  document.getElementById('logsSearch').addEventListener('input', debounce(applyFilters));
  clubFilter.addEventListener('change', applyFilters);
  document.getElementById('logsFilterStatus').addEventListener('change', applyFilters);
}

function renderCreditTracker(user) {
  var creditData = calculateTotalCredits(user.id);
  var maxSem = CREDIT_CONFIG.maxPerYear / 2;
  var totalPct = maxSem > 0 ? Math.round((creditData.totalEarned / maxSem) * 100) : 0;

  document.getElementById('totalCreditCard').innerHTML =
    '<h3>Semester Credit Progress</h3>' +
    '<div style="display:flex;align-items:center;justify-content:center;gap:48px;flex-wrap:wrap;margin-top:16px">' +
      '<div class="progress-ring-container">' + createProgressRing(180, 14, Math.min(totalPct, 100), '#2979ff') +
        '<div class="progress-ring-text"><div class="ring-value">' + creditData.totalEarned + '</div><div class="ring-label">of ' + maxSem + ' credits</div></div></div>' +
      '<div class="credit-breakdown">' +
        '<div class="credit-item"><div class="credit-value" style="color:var(--color-primary-400)">' + creditData.totalEarned + '</div><div class="credit-label">This Semester</div></div>' +
        '<div class="credit-item"><div class="credit-value" style="color:var(--color-success-400)">' + CREDIT_CONFIG.maxPerYear + '</div><div class="credit-label">Max Per Year</div></div>' +
        '<div class="credit-item"><div class="credit-value" style="color:var(--color-accent-500)">' + CREDIT_CONFIG.maxDegreeCredits + '</div><div class="credit-label">Max Degree Total</div></div>' +
      '</div></div>';

  var container = document.getElementById('clubTrackers');
  var html = '';
  creditData.clubs.forEach(function (club) {
    var criteria = getEvaluationCriteria(club.clubId);
    var pct = getCreditProgress(club.earnedCredits, club.maxSemesterCredits);
    html += '<div class="card mb-6" style="padding:28px"><div class="flex items-center justify-between mb-4"><div>' +
      '<h3 style="font-size:1.15rem">' + club.clubName + '</h3>' +
      '<p style="font-size:13px;color:var(--text-tertiary);margin-top:2px">' + club.category + ' | ' + club.eventLabel + ' | x' + club.eventMultiplier + ' multiplier</p></div>' +
      '<div style="text-align:right"><div style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--color-primary-400)">' + club.earnedCredits + '</div>' +
      '<div style="font-size:11px;color:var(--text-muted)">of ' + club.maxSemesterCredits + ' semester credits</div></div></div>' +
      '<div class="tracker-grid"><div class="tracker-progress">' +
        '<div class="progress-bar-container"><div class="progress-bar-label"><span>Hours Logged</span><span>' + Math.round(club.approvedHours) + 'h approved</span></div><div class="progress-bar"><div class="progress-bar-fill blue" style="width:' + Math.min(100, club.approvedHours / 2) + '%"></div></div></div>' +
        '<div class="progress-bar-container"><div class="progress-bar-label"><span>Activities Completed</span><span>' + club.approvedActivities + ' approved</span></div><div class="progress-bar"><div class="progress-bar-fill green" style="width:' + Math.min(100, club.approvedActivities * 5) + '%"></div></div></div>' +
        '<div class="progress-bar-container"><div class="progress-bar-label"><span>Quality Score</span><span>' + club.qualityScore + '%</span></div><div class="progress-bar"><div class="progress-bar-fill gold" style="width:' + Math.min(100, club.qualityScore) + '%"></div></div></div>' +
      '</div><div class="tracker-progress"><h4 style="font-size:13px;margin-bottom:12px;color:var(--text-secondary)">Evaluation Criteria (' + club.category + ')</h4>' +
      criteria.map(function (c) { return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--border-subtle)"><span style="color:var(--text-secondary)">' + c.label + '</span><span style="color:var(--color-primary-400);font-weight:600">' + c.weight + '%</span></div>'; }).join('') +
      '</div></div>' +
      (club.pendingLogs > 0 ? '<p style="font-size:12px;color:var(--color-warning-400);margin-top:12px">' + club.pendingLogs + ' log(s) pending review</p>' : '') +
      '</div>';
  });
  if (!html) html = '<div class="empty-state"><h3>No clubs yet</h3><p>Join a club and start logging to see your credit progress.</p></div>';
  container.innerHTML = html;
}

function renderAchievements(user) {
  var awards = calculateAwards(user.id);
  var earnedContainer = document.getElementById('earnedAwards');
  if (awards.length === 0) {
    earnedContainer.innerHTML = '<div class="card" style="grid-column:1/-1;text-align:center;padding:40px"><p style="color:var(--text-tertiary);font-size:14px">Keep logging quality work to earn awards.</p></div>';
  } else {
    earnedContainer.innerHTML = awards.map(function (a) {
      return '<div class="achievement-card earned"><div class="achievement-name">' + a.name + '</div><div class="achievement-desc">' + (a.club ? 'Earned in ' + a.club : a.criteria) + '</div></div>';
    }).join('');
  }
  var allContainer = document.getElementById('allAwards');
  allContainer.innerHTML = AWARD_DEFINITIONS.map(function (a) {
    var earned = awards.find(function (e) { return e.id === a.id; });
    return '<div class="achievement-card ' + (earned ? 'earned' : 'locked') + '">' + (!earned ? '<span class="locked-overlay">Locked</span>' : '') +
      '<div class="achievement-name">' + a.name + '</div><div class="achievement-desc">' + a.criteria + '</div></div>';
  }).join('');

  // Certificate button
  var certBtn = document.createElement('div');
  certBtn.className = 'card';
  certBtn.style.cssText = 'padding:24px;text-align:center;margin-top:32px';
  certBtn.innerHTML = '<h3 style="font-size:1.1rem;margin-bottom:8px">Co-Curricular Certificate</h3>' +
    '<p style="font-size:13px;color:var(--text-tertiary);margin-bottom:16px">Generate your digital certificate summarizing all club contributions and credits earned.</p>' +
    '<button class="btn btn-accent" onclick="downloadCertificate(\'' + user.id + '\')">Generate Certificate</button>';
  allContainer.parentElement.appendChild(certBtn);
}

function downloadCertificate(studentId) {
  var certData = generateCertificateData(studentId);
  if (!certData) { showToast('Could not generate certificate.', 'error'); return; }
  var certHTML = '<!DOCTYPE html><html><head><title>KredIT Certificate - ' + certData.studentName + '</title><style>' +
    'body{font-family:Georgia,serif;margin:0;padding:40px;background:#fff;color:#1a237e}' +
    '.cert{max-width:800px;margin:0 auto;border:3px double #1a237e;padding:50px;text-align:center}' +
    '.cert h1{font-size:2.5rem;color:#1a237e;margin-bottom:4px}.cert h2{font-size:1rem;color:#666;font-weight:normal;margin-bottom:30px}' +
    '.cert .name{font-size:2rem;color:#2979ff;border-bottom:2px solid #ffd600;display:inline-block;padding-bottom:4px;margin:20px 0}' +
    '.cert .details{text-align:left;margin:30px 0;font-size:14px;line-height:2}' +
    '.cert .credits{font-size:2rem;font-weight:bold;color:#1a237e}' +
    '.cert .footer{display:flex;justify-content:space-around;margin-top:40px;font-size:12px;color:#666}' +
    '.cert .footer div{text-align:center}.cert .footer .line{width:150px;border-top:1px solid #333;margin:0 auto 8px}' +
    '@media print{body{padding:0}}</style></head><body><div class="cert">' +
    '<h1>KredIT</h1><h2>Kumaraguru College of Technology, Coimbatore</h2><h2>Co-Curricular Contribution Certificate</h2>' +
    '<p>This is to certify that</p><div class="name">' + certData.studentName + '</div>' +
    '<p>Roll No: ' + certData.rollNumber + ' | Department: ' + certData.department + ' | Year: ' + certData.year + '</p>' +
    '<div class="details"><strong>Clubs & Teams:</strong> ' + certData.clubs.map(function (c) { return c.name + ' (' + c.category + ')'; }).join(', ') + '<br>' +
    '<strong>Total Credits Earned:</strong> <span class="credits">' + certData.totalCredits + '</span> / ' + certData.maxCredits + '<br>' +
    '<strong>Total Activities:</strong> ' + certData.totalActivities + ' | <strong>Total Hours:</strong> ' + certData.totalHours + 'h<br>' +
    '<strong>Awards:</strong> ' + (certData.awards.length > 0 ? certData.awards.map(function (a) { return a.name; }).join(', ') : 'None yet') + '</div>' +
    '<div class="footer"><div><div class="line"></div>Club President</div><div><div class="line"></div>Faculty Advisor</div><div><div class="line"></div>Institutional Authority</div></div>' +
    '<p style="margin-top:30px;font-size:10px;color:#999">Generated on ' + formatDate(certData.generatedAt) + ' via KredIT Platform</p>' +
    '</div><script>window.print();<\/script></body></html>';
  var blob = new Blob([certHTML], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
  showToast('Certificate generated.', 'success');
}
