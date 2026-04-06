/* ================================================================
   KredIT - Credit Calculation Engine
   Redesigned: Hour-based accumulation over a full year.
   Credits grow day by day as approved logs pile up.
   ================================================================

   CREDIT FORMULA:
   ─────────────────────────────────────────────────────────────
   qualityHourScore = Σ (approvedLog.hours × log_quality_0_to_1)
   adjustedScore    = qualityHourScore × eventMultiplier
   earnedCredits    = min(3, adjustedScore / TARGET_SCORE × 3)

   TARGET_SCORE = 300  (quality-adjusted hours needed for full 3 credits)

   Example targets over a semester (~26 weeks):
     6 days/week × 6h average × 90% quality × 1.4x national = 3 credits ✓
     3 days/week × 3h average × 70% quality × 1.0x local   = ~1.6 credits ✓
     1 day at any hours                                       = ~0.05–0.2  ✓
   ─────────────────────────────────────────────────────────────ё */

var CREDIT_TARGET_SCORE = 300; // quality-hour points needed for 3 credits

/* ------------------------------------------------------------------
   calculateLogScore(log)
   Returns quality % (0–100) for a single approved log based on
   admin's per-criteria star ratings.
------------------------------------------------------------------ */
function calculateLogScore(log) {
  var club = getClubById(log.clubId);
  if (!club || log.status !== 'approved') return 0;
  var criteria = getEvaluationCriteria(log.clubId);
  var evaluation = log.evaluation || {};
  if (Object.keys(evaluation).length === 0) return 0;

  var totalWeightedScore = 0;
  var totalWeight = 0;
  criteria.forEach(function (c) {
    var score = evaluation[c.id] || 0;
    totalWeightedScore += (score / 5) * c.weight;
    totalWeight += c.weight;
  });
  if (totalWeight === 0) return 0;
  return Math.round((totalWeightedScore / totalWeight) * 100); // 0–100
}

/* ------------------------------------------------------------------
   calculateStudentCredit(studentId, clubId)
   Main credit calculator for one student in one club.
   Returns all progress data used by the UI.
------------------------------------------------------------------ */
function calculateStudentCredit(studentId, clubId) {
  var club = getClubById(clubId);
  if (!club) return null;

  var allLogs     = getLogsByStudent(studentId).filter(function (l) { return l.clubId === clubId; });
  var approvedLogs = allLogs.filter(function (l) { return l.status === 'approved'; });

  var totalHours    = allLogs.reduce(function (s, l) { return s + (l.duration || 0); }, 0);
  var approvedHours = approvedLogs.reduce(function (s, l) { return s + (l.duration || 0); }, 0);
  var multiplier    = getEventMultiplier(clubId);

  /* Quality scores per log (0.0–1.0) */
  var logData = approvedLogs.map(function (l) {
    return {
      hours:   l.duration || 0,
      quality: calculateLogScore(l) / 100   // normalise to 0.0–1.0
    };
  });

  /* Average quality across all approved logs */
  var avgQuality = logData.length > 0
    ? logData.reduce(function (s, d) { return s + d.quality; }, 0) / logData.length
    : 0;

  /* Core accumulator: Σ(hours × quality) — grows every time a log is approved */
  var rawQualityHours = logData.reduce(function (s, d) { return s + (d.hours * d.quality); }, 0);

  /* Apply event-level multiplier (international/national clubs earn credits faster) */
  var adjustedScore = rawQualityHours * multiplier;

  /* Scale to credits: 0 → TARGET → 3 credits (linear, capped at max) */
  var rawCredits   = (adjustedScore / CREDIT_TARGET_SCORE) * CREDIT_CONFIG.maxPerSemester;
  var earnedCredits = Math.min(
    CREDIT_CONFIG.maxPerSemester,
    Math.floor(rawCredits * 100) / 100     // floor to 2 dp so it never rounds up unfairly
  );

  var qualityScore    = Math.round(avgQuality * 100);          // 0–100 %
  var progressPercent = Math.min(100, Math.round((adjustedScore / CREDIT_TARGET_SCORE) * 100));

  var eventInfo = getEventLevelInfo(club.eventLevel);
  return {
    clubId:             clubId,
    clubName:           club.name,
    category:           club.category,
    eventLevel:         club.eventLevel,
    eventLabel:         eventInfo.label,
    eventMultiplier:    multiplier,
    totalHours:         totalHours,
    approvedHours:      approvedHours,
    totalActivities:    allLogs.length,
    approvedActivities: approvedLogs.length,
    qualityScore:       qualityScore,
    adjustedScore:      Math.round(adjustedScore * 10) / 10,
    targetScore:        CREDIT_TARGET_SCORE,
    progressPercent:    progressPercent,
    earnedCredits:      earnedCredits,
    maxSemesterCredits: CREDIT_CONFIG.maxPerSemester,
    pendingLogs:        allLogs.filter(function (l) { return l.status === 'pending'; }).length,
    revisionLogs:       allLogs.filter(function (l) { return l.status === 'revision'; }).length,
  };
}

