// Application State
let currentUser = null;
let polls = [];

// DOM Elements
const authSection = document.getElementById('auth-section');
const pollsSection = document.getElementById('polls-section');
const profileSection = document.getElementById('profile-section');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileBtn = document.getElementById('profile-btn');
const pollsBtn = document.getElementById('polls-btn');
const authMessage = document.getElementById('auth-message');
const pollsContainer = document.getElementById('polls-container');
const votingHistory = document.getElementById('voting-history');
const profileStats = document.getElementById('profile-stats');
const userSearch = document.getElementById('user-search');
const searchResults = document.getElementById('search-results');
const profileTitle = document.getElementById('profile-title');
const votingHistoryTitle = document.getElementById('voting-history-title');
const themeSelector = document.getElementById('theme-selector');

let currentProfileUserId = null;

// Theme management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'default';
    themeSelector.value = savedTheme;
    applyTheme(savedTheme);
}

function changeTheme(theme) {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const themeLink = document.querySelector('link[href*="themes/"]');
    themeLink.href = `css/themes/${theme}.css`;
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkExistingSession();
    setupEventListeners();
});

function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    profileBtn.addEventListener('click', () => showProfileSection(currentUser.id));
    pollsBtn.addEventListener('click', showPollsSection);

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    themeSelector.addEventListener('change', (e) => {
        changeTheme(e.target.value);
    });

    // User search with autocomplete
    let searchTimeout;
    userSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
            searchResults.classList.add('d-none');
            return;
        }

        searchTimeout = setTimeout(async () => {
            const users = await api.searchUsers(query);
            displaySearchResults(users);
        }, 300);
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!userSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('d-none');
        }
    });
}

function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPollsSection();
    }
}

async function handleLogin() {
    const username = usernameInput.value.trim();
    if (!username) {
        showMessage('Please enter a username', 'error');
        return;
    }

    try {
        const user = await api.login(username);
        if (user.error) {
            showMessage(user.error, 'error');
        } else {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showMessage('Login successful!', 'success');
            setTimeout(() => showPollsSection(), 500);
        }
    } catch (error) {
        showMessage('Login failed. Please try again.', 'error');
    }
}

async function handleRegister() {
    const username = usernameInput.value.trim();
    if (!username) {
        showMessage('Please enter a username', 'error');
        return;
    }

    try {
        const user = await api.register(username);
        if (user.error) {
            showMessage(user.error, 'error');
        } else {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            showMessage('Registration successful!', 'success');
            setTimeout(() => showPollsSection(), 500);
        }
    } catch (error) {
        showMessage('Registration failed. Please try again.', 'error');
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showAuthSection();
}

function showMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = type === 'error' ? 'alert alert-danger' : 'alert alert-success';
    setTimeout(() => {
        authMessage.textContent = '';
        authMessage.className = '';
    }, 3000);
}

function showAuthSection() {
    authSection.classList.remove('d-none');
    pollsSection.classList.add('d-none');
    profileSection.classList.add('d-none');
    userInfo.classList.add('d-none');
    usernameInput.value = '';
}

async function showPollsSection() {
    authSection.classList.add('d-none');
    pollsSection.classList.remove('d-none');
    profileSection.classList.add('d-none');
    userInfo.classList.remove('d-none');
    pollsBtn.classList.add('d-none');
    usernameDisplay.textContent = currentUser.username;

    await loadPolls();
}

async function loadPolls() {
    try {
        polls = await api.getAllPolls();
        renderPolls();
    } catch (error) {
        console.error('Failed to load polls:', error);
    }
}

async function renderPolls() {
    pollsContainer.innerHTML = '';

    for (const poll of polls) {
        const pollCard = await createPollCard(poll);
        pollsContainer.appendChild(pollCard);

        // Now that card is in DOM, load results and start auto-refresh
        await loadPollResults(poll.id);
        startPollRefresh(poll.id);
    }
}

