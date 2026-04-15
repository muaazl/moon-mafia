import axios from 'axios';

// ASSESSMENT: Interoperability — Axios instance configured for cross-origin communication with the backend.
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://moon-mafia.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});
