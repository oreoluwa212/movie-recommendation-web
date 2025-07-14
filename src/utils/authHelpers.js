// utils/authHelpers.js
export const isAuthenticated = () => {
    return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
};

export const clearAuthTokens = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
};