async function createPollCard(poll) {
    const wrapper = document.createElement('div');
    wrapper.className = 'col-md-6';

    const card = document.createElement('div');
    card.className = 'card h-100';
    card.id = `poll-${poll.id}`;

    // Check if user already voted
    const existingVote = await api.getUserVote(currentUser.id, poll.id);
    const hasVoted = existingVote !== null;

    let html = `<div class="card-body">`;
    html += `<h3 class="card-title h5">${poll.question}</h3>`;

    if (hasVoted) {
        // User has voted - show results only (no voting options)
        html += `<div class="alert alert-success mb-3">You voted for: ${existingVote.option.optionText}</div>`;
        html += `<h4 class="h6">Live Results <span class="vote-count" id="vote-count-${poll.id}"></span></h4>`;
        html += `<div class="chart-container" id="chart-${poll.id}"></div>`;
        html += `<button class="btn btn-sm btn-outline-secondary mt-3 w-100" data-poll-id="${poll.id}">Change Vote</button>`;
    } else {
        // User hasn't voted - show voting options only (no results)
        html += `<div class="mb-3">`;

        poll.options.forEach(option => {
            html += `
                <div class="form-check mb-2 p-2 border rounded poll-option" data-option-id="${option.id}">
                    <input class="form-check-input" type="radio"
                           name="poll-${poll.id}"
                           id="option-${option.id}"
                           value="${option.id}">
                    <label class="form-check-label" for="option-${option.id}">
                        ${option.optionText}
                    </label>
                </div>
            `;
        });

        html += `</div>`;
        html += `<button class="btn btn-primary w-100" data-poll-id="${poll.id}">Vote</button>`;
    }

    html += `</div>`;
    card.innerHTML = html;

    // Add event listeners
    const voteBtn = card.querySelector('button[data-poll-id]');
    if (voteBtn && voteBtn.textContent === 'Vote') {
        voteBtn.addEventListener('click', () => handleVote(poll.id));
    }

    const changeVoteBtn = card.querySelector('button[data-poll-id]');
    if (changeVoteBtn && changeVoteBtn.textContent === 'Change Vote') {
        changeVoteBtn.addEventListener('click', () => showVotingOptions(poll.id));
    }

    const radioInputs = card.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const options = card.querySelectorAll('.poll-option');
            options.forEach(opt => opt.classList.remove('bg-light'));
            const selectedOption = card.querySelector(`[data-option-id="${e.target.value}"]`);
            if (selectedOption) {
                selectedOption.classList.add('bg-light');
            }
        });
    });

    wrapper.appendChild(card);
    return wrapper;
}

function showVotingOptions(pollId) {
    const poll = polls.find(p => p.id === pollId);
    const pollCard = document.getElementById(`poll-${pollId}`);

    let html = `<div class="card-body">`;
    html += `<h3 class="card-title h5">${poll.question}</h3>`;
    html += `<div class="mb-3">`;

    poll.options.forEach(option => {
        html += `
            <div class="form-check mb-2 p-2 border rounded poll-option" data-option-id="${option.id}">
                <input class="form-check-input" type="radio"
                       name="poll-${poll.id}"
                       id="option-${option.id}"
                       value="${option.id}">
                <label class="form-check-label" for="option-${option.id}">
                    ${option.optionText}
                </label>
            </div>
        `;
    });

    html += `</div>`;
    html += `<button class="btn btn-primary w-100" data-poll-id="${poll.id}">Vote</button>`;
    html += `</div>`;

    pollCard.innerHTML = html;

    // Re-add event listeners
    const voteBtn = pollCard.querySelector('button[data-poll-id]');
    voteBtn.addEventListener('click', () => handleVote(poll.id));

    const radioInputs = pollCard.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const options = pollCard.querySelectorAll('.poll-option');
            options.forEach(opt => opt.classList.remove('bg-light'));
            const selectedOption = pollCard.querySelector(`[data-option-id="${e.target.value}"]`);
            if (selectedOption) {
                selectedOption.classList.add('bg-light');
            }
        });
    });
}

async function handleVote(pollId) {
    const selectedOption = document.querySelector(`input[name="poll-${pollId}"]:checked`);

    if (!selectedOption) {
        alert('Please select an option');
        return;
    }

    const optionId = parseInt(selectedOption.value);

    try {
        await api.castVote(currentUser.id, pollId, optionId);

        // Reload the specific poll
        await loadPollResults(pollId);

        // Update the poll card to show voted state
        const poll = polls.find(p => p.id === pollId);
        const pollCard = document.getElementById(`poll-${pollId}`);
        const updatedCard = await createPollCard(poll);
        pollCard.replaceWith(updatedCard);

    } catch (error) {
        console.error('Failed to cast vote:', error);
        alert('Failed to cast vote. Please try again.');
    }
}

// Store refresh intervals
const pollRefreshIntervals = {};

