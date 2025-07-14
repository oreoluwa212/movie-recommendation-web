// utils/themeManager.js
export class ThemeManager {
    static applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.remove('dark');
            root.classList.add('light');
        } else {
            root.classList.remove('light');
            root.classList.add('dark');
        }
        localStorage.setItem('theme', theme);
    }

    static getStoredTheme() {
        return localStorage.getItem('theme') || 'dark';
    }

    static initializeTheme(theme) {
        this.applyTheme(theme);
    }
}