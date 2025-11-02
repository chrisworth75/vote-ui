// API Configuration
const API_BASE_URL = 'http://localhost:8085/api';

// API Client
const api = {
    // User endpoints
    async register(username) {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });
        return response.json();
    },

    async login(username) {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });
        return response.json();
    },

    // Poll endpoints
    async getAllPolls() {
        const response = await fetch(`${API_BASE_URL}/polls`);
        return response.json();
    },

    async getPoll(pollId) {
        const response = await fetch(`${API_BASE_URL}/polls/${pollId}`);
        return response.json();
    },

    // Vote endpoints
    async castVote(userId, pollId, optionId) {
        const response = await fetch(`${API_BASE_URL}/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, pollId, optionId }),
        });
        return response.json();
    },

    async getPollResults(pollId) {
        const response = await fetch(`${API_BASE_URL}/votes/results/${pollId}`);
        return response.json();
    },

    async getUserVote(userId, pollId) {
        try {
            const response = await fetch(`${API_BASE_URL}/votes/user/${userId}/poll/${pollId}`);
            if (response.status === 404) {
                return null;
            }
            return response.json();
        } catch (error) {
            return null;
        }
    },
};
