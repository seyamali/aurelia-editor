import { $getSelection, $isRangeSelection, type LexicalEditor } from 'lexical';
import { $isTextNode } from 'lexical';
import { ICONS } from './icons';

const FONT_FAMILIES = [
    { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Courier New', value: '"Courier New", monospace' },
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];
const DEFAULT_FAMILY = FONT_FAMILIES[0].value;
const DEFAULT_SIZE = '16px';
const DEFAULT_COLOR = '#0f172a';
const DEFAULT_HIGHLIGHT = '#fff59d';

let activeEditor: LexicalEditor | null = null;
let panelRoot: HTMLElement | null = null;
let visible = false;
let listenersAttached = false;

export function setupTypographyUI(editor: LexicalEditor): void {
    activeEditor = editor;
    ensurePanel();

    if (listenersAttached) return;
    listenersAttached = true;

    window.addEventListener('keydown', (event) => {
        if (!visible) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hideTypographyPanel();
        }
    }, true);

    window.addEventListener('click', (event) => {
        if (!visible || !panelRoot) return;
        const target = event.target as Node;
        if (panelRoot.contains(target)) return;
        if ((target as HTMLElement | null)?.closest?.('#typography-btn')) return;
        hideTypographyPanel();
    }, true);

    editor.registerUpdateListener(() => {
        if (visible) {
            syncPanelFromSelection();
        }
    });
}

export function toggleTypographyPanel(): void {
    if (visible) {
        hideTypographyPanel();
    } else {
        showTypographyPanel();
    }
}

export function showTypographyPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    visible = true;
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
    syncPanelFromSelection();
}

export function hideTypographyPanel(): void {
    if (!panelRoot) return;

    visible = false;
    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('aside');
    panelRoot.id = 'typography-panel';
    panelRoot.className = 'typography-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <section class="typography-card" aria-label="Typography controls">
            <header class="typography-header">
                <div>
                    <div class="typography-kicker">Text styling</div>
                    <h3>Typography</h3>
                    <p class="typography-subtitle">Adjust the selected text style without leaving the toolbar flow.</p>
                </div>
                <button type="button" class="typography-close" aria-label="Close typography panel">&times;</button>
            </header>
            <div class="typography-preview">
                <span class="typography-preview-badge">${ICONS.FONT}</span>
                <div>
                    <strong data-preview-label>Inter · 16px</strong>
                    <p>Changes apply as soon as you pick them.</p>
                </div>
            </div>
            <div class="typography-grid">
                <label class="typography-field">
                    <span>Font family</span>
                    <select id="typography-font-family">
                        ${FONT_FAMILIES.map(item => `<option value="${item.value}">${item.label}</option>`).join('')}
                    </select>
                </label>
                <label class="typography-field">
                    <span>Font size</span>
                    <select id="typography-font-size">
                        ${FONT_SIZES.map(size => `<option value="${size}">${size}</option>`).join('')}
                    </select>
                </label>
                <label class="typography-field">
                    <span>Font color</span>
                    <input id="typography-font-color" type="color" value="${DEFAULT_COLOR}" />
                </label>
                <label class="typography-check">
                    <input id="typography-highlight-enabled" type="checkbox" />
                    <span>Highlight</span>
                </label>
                <label class="typography-field typography-highlight-field">
                    <span>Highlight color</span>
                    <input id="typography-highlight-color" type="color" value="${DEFAULT_HIGHLIGHT}" />
                </label>
            </div>
            <footer class="typography-footer">
                <button type="button" class="typography-button secondary" data-action="reset">Reset</button>
            </footer>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('.typography-close')) {
            hideTypographyPanel();
            return;
        }

        const action = target.closest('[data-action]') as HTMLElement | null;
        if (action?.dataset.action === 'reset') {
            applyTypography(DEFAULT_FAMILY, DEFAULT_SIZE, DEFAULT_COLOR, DEFAULT_HIGHLIGHT);
            syncPanelFromSelection();
        }
    });

    getFamilySelect()?.addEventListener('change', () => {
        applyTypography();
        syncPreview();
    });

    getSizeSelect()?.addEventListener('change', () => {
        applyTypography();
        syncPreview();
    });

    getColorInput()?.addEventListener('input', () => {
        applyTypography();
    });

    getHighlightInput()?.addEventListener('input', () => {
        applyTypography();
    });

    getHighlightToggle()?.addEventListener('change', () => {
        syncHighlightState();
        applyTypography();
    });
}

