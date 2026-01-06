export const getBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) {
        if (import.meta.env.VITE_BACKEND_URL.startsWith('http')) {
            return import.meta.env.VITE_BACKEND_URL;
        } else {
            return `${window.location.protocol}//${import.meta.env.VITE_BACKEND_URL}`;
        }
    }
    return 'http://localhost:10000';
};
