/**
 * Universal Dialog & Notification System
 * Replaces native alert(), prompt(), and console logs with modern UX.
 */

type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export const DialogSystem = {
    /**
     * Show a modern alert modal.
     */
    alert: (message: string, title: string = 'Notification'): Promise<void> => {
        return new Promise((resolve) => {
            const modal = document.getElementById('universal-alert-modal')!;
            const titleEl = document.getElementById('ua-title')!;
            const messageEl = document.getElementById('ua-message')!;
            const okBtn = document.getElementById('ua-ok-btn')!;
            const closeBtn = document.getElementById('close-ua-btn')!;

            titleEl.textContent = title;
            messageEl.textContent = message;
            modal.classList.remove('hidden');

            const cleanup = () => {
                modal.classList.add('hidden');
                okBtn.removeEventListener('click', handleOk);
                closeBtn.removeEventListener('click', handleOk);
                resolve();
            };

            const handleOk = () => cleanup();
            okBtn.addEventListener('click', handleOk);
            closeBtn.addEventListener('click', handleOk);
        });
    },

    /**
     * Show a modern prompt modal.
     */
    prompt: (message: string, defaultValue: string = '', title: string = 'Input Required'): Promise<string | null> => {
        return new Promise((resolve) => {
            const modal = document.getElementById('universal-prompt-modal')!;
            const titleEl = document.getElementById('up-title')!;
            const messageEl = document.getElementById('up-message')!;
            const inputEl = document.getElementById('up-input') as HTMLInputElement;
            const submitBtn = document.getElementById('up-submit-btn')!;
            const cancelBtn = document.getElementById('up-cancel-btn')!;
            const closeBtn = document.getElementById('close-up-btn')!;

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.value = defaultValue;
            modal.classList.remove('hidden');
            setTimeout(() => inputEl.focus(), 100);

            const cleanup = (value: string | null) => {
                modal.classList.add('hidden');
                submitBtn.removeEventListener('click', handleSubmit);
                cancelBtn.removeEventListener('click', handleCancel);
                closeBtn.removeEventListener('click', handleCancel);
                resolve(value);
            };

            const handleSubmit = () => cleanup(inputEl.value);
            const handleCancel = () => cleanup(null);

            submitBtn.addEventListener('click', handleSubmit);
            cancelBtn.addEventListener('click', handleCancel);
            closeBtn.addEventListener('click', handleCancel);

            // Enter key support
            inputEl.onkeydown = (e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') handleCancel();
            };
        });
    },

    /**
     * Show a modern confirmation modal.
     */
    confirm: (message: string, title: string = 'Confirmation'): Promise<boolean> => {
        return new Promise((resolve) => {
            const modal = document.getElementById('universal-prompt-modal')!;
            const titleEl = document.getElementById('up-title')!;
            const messageEl = document.getElementById('up-message')!;
            const inputEl = document.getElementById('up-input')!;
            const submitBtn = document.getElementById('up-submit-btn')!;
            const cancelBtn = document.getElementById('up-cancel-btn')!;
            const closeBtn = document.getElementById('close-up-btn')!;

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.style.display = 'none'; // Hide input for confirm
            submitBtn.textContent = 'Yes';
            cancelBtn.textContent = 'No';
            modal.classList.remove('hidden');

            const cleanup = (result: boolean) => {
                modal.classList.add('hidden');
                submitBtn.removeEventListener('click', handleYes);
                cancelBtn.removeEventListener('click', handleNo);
                closeBtn.removeEventListener('click', handleNo);

                // Restore defaults
                inputEl.style.display = 'block';
                submitBtn.textContent = 'Submit';
                cancelBtn.textContent = 'Cancel';
                resolve(result);
            };

            const handleYes = () => cleanup(true);
            const handleNo = () => cleanup(false);

            submitBtn.addEventListener('click', handleYes);
            cancelBtn.addEventListener('click', handleNo);
            closeBtn.addEventListener('click', handleNo);
        });
    },

    /**
     * Show a sleek toast notification.
     */
    toast: (message: string, level: ToastLevel = 'info', duration: number = 3000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${level}`;

        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${titles[level]}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Intercept console methods to use Toasts automatically.
     */
    initConsoleProxy: () => {
        const _warn = console.warn;
        const _error = console.error;

        console.warn = (...args) => {
            _warn(...args);
            DialogSystem.toast(args.join(' '), 'warning');
        };

        console.error = (...args) => {
            _error(...args);
            DialogSystem.toast(args.join(' '), 'error');
        };

        console.info = (...args) => {
            DialogSystem.toast(args.join(' '), 'info');
        };
    }
};
