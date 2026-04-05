/* ================================================================
   KredIT - Club Definitions, Evaluation Criteria & Credit Data
   Two-Role System: Student + Admin
   ================================================================ */

const CLUB_CATEGORIES = {
  TECHNICAL: 'Technical',
  NON_TECHNICAL: 'Non-Technical / Cultural'
};

const EVENT_LEVELS = {
  'international': { label: 'International Event', multiplier: 1.5, color: '#ffd600' },
  'national': { label: 'National Event', multiplier: 1.4, color: '#ff1744' },
  'state': { label: 'State Event', multiplier: 1.2, color: '#ff9100' },
  'district': { label: 'District / Local Event', multiplier: 1.0, color: '#00c853' },
  'intra-college': { label: 'Major Intra-College Event', multiplier: 1.0, color: '#2979ff' },
  'club-internal': { label: 'Club Internal', multiplier: 0.8, color: '#78909c' },
};

const TECHNICAL_CRITERIA = [
  { id: 'project', label: 'Project Contribution', weight: 30, description: 'Building prototypes, research projects, technical development' },
  { id: 'innovation', label: 'Technical Innovation', weight: 25, description: 'Novel solutions, patents, published research' },
  { id: 'competition', label: 'Competition Participation', weight: 20, description: 'Hackathons, coding contests, robotics competitions' },
  { id: 'workshop', label: 'Workshop / Event Organization', weight: 15, description: 'Technical workshops, seminars, training sessions' },
  { id: 'teamwork', label: 'Team Collaboration', weight: 10, description: 'Mentoring juniors, teamwork, knowledge sharing' },
];

const NON_TECHNICAL_CRITERIA = [
  { id: 'event-org', label: 'Event Organization', weight: 30, description: 'Cultural festivals, exhibitions, performances' },
  { id: 'leadership', label: 'Leadership Roles', weight: 25, description: 'Leading teams, managing resources, decision making' },
  { id: 'creative', label: 'Creative Contribution', weight: 20, description: 'Design, art, content creation, media production' },
  { id: 'participation', label: 'Participation in Events', weight: 15, description: 'Performing, competing, representing the club' },
  { id: 'teamwork', label: 'Team Collaboration', weight: 10, description: 'Supporting peers, coordination, communication' },
];

const CREDIT_CONFIG = {
  maxDegreeCredits: 25,
  maxPerYear: 6,
  maxPerSemester: 3,
};