async function loadPollResults(pollId) {
    try {
        const results = await api.getPollResults(pollId);
        const poll = polls.find(p => p.id === pollId);

        if (!poll) return;

        // Transform results into chart data
        const chartData = poll.options.map(option => ({
            text: option.optionText,
            count: results[option.id] || 0
        }));

        // Calculate total votes
        const totalVotes = chartData.reduce((sum, option) => sum + option.count, 0);

        // Update vote count display
        const voteCountElement = document.getElementById(`vote-count-${pollId}`);
        if (voteCountElement) {
            voteCountElement.textContent = `(${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'})`;
        }

        renderPieChart(`chart-${pollId}`, chartData);
    } catch (error) {
        console.error('Failed to load poll results:', error);
    }
}

function startPollRefresh(pollId) {
    // Clear existing interval if any
    if (pollRefreshIntervals[pollId]) {
        clearInterval(pollRefreshIntervals[pollId]);
    }

    // Refresh every 3 seconds
    pollRefreshIntervals[pollId] = setInterval(() => {
        loadPollResults(pollId);
    }, 3000);
}

function stopAllPollRefresh() {
    Object.values(pollRefreshIntervals).forEach(interval => {
        clearInterval(interval);
    });
}

// Profile functions
async function showProfileSection(userId) {
    authSection.classList.add('d-none');
    pollsSection.classList.add('d-none');
    profileSection.classList.remove('d-none');
    pollsBtn.classList.remove('d-none');
    currentProfileUserId = userId;

    stopAllPollRefresh();
    await loadProfileData(userId);
}

function displaySearchResults(users) {
    if (users.length === 0) {
        searchResults.innerHTML = '<div class="p-3 text-center text-muted fst-italic">No users found</div>';
        searchResults.classList.remove('d-none');
        return;
    }

    searchResults.innerHTML = '';
    users.forEach(user => {
        const resultItem = document.createElement('div');
        resultItem.className = 'p-2 border-bottom search-result-item';
        resultItem.style.cursor = 'pointer';
        resultItem.textContent = user.username;
        resultItem.addEventListener('click', () => {
            userSearch.value = '';
            searchResults.classList.add('d-none');
            showProfileSection(user.id);
        });
        searchResults.appendChild(resultItem);
    });
    searchResults.classList.remove('d-none');
}

async function loadProfileData(userId) {
    try {
        const user = await api.getUserById(userId);
        const userVotes = await api.getAllUserVotes(userId);
        const allPolls = await api.getAllPolls();

        // Update profile title
        const isOwnProfile = userId === currentUser.id;
        profileTitle.textContent = isOwnProfile ? 'My Profile' : `${user.username}'s Profile`;
        votingHistoryTitle.textContent = isOwnProfile ? 'My Voting History' : 'Voting History';

        // Calculate stats
        const totalVotes = userVotes.length;
        const totalPolls = allPolls.length;
        const votingRate = totalPolls > 0 ? ((totalVotes / totalPolls) * 100).toFixed(1) : 0;

        // Display stats
        profileStats.innerHTML = `
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h2 class="display-4">${totalVotes}</h2>
                        <p class="text-muted mb-0">Total Votes</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h2 class="display-4">${totalPolls}</h2>
                        <p class="text-muted mb-0">Total Polls</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card text-center">
                    <div class="card-body">
                        <h2 class="display-4">${votingRate}%</h2>
                        <p class="text-muted mb-0">Participation Rate</p>
                    </div>
                </div>
            </div>
        `;

        // Display voting history
        if (userVotes.length === 0) {
            const message = isOwnProfile
                ? 'You haven\'t voted on any polls yet.'
                : `${user.username} hasn't voted on any polls yet.`;
            votingHistory.innerHTML = `<p class="text-center text-muted fst-italic py-5">${message}</p>`;
            return;
        }

        votingHistory.innerHTML = '';

        for (const vote of userVotes) {
            const historyCard = document.createElement('div');
            historyCard.className = 'card mb-3';

            const poll = vote.poll;
            const option = vote.option;

            historyCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${poll.question}</h5>
                    <p class="mb-2">
                        <span class="text-muted">${isOwnProfile ? 'Your' : 'Their'} choice:</span>
                        <strong class="ms-2">${option.optionText}</strong>
                    </p>
                    <small class="text-muted">Voted on ${new Date(vote.votedAt).toLocaleDateString()}</small>
                </div>
            `;

            votingHistory.appendChild(historyCard);
        }
    } catch (error) {
        console.error('Failed to load profile data:', error);
        votingHistory.innerHTML = '<p class="error">Failed to load voting history.</p>';
    }
}
