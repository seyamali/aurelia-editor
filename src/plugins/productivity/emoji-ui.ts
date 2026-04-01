import { type LexicalEditor } from 'lexical';
import { EmojiPicker } from './emoji';

const EMOJI_CATEGORIES: Record<string, string[]> = {
    smileys: ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '👏', '🙏', '😊', '🥳', '🤔', '🤨', '😐', '😬', '🤠', '👻'],
    nature: ['🔥', '🌈', '☀️', '🌙', '⭐', '🌺', '🍀', '🌲', '🌵', '🍄', '🌍', '🌊', '❄️', '⚡'],
    objects: ['💻', '📱', '💡', '📅', '📝', '🔒', '🔑', '🎁', '📷', '📚', '✏️', '📍', '🖇️', '🗑️', '🔔', '🔋'],
    symbols: ['✅', '❌', '❤️', '💯', '‼️', '❓', '⚠️', '⛔', '🚫', '🟢', '🔴', '🔵', '✔️', '✖️'],
    math: ['+', '-', '×', '÷', '=', '≠', '≈', '>', '<', '≥', '≤', '±', '∞', '√', 'π', '∑', '∫'],
    currency: ['$', '€', '£', '¥', '₹', '₽', '₿']
};

export function setupEmojiUI(internalEditor: LexicalEditor) {

    // Emoji keyword mapping for search
    const EMOJI_KEYWORDS: Record<string, string[]> = {
        '😀': ['smile', 'happy', 'grin'],
        '😂': ['laugh', 'joy', 'tears'],
        '😍': ['love', 'heart', 'eyes'],
        '😎': ['cool', 'sunglasses'],
        '😭': ['cry', 'sad', 'tears'],
        '😡': ['angry', 'mad'],
        '👍': ['thumbs up', 'approve'],
        '👎': ['thumbs down', 'disapprove'],
        '👏': ['clap', 'applause'],
        '🙏': ['pray', 'thanks'],
        // ...add more as needed
    };

    const emojiDialog = document.getElementById('emoji-dialog');
    const emojiGrid = document.getElementById('emoji-grid');
    const closeBtn = document.getElementById('close-emoji-btn');
    const searchInput = document.getElementById('emoji-search-input') as HTMLInputElement;
    const tabs = document.querySelectorAll('.emoji-tab');

    if (!emojiDialog || !emojiGrid) return;

    emojiDialog.dataset.state = 'ready';

    let currentCategory = 'all';

    // Helper: Flatten all for search / all view
    const getAllEmojis = () => Object.values(EMOJI_CATEGORIES).flat();

    function renderEmojis(filterText = '') {
        emojiGrid!.innerHTML = '';

        // Determine source list
        const source = currentCategory === 'all'
            ? getAllEmojis()
            : EMOJI_CATEGORIES[currentCategory] || [];

        // Filter by search
        let filtered: string[] = source;
        if (filterText.trim()) {
            const lower = filterText.trim().toLowerCase();
            filtered = source.filter(e => {
                // Match by emoji itself or keyword
                if (e.includes(lower)) return true;
                const keywords = EMOJI_KEYWORDS[e] || [];
                return keywords.some(k => k.includes(lower));
            });
        }

        filtered.forEach(emoji => {
            const btn = document.createElement('button');
            btn.innerText = emoji;
            btn.className = 'emoji-item';
            btn.onclick = () => {
                EmojiPicker.insertEmoji(internalEditor, emoji);
                emojiDialog!.classList.add('hidden');
            };
            emojiGrid!.appendChild(btn);
        });
    }

    // Initial Render
    renderEmojis();

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = (tab as HTMLElement).dataset.category || 'all';
            renderEmojis(searchInput.value);
            searchInput.value = '';
        });
    });

    // Search Handler
    searchInput?.addEventListener('input', () => {
        renderEmojis(searchInput.value);
    });

    // Close Handler
    closeBtn?.addEventListener('click', () => {
        emojiDialog.classList.add('hidden');
    });

    // Toggle Handler
    document.getElementById('emoji-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiDialog.classList.toggle('hidden');
        renderEmojis();

        // Position it near the button
        const btn = document.getElementById('emoji-btn');
        if (btn) {
            const rect = btn.getBoundingClientRect();
            emojiDialog.style.top = `${rect.bottom + 10}px`;
            emojiDialog.style.left = `${rect.left}px`;
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!emojiDialog.classList.contains('hidden') &&
            !emojiDialog.contains(e.target as Node) &&
            (e.target as Element).id !== 'emoji-btn') {
            emojiDialog.classList.add('hidden');
        }
    });
}

export function toggleEmojiPicker(): void {
    document.getElementById('emoji-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}
