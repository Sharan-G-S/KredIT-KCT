/* ================================================================
   KredIT - Credit Calculation Engine
   ================================================================ */

function calculateLogScore(log) {
  const club = getClubById(log.clubId);
  if (!club || log.status !== 'approved') return 0;
  const criteria = getEvaluationCriteria(log.clubId);
  const multiplier = getEventMultiplier(log.clubId);
  const evaluation = log.evaluation || {};
  if (Object.keys(evaluation).length === 0) return 0;
  let totalWeightedScore = 0;
  let totalWeight = 0;
  criteria.forEach(c => {
    const score = evaluation[c.id];
    if (score !== undefined && score > 0) {
      totalWeightedScore += (score / 5) * c.weight;
      totalWeight += c.weight;
    }
  });
  if (totalWeight === 0) return 0;
  const baseScore = (totalWeightedScore / totalWeight) * 100;
  return Math.round(baseScore * multiplier * 10) / 10;
}

function calculateStudentCredit(studentId, clubId) {
  const club = getClubById(clubId);
  if (!club) return null;
  const logs = getLogsByStudent(studentId).filter(l => l.clubId === clubId);
  const approvedLogs = logs.filter(l => l.status === 'approved');
  const totalHours = logs.reduce((s, l) => s + (l.duration || 0), 0);
  const approvedHours = approvedLogs.reduce((s, l) => s + (l.duration || 0), 0);
  const logScores = approvedLogs.map(l => calculateLogScore(l));
  const qualityScore = logScores.length > 0
    ? Math.round((logScores.reduce((a, b) => a + b, 0) / logScores.length) * 10) / 10 : 0;
  const contributionPoints = logScores.reduce((a, b) => a + b, 0);
  const multiplier = getEventMultiplier(clubId);
  const semesterCredits = calculateSemesterCredits(contributionPoints, qualityScore, multiplier);
  const eventInfo = getEventLevelInfo(club.eventLevel);
  return {
    clubId, clubName: club.name, category: club.category,
    eventLevel: club.eventLevel, eventLabel: eventInfo.label,
    eventMultiplier: multiplier, totalHours, approvedHours,
    totalActivities: logs.length, approvedActivities: approvedLogs.length,
    qualityScore, contributionPoints: Math.round(contributionPoints),
    earnedCredits: semesterCredits, maxSemesterCredits: CREDIT_CONFIG.maxPerSemester,
    pendingLogs: logs.filter(l => l.status === 'pending').length,
    revisionLogs: logs.filter(l => l.status === 'revision').length,
  };
}

function calculateSemesterCredits(points, quality, multiplier) {
  const baseThresholds = [
    { credits: 0.5, points: 100, quality: 40 },
    { credits: 1.0, points: 250, quality: 50 },
    { credits: 1.5, points: 450, quality: 55 },
    { credits: 2.0, points: 700, quality: 60 },
    { credits: 2.5, points: 1000, quality: 65 },
    { credits: 3.0, points: 1400, quality: 70 },
  ];
  let earned = 0;
  for (const t of baseThresholds) {
    const adjustedPoints = t.points / multiplier;
    if (points >= adjustedPoints && quality >= t.quality) earned = t.credits;
  }
  return Math.min(earned, CREDIT_CONFIG.maxPerSemester);
}

function calculateTotalCredits(studentId) {
  const user = getUserById(studentId);
  if (!user) return { clubs: [], totalEarned: 0, totalMax: 0, degreeMax: CREDIT_CONFIG.maxDegreeCredits };
  const clubs = (user.clubs || []).map(clubId => calculateStudentCredit(studentId, clubId)).filter(Boolean);
  const totalEarned = clubs.reduce((s, c) => s + c.earnedCredits, 0);
  const maxSem = CREDIT_CONFIG.maxPerYear / 2;
  return {
    clubs,
    totalEarned: Math.min(totalEarned, maxSem),
    totalMax: Math.min(CREDIT_CONFIG.maxPerSemester * clubs.length, maxSem),
    degreeMax: CREDIT_CONFIG.maxDegreeCredits,
  };
}

function calculateAwards(studentId) {
  const creditInfo = calculateTotalCredits(studentId);
  const awards = [];
  creditInfo.clubs.forEach(club => {
    if (club.qualityScore >= 90 && club.earnedCredits >= 2.5) {
      awards.push({ ...AWARD_DEFINITIONS.find(a => a.id === 'gold'), club: club.clubName });
    } else if (club.qualityScore >= 80 && club.earnedCredits >= 2) {
      awards.push({ ...AWARD_DEFINITIONS.find(a => a.id === 'silver'), club: club.clubName });
    } else if (club.qualityScore >= 70 && club.earnedCredits >= 1) {
      awards.push({ ...AWARD_DEFINITIONS.find(a => a.id === 'bronze'), club: club.clubName });
    }
  });
  return awards;
}

function getCreditProgress(current, target) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function generateCertificateData(studentId) {
  const user = getUserById(studentId);
  if (!user) return null;
  const creditInfo = calculateTotalCredits(studentId);
  const awards = calculateAwards(studentId);
  const allLogs = getLogsByStudent(studentId).filter(l => l.status === 'approved');
  return {
    studentName: user.name, rollNumber: user.rollNumber,
    department: user.department, year: user.year,
    clubs: creditInfo.clubs.map(c => ({ name: c.clubName, category: c.category, credits: c.earnedCredits, eventLevel: c.eventLabel })),
    totalCredits: creditInfo.totalEarned, maxCredits: CREDIT_CONFIG.maxDegreeCredits,
    totalActivities: allLogs.length,
    totalHours: Math.round(allLogs.reduce((s, l) => s + (l.duration || 0), 0)),
    awards, generatedAt: new Date().toISOString(),
  };
}
