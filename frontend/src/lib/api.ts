import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://moon-mafia.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});
