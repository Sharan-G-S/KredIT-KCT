/* ================================================================
   KredIT - Authentication (Student + Admin Only, Microsoft MSAL)
   ================================================================ */

const MSAL_CONFIG = {
  auth: {
    clientId: 'YOUR_AZURE_AD_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false }
};

let msalInstance = null;

function initMSAL() {
  if (typeof msal !== 'undefined' && msal.PublicClientApplication) {
    try {
      msalInstance = new msal.PublicClientApplication(MSAL_CONFIG);
      return true;
    } catch (e) { /* Dev mode fallback */ }
  }
  return false;
}

async function microsoftLogin() {
  if (!msalInstance) {
    showToast('Microsoft SSO not configured. Use email login below.', 'info');
    return;
  }
  try {
    var response = await msalInstance.loginPopup({ scopes: ['User.Read'], prompt: 'select_account' });
    if (response && response.account) {
      var email = response.account.username;
      if (!email.endsWith('@kct.ac.in')) {
        showToast('Please use your @kct.ac.in Microsoft account.', 'error');
        await msalInstance.logoutPopup();
        return;
      }
      var user = getUserByEmail(email);
      if (user) {
        setCurrentUser(user);
        showToast('Welcome back, ' + user.name + '!', 'success');
        setTimeout(function () { redirectToPortal(user.role); }, 500);
      } else {
        // Auto-create student account
        var graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { 'Authorization': 'Bearer ' + response.accessToken }
        });
        var profile = await graphRes.json();
        var newUser = createUser({
          name: profile.displayName || email.split('@')[0],
          email: email, password: '', role: 'student',
          department: profile.department || '', year: 1,
          rollNumber: '', clubs: [],
        });
        setCurrentUser(newUser);
        showToast('Account created. Please complete your profile.', 'success');
        setTimeout(function () { window.location.href = getBasePath() + 'signup.html?prefill=true'; }, 800);
      }
    }
  } catch (error) {
    if (error.errorCode === 'user_cancelled') showToast('Login cancelled.', 'info');
    else showToast('Microsoft login failed. Use email login.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var currentUser = getCurrentUser();
  if (currentUser && (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/'))) {
    redirectToPortal(currentUser.role);
    return;
  }
  initMSAL();
  initAuthPage();
});

function initAuthPage() {
  var msBtn = document.getElementById('microsoftLoginBtn');
  if (msBtn) msBtn.addEventListener('click', microsoftLogin);

  var loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  var signupForm = document.getElementById('signupForm');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  var toggleBtns = document.querySelectorAll('.toggle-btn');
  toggleBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = btn.parentElement.querySelector('input');
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });

  initClubChips();
}

function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value.trim();
  var password = document.getElementById('loginPassword').value;

  if (!email || !password) { showToast('Please fill in all fields.', 'error'); return; }
  if (!email.endsWith('@kct.ac.in')) { showToast('Please use your @kct.ac.in email address.', 'error'); return; }

  var user = getUserByEmail(email);

  // Admin login
  if (email.toLowerCase() === 'sharan.admin@kct.ac.in') {
    if (!user) { showToast('Admin account not found.', 'error'); return; }
    if (user.password !== password) { showToast('Incorrect password.', 'error'); return; }
    setCurrentUser(user);
    showToast('Welcome, ' + user.name + '.', 'success');
    setTimeout(function () { redirectToPortal('admin'); }, 500);
    return;
  }

  // Student login
  if (user) {
    if (user.password !== password) { showToast('Incorrect password.', 'error'); return; }
    if (user.role !== 'student') { showToast('This email is reserved for admin access.', 'error'); return; }
    setCurrentUser(user);
    showToast('Welcome back, ' + user.name + '!', 'success');
    setTimeout(function () { redirectToPortal('student'); }, 500);
  } else {
    showToast('No account found. Please sign up first.', 'error');
  }
}

function handleSignup(e) {
  e.preventDefault();
  var name = document.getElementById('signupName').value.trim();
  var rollNumber = document.getElementById('signupRoll').value.trim();
  var department = document.getElementById('signupDept').value;
  var year = parseInt(document.getElementById('signupYear').value);
  var email = document.getElementById('signupEmail').value.trim();
  var password = document.getElementById('signupPassword').value;
  var confirmPassword = document.getElementById('signupConfirmPassword') ? document.getElementById('signupConfirmPassword').value : password;
  var selectedClubs = [];
  document.querySelectorAll('.club-chip.selected').forEach(function (chip) {
    selectedClubs.push(chip.dataset.clubId);
  });

  if (!name || !rollNumber || !department || !year || !email || !password) {
    showToast('Please fill in all required fields.', 'error'); return;
  }
  if (!email.endsWith('@kct.ac.in')) { showToast('Please use your @kct.ac.in email.', 'error'); return; }
  if (email.toLowerCase() === 'sharan.admin@kct.ac.in') { showToast('This email is reserved.', 'error'); return; }
  if (selectedClubs.length === 0) { showToast('Please select at least one club.', 'error'); return; }
  if (password.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return; }
  if (password !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
  if (getUserByEmail(email)) { showToast('An account with this email already exists.', 'error'); return; }

  var newUser = createUser({ name: name, rollNumber: rollNumber, department: department, year: year, email: email, password: password, role: 'student', clubs: selectedClubs });
  setCurrentUser(newUser);
  showToast('Account created successfully!', 'success');
  setTimeout(function () { redirectToPortal('student'); }, 800);
}

function initClubChips() {
  var container = document.getElementById('clubChipsContainer');
  if (!container) return;

  [CLUB_CATEGORIES.TECHNICAL, CLUB_CATEGORIES.NON_TECHNICAL].forEach(function (cat) {
    var label = document.createElement('div');
    label.className = 'club-chips-label';
    label.textContent = cat;
    container.appendChild(label);

    getClubsByCategory(cat).forEach(function (club) {
      var chip = document.createElement('span');
      chip.className = 'club-chip';
      chip.dataset.clubId = club.id;
      chip.textContent = club.name;
      chip.addEventListener('click', function () { chip.classList.toggle('selected'); });
      container.appendChild(chip);
    });
  });
}
