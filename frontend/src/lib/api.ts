import axios from 'axios';

export const api = axios.create({
    baseURL: 'https://moon-mafia.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});