/* ------------------------------------------------------------------
   calculateTotalCredits(studentId)
   Aggregates credits across all clubs (capped at semester/year limits).
------------------------------------------------------------------ */
function calculateTotalCredits(studentId) {
  var user = getUserById(studentId);
  if (!user) return { clubs: [], totalEarned: 0, totalMax: 0, degreeMax: CREDIT_CONFIG.maxDegreeCredits };

  var clubs = (user.clubs || [])
    .map(function (clubId) { return calculateStudentCredit(studentId, clubId); })
    .filter(Boolean);

  var totalEarned = clubs.reduce(function (s, c) { return s + c.earnedCredits; }, 0);

  /* Cap at per-semester max across all clubs */
  var semMax = CREDIT_CONFIG.maxPerSemester * clubs.length;
  var yearCap = CREDIT_CONFIG.maxPerYear;
  totalEarned = Math.min(totalEarned, yearCap);

  return {
    clubs:        clubs,
    totalEarned:  Math.round(totalEarned * 100) / 100,
    totalMax:     Math.min(semMax, yearCap),
    degreeMax:    CREDIT_CONFIG.maxDegreeCredits,
  };
}

/* ------------------------------------------------------------------
   Awards — based on quality + earned credits thresholds
------------------------------------------------------------------ */
function calculateAwards(studentId) {
  var creditInfo = calculateTotalCredits(studentId);
  var awards = [];
  creditInfo.clubs.forEach(function (club) {
    var gold   = AWARD_DEFINITIONS.find(function (a) { return a.id === 'gold'; });
    var silver = AWARD_DEFINITIONS.find(function (a) { return a.id === 'silver'; });
    var bronze = AWARD_DEFINITIONS.find(function (a) { return a.id === 'bronze'; });
    if (club.qualityScore >= 88 && club.earnedCredits >= 2.5) {
      if (gold) awards.push(Object.assign({}, gold, { club: club.clubName }));
    } else if (club.qualityScore >= 75 && club.earnedCredits >= 1.5) {
      if (silver) awards.push(Object.assign({}, silver, { club: club.clubName }));
    } else if (club.qualityScore >= 60 && club.earnedCredits >= 0.5) {
      if (bronze) awards.push(Object.assign({}, bronze, { club: club.clubName }));
    }
  });
  return awards;
}

function getCreditProgress(current, target) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/* ------------------------------------------------------------------
   Certificate generation
------------------------------------------------------------------ */
function generateCertificateData(studentId) {
  var user = getUserById(studentId);
  if (!user) return null;
  var creditInfo = calculateTotalCredits(studentId);
  var awards     = calculateAwards(studentId);
  var allLogs    = getLogsByStudent(studentId).filter(function (l) { return l.status === 'approved'; });
  return {
    studentName:     user.name,
    rollNumber:      user.rollNumber,
    department:      user.department,
    year:            user.year,
    clubs:           creditInfo.clubs.map(function (c) {
      return { name: c.clubName, category: c.category, credits: c.earnedCredits, eventLevel: c.eventLabel };
    }),
    totalCredits:    creditInfo.totalEarned,
    maxCredits:      CREDIT_CONFIG.maxDegreeCredits,
    totalActivities: allLogs.length,
    totalHours:      Math.round(allLogs.reduce(function (s, l) { return s + (l.duration || 0); }, 0)),
    awards:          awards,
    generatedAt:     new Date().toISOString(),
  };
}