const CLUBS_DATA = [
  { id: 'sea-sakthi', name: 'Sea Sakthi', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'international', description: 'Sustainable maritime mobility - Monaco Energy Boat Challenge' },
  { id: 'renew', name: 'Renew', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'international', description: 'International renewable energy and sustainability projects' },
  { id: 'robocon', name: 'Robocon (Q-Botix)', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'national', description: 'ABU Robocon - autonomous & semi-autonomous robotics' },
  { id: 'rover', name: 'Rover Team', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'national', description: 'University Rover Challenge - Mars rover engineering' },
  { id: 'sae', name: 'SAE Team', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'national', description: 'Society of Automotive Engineers competitions' },
  { id: 'acm', name: 'KCT ACM Chapter', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'intra-college', description: 'ACM student chapter - coding, algorithms, hackathons' },
  { id: 'iqube', name: 'iQube', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'intra-college', description: 'Product innovation and disruptive technology lab' },
  { id: 'garage', name: 'Garage', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'intra-college', description: 'Student-led research and prototyping space' },
  { id: 'rc-forum', name: 'KCT RC Forum', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'intra-college', description: 'RC vehicle design, building and aerial systems' },
  { id: 'kciri', name: 'KCIRI', category: CLUB_CATEGORIES.TECHNICAL, eventLevel: 'intra-college', description: 'Kumaraguru Centre for Industrial Research and Innovation' },
  { id: 'drama-troupe', name: 'Drama Troupe', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Theatre, acting, and stage performances' },
  { id: 'admira', name: 'Admira', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Student-led creative and cultural initiatives' },
  { id: 'varnam', name: 'Varnam', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Drawing club & campus decoration during fests' },
  { id: 'studio-kct', name: 'Studio KCT', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Photography and videography for campus events' },
  { id: 'nigal', name: 'Nigal', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Event coverage, photojournalism, and media production' },
  { id: 'haasya', name: 'Haasya', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Comedy and improvisational performance club' },
  { id: 'dance-club', name: 'Dance Club', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Classical and contemporary dance performances' },
  { id: 'music-club', name: 'Music Club', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Vocal and instrumental music ensemble' },
  { id: 'sahitya', name: 'Sahitya', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Literary arts and creative writing forum' },
  { id: 'qubate', name: 'Qubate', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Quizzing and debating society' },
  { id: 'nss', name: 'NSS', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'district', description: 'National Service Scheme - community outreach' },
  { id: 'ncc', name: 'NCC', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'national', description: 'National Cadet Corps - Army & Air Wings' },
  { id: 'rotaract', name: 'Rotaract', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'district', description: 'Rotary-affiliated community service organization' },
  { id: 'nature-club', name: 'Nature Club', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Environmental awareness and campus greening' },
  { id: 'yrc', name: 'Youth Red Cross', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'district', description: 'Health awareness and first aid training' },
  { id: 'vbc', name: 'Volunteer Blood Donation', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'intra-college', description: 'Blood donation drives and health camps' },
  { id: 'road-safety', name: 'Road Safety Patrol', category: CLUB_CATEGORIES.NON_TECHNICAL, eventLevel: 'district', description: 'Road safety awareness and traffic management' },
];

const ACTIVITY_CATEGORIES = [
  'Design', 'Development', 'Testing', 'Research',
  'Meeting', 'Practice', 'Rehearsal', 'Event Organization',
  'Competition', 'Workshop', 'Media Coverage',
  'Documentation', 'Mentoring', 'Outreach',
  'Maintenance', 'Planning', 'Photography',
  'Videography', 'Decoration', 'Performance',
  'Project Work', 'Innovation', 'Social Initiative'
];

const PROOF_TYPES = [
  { id: 'photo', label: 'Event Photos', icon: 'image' },
  { id: 'report', label: 'Project Report', icon: 'file-text' },
  { id: 'github', label: 'GitHub Link', icon: 'code' },
  { id: 'certificate', label: 'Certificate', icon: 'award' },
  { id: 'poster', label: 'Poster / Media', icon: 'image' },
  { id: 'video', label: 'Video', icon: 'video' },
  { id: 'other', label: 'Other Link', icon: 'link' },
];

const AWARD_DEFINITIONS = [
  { id: 'gold', name: 'KredIT Gold', criteria: '90%+ quality with outstanding contribution', tier: 'gold' },
  { id: 'silver', name: 'KredIT Silver', criteria: '80%+ quality with strong contribution', tier: 'silver' },
  { id: 'bronze', name: 'KredIT Bronze', criteria: '70%+ quality with consistent contribution', tier: 'bronze' },
  { id: 'star', name: 'Star Contributor', criteria: 'Most consistent - no gaps greater than 3 days', tier: 'special' },
  { id: 'innovation', name: 'Innovation Champion', criteria: 'Patent, published paper, or competition win', tier: 'special' },
  { id: 'creative', name: 'Creative Excellence', criteria: 'Outstanding non-technical or performing arts work', tier: 'special' },
];

function getClubById(clubId) {
  return CLUBS_DATA.find(c => c.id === clubId);
}

function getClubsByCategory(category) {
  return CLUBS_DATA.filter(c => c.category === category);
}

function getEvaluationCriteria(clubId) {
  const club = getClubById(clubId);
  if (!club) return [];
  return club.category === CLUB_CATEGORIES.TECHNICAL ? TECHNICAL_CRITERIA : NON_TECHNICAL_CRITERIA;
}

function getEventMultiplier(clubId) {
  const club = getClubById(clubId);
  if (!club) return 1;
  return EVENT_LEVELS[club.eventLevel]?.multiplier || 1;
}

function getEventLevelInfo(level) {
  return EVENT_LEVELS[level] || EVENT_LEVELS['club-internal'];
}
