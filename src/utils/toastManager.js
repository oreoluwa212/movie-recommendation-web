// utils/toastManager.js
import { toast } from 'react-toastify';

export class ToastManager {
    constructor() {
        this.activeToasts = new Set();
        this.toastTimeout = 100;
    }

    show(type, message, options = {}) {
        const key = `${type}-${message}`;

        if (this.activeToasts.has(key)) {
            return;
        }

        this.activeToasts.add(key);

        setTimeout(() => {
            this.activeToasts.delete(key);
        }, this.toastTimeout);

        const toastMethods = {
            success: toast.success,
            error: toast.error,
            info: toast.info,
            warning: toast.warning,
            default: toast
        };

        return (toastMethods[type] || toastMethods.default)(message, options);
    }

    success(message, options = {}) {
        return this.show('success', message, options);
    }

    error(message, options = {}) {
        return this.show('error', message, options);
    }

    info(message, options = {}) {
        return this.show('info', message, options);
    }

    warning(message, options = {}) {
        return this.show('warning', message, options);
    }
}

export const toastManager = new ToastManager();
