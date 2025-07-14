// utils/requestCache.js
export class RequestCache {
    constructor() {
        this.cache = new Map();
        this.timeouts = new Map();
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, promise, ttl = 30000) {
        this.cache.set(key, promise);

        const timeout = setTimeout(() => {
            this.delete(key);
        }, ttl);

        this.timeouts.set(key, timeout);
    }

    delete(key) {
        this.cache.delete(key);
        const timeout = this.timeouts.get(key);
        if (timeout) {
            clearTimeout(timeout);
            this.timeouts.delete(key);
        }
    }

    clear() {
        this.cache.clear();
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        this.timeouts.clear();
    }

    has(key) {
        return this.cache.has(key);
    }
}

export const requestCache = new RequestCache();
