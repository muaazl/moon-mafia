import axios from 'axios';

// ASSESSMENT: "Interoperability - This configuration manages the cross-origin communication between the frontend client and our backend server."
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://moon-mafia.onrender.com',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});
