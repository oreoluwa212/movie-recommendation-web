// utils/errorHandler.js
export const getUserFriendlyError = (error, operation = 'perform this action') => {
    // Authentication errors
    if (error.response?.status === 401 ||
        error.message?.toLowerCase().includes('auth') ||
        error.message?.toLowerCase().includes('token') ||
        error.message?.toLowerCase().includes('unauthorized')) {
        return `Please sign in to ${operation}`;
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
        return 'Connection error. Please check your internet and try again';
    }

    // Server errors
    if (error.response?.status >= 500) {
        return 'Server error. Please try again later';
    }

    // Backend error messages
    if (error.response?.data?.message) {
        const backendMessage = error.response.data.message.toLowerCase();

        const errorMappings = {
            'duplicate': 'This item already exists',
            'already exists': 'This item already exists',
            'not found': 'Item not found',
            'validation': 'Please check your input and try again'
        };

        for (const [key, message] of Object.entries(errorMappings)) {
            if (backendMessage.includes(key)) {
                return message;
            }
        }

        return error.response.data.message;
    }

    return `Failed to ${operation}. Please try again`;
};