function syncPanelFromSelection(): void {
    const style = readSelectionStyle();
    const parsed = parseStyleString(style);

    const family = parsed['font-family'] || DEFAULT_FAMILY;
    const size = parsed['font-size'] || DEFAULT_SIZE;
    const color = parsed.color || DEFAULT_COLOR;
    const highlight = parsed['background-color'] || '';

    const familySelect = getFamilySelect();
    const sizeSelect = getSizeSelect();
    const colorInput = getColorInput();
    const highlightToggle = getHighlightToggle();
    const highlightInput = getHighlightInput();

    if (familySelect) familySelect.value = family;
    if (sizeSelect) sizeSelect.value = size;
    if (colorInput) colorInput.value = normalizeColorValue(color, DEFAULT_COLOR);
    if (highlightInput) highlightInput.value = normalizeColorValue(highlight || DEFAULT_HIGHLIGHT, DEFAULT_HIGHLIGHT);
    if (highlightToggle) highlightToggle.checked = !!highlight;
    syncHighlightState();

    syncPreview();
}

function syncPreview(): void {
    const family = getFamilySelect()?.value || DEFAULT_FAMILY;
    const size = getSizeSelect()?.value || DEFAULT_SIZE;
    const previewLabel = panelRoot?.querySelector<HTMLElement>('[data-preview-label]');
    if (previewLabel) {
        previewLabel.textContent = `${FONT_FAMILIES.find(item => item.value === family)?.label || 'Custom'} · ${size}`;
    }
}

function applyTypography(
    fontFamily = getFamilySelect()?.value || DEFAULT_FAMILY,
    fontSize = getSizeSelect()?.value || DEFAULT_SIZE,
    fontColor = getColorInput()?.value || DEFAULT_COLOR,
    highlightColor = getHighlightToggle()?.checked ? (getHighlightInput()?.value || DEFAULT_HIGHLIGHT) : ''
): void {
    if (!activeEditor) return;

    activeEditor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const style = toStyleString({
            ...parseStyleString(selection.style),
            'font-family': fontFamily,
            'font-size': fontSize,
            color: fontColor,
            ...(highlightColor ? { 'background-color': highlightColor } : { 'background-color': '' }),
        });

        selection.setStyle(style);

        selection.getNodes().forEach((node) => {
            if (!$isTextNode(node)) return;
            const current = parseStyleString(node.getStyle());
            node.setStyle(toStyleString({
                ...current,
                'font-family': fontFamily,
                'font-size': fontSize,
                color: fontColor,
                ...(highlightColor ? { 'background-color': highlightColor } : { 'background-color': '' }),
            }));
        });
    });
}

function readSelectionStyle(): string {
    if (!activeEditor) return '';

    let style = '';
    activeEditor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        if (selection.style) {
            style = selection.style;
            return;
        }

        const textNode = selection.getNodes().find((node) => $isTextNode(node)) as { getStyle: () => string } | undefined;
        if (textNode) {
            style = textNode.getStyle();
        }
    });

    return style;
}

function getFamilySelect(): HTMLSelectElement | null {
    return panelRoot?.querySelector('#typography-font-family') as HTMLSelectElement | null;
}

function getSizeSelect(): HTMLSelectElement | null {
    return panelRoot?.querySelector('#typography-font-size') as HTMLSelectElement | null;
}

function getColorInput(): HTMLInputElement | null {
    return panelRoot?.querySelector('#typography-font-color') as HTMLInputElement | null;
}

function getHighlightInput(): HTMLInputElement | null {
    return panelRoot?.querySelector('#typography-highlight-color') as HTMLInputElement | null;
}

function getHighlightToggle(): HTMLInputElement | null {
    return panelRoot?.querySelector('#typography-highlight-enabled') as HTMLInputElement | null;
}

function parseStyleString(style: string): Record<string, string> {
    return style
        .split(';')
        .map(part => part.trim())
        .filter(Boolean)
        .reduce<Record<string, string>>((acc, part) => {
            const [key, ...rest] = part.split(':');
            if (!key || rest.length === 0) return acc;
            acc[key.trim().toLowerCase()] = rest.join(':').trim();
            return acc;
        }, {});
}

function toStyleString(style: Record<string, string>): string {
    return Object.entries(style)
        .filter(([, value]) => !!value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
}

function normalizeColorValue(value: string, fallback: string): string {
    const lower = value.trim().toLowerCase();
    if (lower.startsWith('#') && (lower.length === 7 || lower.length === 4)) return lower;
    const rgbMatch = lower.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`;
    }
    return fallback;
}

function syncHighlightState(): void {
    const enabled = getHighlightToggle()?.checked ?? false;
    const highlightInput = getHighlightInput();
    if (highlightInput) {
        highlightInput.disabled = !enabled;
        highlightInput.parentElement?.classList.toggle('disabled', !enabled);
    }
}
