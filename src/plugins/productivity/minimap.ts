import { EditorSDK } from '../../core/sdk';

export const MinimapPlugin = {
    name: 'minimap',
    init: (sdk: EditorSDK) => {
        // --- 1. DOM Infrastructure ---
        if (!document.getElementById('minimap-container')) {
            const container = document.createElement('div');
            container.id = 'minimap-container';
            container.className = 'minimap-container';
            container.style.display = 'none'; // Hidden by default
            container.innerHTML = `
                <div class="minimap-content">
                    <div id="minimap-viewport" class="minimap-viewport"></div>
                    <div class="minimap-rail"></div>
                    <div id="minimap-handle" class="minimap-handle"></div>
                </div>
            `;
            document.body.appendChild(container);

            // --- 2. Interaction (Jump to Position) ---
            container.onclick = (e) => {
                const rect = container.getBoundingClientRect();
                const clickY = e.clientY - rect.top;
                const percent = clickY / rect.height;

                const scrollHeight = document.documentElement.scrollHeight;
                const viewportHeight = window.innerHeight;

                window.scrollTo({
                    top: (scrollHeight - viewportHeight) * percent,
                    behavior: 'smooth'
                });
            };
        }

        // --- 3. Sync Logic ---
        const syncMinimap = () => {
            const container = document.getElementById('minimap-container');
            const viewport = document.getElementById('minimap-viewport');
            const handle = document.getElementById('minimap-handle');

            if (!container || !viewport || !handle || container.style.display === 'none') return;

            const scrollHeight = document.documentElement.scrollHeight;
            const scrollPos = window.scrollY;
            const viewportHeight = window.innerHeight;

            const totalScrollable = scrollHeight - viewportHeight;
            if (scrollHeight <= viewportHeight) {
                // Document fits in one screen
                viewport.style.height = '100%';
                viewport.style.top = '0';
                handle.style.display = 'none';
                return;
            }

            handle.style.display = 'block';
            const percent = scrollPos / totalScrollable;
            const viewportPercent = viewportHeight / scrollHeight;

            // Update Viewport Indicator
            viewport.style.height = `${viewportPercent * 100}%`;
            viewport.style.top = `${percent * (100 - viewportPercent * 100)}%`;

            // Update Scroll Handle
            handle.style.height = '30px';
            handle.style.top = `${percent * (100 - (30 / container.offsetHeight) * 100)}%`;
        };

        // --- 4. Event Listeners ---
        window.addEventListener('scroll', () => requestAnimationFrame(syncMinimap));
        window.addEventListener('resize', syncMinimap);
        sdk.registerUpdateListener(() => setTimeout(syncMinimap, 100));

        // Initial sync
        setTimeout(syncMinimap, 200);
    },

    toggleVisibility: () => {
        const container = document.getElementById('minimap-container');
        if (container) {
            const isVisible = container.style.display !== 'none';
            if (isVisible) {
                container.style.opacity = '0';
                setTimeout(() => {
                    if (container.style.opacity === '0') container.style.display = 'none';
                }, 300);
            } else {
                container.style.display = 'block';
                // Force layout
                container.offsetHeight;
                container.style.opacity = '1';
                // Explicitly trigger sync
                (window as any).dispatchEvent(new Event('scroll'));
            }
        }
    }
};

