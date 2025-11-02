// Application State
let currentUser = null;
let polls = [];

// DOM Elements
const authSection = document.getElementById('auth-section');
const pollsSection = document.getElementById('polls-section');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authMessage = document.getElementById('auth-message');
const pollsContainer = document.getElementById('polls-container');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    setupEventListeners();
});

function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
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
    authMessage.className = `message ${type}`;
    setTimeout(() => {
        authMessage.textContent = '';
        authMessage.className = 'message';
    }, 3000);
}

function showAuthSection() {
    authSection.style.display = 'block';
    pollsSection.style.display = 'none';
    userInfo.style.display = 'none';
    usernameInput.value = '';
}

async function showPollsSection() {
    authSection.style.display = 'none';
    pollsSection.style.display = 'block';
    userInfo.style.display = 'flex';
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
    }
}

async function createPollCard(poll) {
    const card = document.createElement('div');
    card.className = 'poll-card';
    card.id = `poll-${poll.id}`;

    // Check if user already voted
    const existingVote = await api.getUserVote(currentUser.id, poll.id);
    const hasVoted = existingVote !== null;

    let html = `<h3>${poll.question}</h3>`;

    if (hasVoted) {
        // User has voted - show results only
        html += `<div class="voted-indicator">You voted for: ${existingVote.option.optionLabel} - ${existingVote.option.optionText}</div>`;
        html += `<div class="poll-stats">`;
        html += `<h4>Live Results <span class="vote-count" id="vote-count-${poll.id}"></span></h4>`;
        html += `<div class="chart-container" id="chart-${poll.id}"></div>`;
        html += `</div>`;
        html += `<button class="change-vote-btn" data-poll-id="${poll.id}">Change Vote</button>`;
    } else {
        // User hasn't voted - show voting options
        html += `<div class="poll-options">`;

        poll.options.forEach(option => {
            html += `
                <div class="poll-option" data-option-id="${option.id}">
                    <input type="radio"
                           name="poll-${poll.id}"
                           id="option-${option.id}"
                           value="${option.id}">
                    <label for="option-${option.id}">
                        ${option.optionLabel}. ${option.optionText}
                    </label>
                </div>
            `;
        });

        html += `</div>`;
        html += `<button class="vote-btn" data-poll-id="${poll.id}">Vote</button>`;
        html += `<div class="poll-stats">`;
        html += `<h4>Current Results <span class="vote-count" id="vote-count-${poll.id}"></span></h4>`;
        html += `<div class="chart-container" id="chart-${poll.id}"></div>`;
        html += `</div>`;
    }

    card.innerHTML = html;

    // Add event listeners
    const voteBtn = card.querySelector('.vote-btn');
    if (voteBtn) {
        voteBtn.addEventListener('click', () => handleVote(poll.id));
    }

    const changeVoteBtn = card.querySelector('.change-vote-btn');
    if (changeVoteBtn) {
        changeVoteBtn.addEventListener('click', () => showVotingOptions(poll.id));
    }

    const radioInputs = card.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const options = card.querySelectorAll('.poll-option');
            options.forEach(opt => opt.classList.remove('selected'));
            const selectedOption = card.querySelector(`[data-option-id="${e.target.value}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        });
    });

    // Load and render results
    await loadPollResults(poll.id);

    // Start auto-refresh for this poll
    startPollRefresh(poll.id);

    return card;
}

function showVotingOptions(pollId) {
    const poll = polls.find(p => p.id === pollId);
    const pollCard = document.getElementById(`poll-${pollId}`);

    let html = `<h3>${poll.question}</h3>`;
    html += `<div class="poll-options">`;

    poll.options.forEach(option => {
        html += `
            <div class="poll-option" data-option-id="${option.id}">
                <input type="radio"
                       name="poll-${poll.id}"
                       id="option-${option.id}"
                       value="${option.id}">
                <label for="option-${option.id}">
                    ${option.optionLabel}. ${option.optionText}
                </label>
            </div>
        `;
    });

    html += `</div>`;
    html += `<button class="vote-btn" data-poll-id="${poll.id}">Vote</button>`;
    html += `<div class="poll-stats">`;
    html += `<h4>Current Results <span class="vote-count" id="vote-count-${poll.id}"></span></h4>`;
    html += `<div class="chart-container" id="chart-${poll.id}"></div>`;
    html += `</div>`;

    pollCard.innerHTML = html;

    // Re-add event listeners
    const voteBtn = pollCard.querySelector('.vote-btn');
    voteBtn.addEventListener('click', () => handleVote(poll.id));

    const radioInputs = pollCard.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const options = pollCard.querySelectorAll('.poll-option');
            options.forEach(opt => opt.classList.remove('selected'));
            const selectedOption = pollCard.querySelector(`[data-option-id="${e.target.value}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        });
    });

    loadPollResults(poll.id);
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
            label: option.optionLabel,
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
