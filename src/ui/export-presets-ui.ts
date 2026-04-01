import { AureliaEditor } from '../core/engine';
import { ICONS } from './icons';
import { ExportPDF, type PdfExportOptions } from '../plugins/export/pdf-export';
import { ExportWord, type WordExportOptions } from '../plugins/export/word-export';

type ExportPreset = {
    id: string;
    name: string;
    description: string;
    badge: string;
    pdf: Partial<PdfExportOptions>;
    word: Partial<WordExportOptions>;
    notes: string[];
};

type ExportSettings = {
    filename: string;
    margin: number;
    orientation: 'portrait' | 'landscape';
    cleanHtml: boolean;
    summary: string;
};

const EXPORT_PRESETS: ExportPreset[] = [
    {
        id: 'clean',
        name: 'Clean',
        description: 'Best for sharing and archival exports.',
        badge: 'Default',
        pdf: { margin: 10, orientation: 'portrait', filename: exportName('clean', 'pdf') },
        word: { cleanHtml: true, filename: exportName('clean', 'doc') },
        notes: ['Portrait PDF', '10mm margins', 'Clean Word HTML']
    },
    {
        id: 'presentation',
        name: 'Presentation',
        description: 'Wider layout for decks, handouts, and proposals.',
        badge: 'Wide',
        pdf: { margin: 6, orientation: 'landscape', filename: exportName('presentation', 'pdf') },
        word: { cleanHtml: true, filename: exportName('presentation', 'doc') },
        notes: ['Landscape PDF', '6mm margins', 'Fidelity-first Word export']
    },
    {
        id: 'review',
        name: 'Review Draft',
        description: 'Useful when you want a readable review copy.',
        badge: 'Review',
        pdf: { margin: 12, orientation: 'portrait', filename: exportName('review', 'pdf') },
        word: { cleanHtml: true, filename: exportName('review', 'doc') },
        notes: ['Portrait PDF', '12mm margins', 'Clean export path']
    }
];

const STORAGE_KEY = 'aurelia-editor-export-preset';

let activeEditor: AureliaEditor | null = null;
let panelRoot: HTMLElement | null = null;
let selectedPresetId = getStoredPresetId();
let currentSettings: ExportSettings = createSettingsForPreset(getSelectedPreset());
let listenersAttached = false;

export function setupExportPresetsUI(editor: AureliaEditor): void {
    activeEditor = editor;
    ensurePanel();

    if (listenersAttached) return;
    listenersAttached = true;

    window.addEventListener('keydown', (event) => {
        if (!panelRoot || panelRoot.classList.contains('hidden')) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hideExportPresetsPanel();
        }
    }, true);
}

export function toggleExportPresetsPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    const isHidden = panelRoot.classList.contains('hidden');
    if (isHidden) {
        showExportPresetsPanel();
    } else {
        hideExportPresetsPanel();
    }
}

export function showExportPresetsPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    currentSettings = createSettingsForPreset(getSelectedPreset());
    renderPanel();
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
}

export function hideExportPresetsPanel(): void {
    if (!panelRoot) return;

    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('div');
    panelRoot.id = 'export-presets-panel';
    panelRoot.className = 'export-presets-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <div class="export-presets-backdrop" data-close="true"></div>
        <section class="export-presets-card" role="dialog" aria-modal="true" aria-label="Export presets">
            <header class="export-presets-header">
                <div>
                    <p class="export-presets-kicker">Export presets</p>
                    <h3>Pick a layout</h3>
                    <p class="export-presets-subtitle">Choose a preset, then export PDF or Word with one click.</p>
                </div>
                <button type="button" class="export-presets-close" aria-label="Close export presets">&times;</button>
            </header>
            <div class="export-presets-body">
                <div class="export-presets-grid"></div>
                <div class="export-presets-settings">
                    <div class="export-presets-summary">
                        <span class="export-presets-summary-label">Selected preset</span>
                        <strong id="export-presets-active-name"></strong>
                        <span id="export-presets-active-meta"></span>
                    </div>
                    <div class="export-presets-preview">
                        <div class="export-presets-preview-header">
                            <span class="export-presets-preview-label">Live preview</span>
                        </div>
                        <div class="export-presets-preview-page">
                            <div id="export-presets-preview-ruler" class="export-presets-preview-ruler"></div>
                            <div class="export-presets-preview-document">
                                <div class="export-presets-preview-line short"></div>
                                <div class="export-presets-preview-line"></div>
                                <div class="export-presets-preview-line medium"></div>
                                <div class="export-presets-preview-block"></div>
                                <div class="export-presets-preview-line"></div>
                                <div class="export-presets-preview-line short"></div>
                            </div>
                        </div>
                        <div class="export-presets-preview-meta">
                            <span id="export-presets-preview-chip" class="export-presets-preview-chip"></span>
                            <span id="export-presets-preview-filename" class="export-presets-preview-filename"></span>
                        </div>
                    </div>
                    <label class="export-presets-field">
                        <span>Filename</span>
                        <input id="export-presets-filename" type="text" autocomplete="off" spellcheck="false" />
                    </label>
                    <div class="export-presets-inline-fields">
                        <label class="export-presets-field">
                            <span>Margin (mm)</span>
                            <input id="export-presets-margin" type="number" min="0" step="1" />
                        </label>
                        <label class="export-presets-field">
                            <span>Orientation</span>
                            <select id="export-presets-orientation">
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </label>
                    </div>
                    <label class="export-presets-check">
                        <input id="export-presets-clean-html" type="checkbox" />
                        <span>Clean HTML for Word export</span>
                    </label>
                    <div class="export-presets-actions">
                        <button type="button" class="export-presets-button secondary" data-export="word">
                            ${ICONS.WORD} Export Word
                        </button>
                        <button type="button" class="export-presets-button primary" data-export="pdf">
                            ${ICONS.PDF} Export PDF
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.export-presets-close')) {
            hideExportPresetsPanel();
            return;
        }

        const presetButton = target.closest('[data-preset-id]') as HTMLElement | null;
        if (presetButton?.dataset.presetId) {
            selectedPresetId = presetButton.dataset.presetId;
            persistPresetId(selectedPresetId);
            currentSettings = createSettingsForPreset(getSelectedPreset());
            renderPanel();
            return;
        }

    });

    renderPanel();
}

function renderPanel(): void {
    if (!panelRoot) return;

    const grid = panelRoot.querySelector('.export-presets-grid');
    const activeName = panelRoot.querySelector('#export-presets-active-name');
    const activeMeta = panelRoot.querySelector('#export-presets-active-meta');
    const previewChip = panelRoot.querySelector('#export-presets-preview-chip');
    const previewFilename = panelRoot.querySelector('#export-presets-preview-filename');
    const previewRuler = panelRoot.querySelector('#export-presets-preview-ruler') as HTMLElement | null;
    const filenameInput = panelRoot.querySelector('#export-presets-filename') as HTMLInputElement | null;
    const marginInput = panelRoot.querySelector('#export-presets-margin') as HTMLInputElement | null;
    const orientationInput = panelRoot.querySelector('#export-presets-orientation') as HTMLSelectElement | null;
    const cleanHtmlInput = panelRoot.querySelector('#export-presets-clean-html') as HTMLInputElement | null;
    const exportPdfButton = panelRoot.querySelector('[data-export="pdf"]') as HTMLButtonElement | null;
    const exportWordButton = panelRoot.querySelector('[data-export="word"]') as HTMLButtonElement | null;
    const preset = getSelectedPreset();

    if (!grid || !activeName || !activeMeta) return;

    grid.innerHTML = EXPORT_PRESETS.map(option => `
        <button type="button" class="export-preset-card${option.id === preset.id ? ' selected' : ''}" data-preset-id="${option.id}">
            <div class="export-preset-card-header">
                <span class="export-preset-badge">${option.badge}</span>
                <span class="export-preset-check">${option.id === preset.id ? 'Selected' : 'Choose'}</span>
            </div>
            <h4>${option.name}</h4>
            <p>${option.description}</p>
            <ul>
                ${option.notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
        </button>
    `).join('');

    activeName.textContent = preset.name;
    activeMeta.textContent = `${preset.pdf.orientation === 'landscape' ? 'Landscape' : 'Portrait'} PDF, ${preset.pdf.margin ?? 10}mm margins`;
    if (previewChip && previewRuler) {
        previewChip.textContent = currentSettings.summary;
        previewRuler.className = `export-presets-preview-ruler ${currentSettings.orientation}`;
        previewRuler.style.setProperty('--preview-margin', `${Math.max(0, currentSettings.margin)}px`);
    }
    if (previewFilename) {
        previewFilename.textContent = currentSettings.filename.trim() || 'untitled-export';
    }

    if (filenameInput && marginInput && orientationInput && cleanHtmlInput) {
        filenameInput.value = currentSettings.filename;
        marginInput.value = String(currentSettings.margin);
        orientationInput.value = currentSettings.orientation;
        cleanHtmlInput.checked = currentSettings.cleanHtml;

        filenameInput.oninput = () => {
            currentSettings.filename = filenameInput.value.trim() || createSettingsForPreset(preset).filename;
            currentSettings.summary = buildPreviewSummary(currentSettings);
            renderPreview();
        };
        marginInput.oninput = () => {
            const value = Number(marginInput.value);
            currentSettings.margin = Number.isFinite(value) && value >= 0 ? value : createSettingsForPreset(preset).margin;
            currentSettings.summary = buildPreviewSummary(currentSettings);
            renderPreview();
        };
        orientationInput.onchange = () => {
            currentSettings.orientation = orientationInput.value as 'portrait' | 'landscape';
            currentSettings.summary = buildPreviewSummary(currentSettings);
            renderPreview();
        };
        cleanHtmlInput.onchange = () => {
            currentSettings.cleanHtml = cleanHtmlInput.checked;
            currentSettings.summary = buildPreviewSummary(currentSettings);
            renderPreview();
        };
    }

    if (exportPdfButton) {
        exportPdfButton.onclick = () => runExport('pdf');
    }

    if (exportWordButton) {
        exportWordButton.onclick = () => runExport('word');
    }

    renderPreview();
}

function runExport(kind: 'pdf' | 'word'): void {
    const editor = activeEditor;
    if (!editor) return;

    const pdfOptions: Partial<PdfExportOptions> = {
        ...getSelectedPreset().pdf,
        filename: ensureExtension(currentSettings.filename, 'pdf'),
        margin: currentSettings.margin,
        orientation: currentSettings.orientation
    };
    const wordOptions: Partial<WordExportOptions> = {
        ...getSelectedPreset().word,
        filename: ensureExtension(currentSettings.filename, 'doc'),
        cleanHtml: currentSettings.cleanHtml
    };

    if (kind === 'pdf') {
        ExportPDF.exportToPdf(editor.getInternalEditor(), pdfOptions);
    } else {
        ExportWord.exportToDoc(editor, wordOptions);
    }

    hideExportPresetsPanel();
}

function getSelectedPreset(): ExportPreset {
    return EXPORT_PRESETS.find(option => option.id === selectedPresetId) || EXPORT_PRESETS[0];
}

function createSettingsForPreset(preset: ExportPreset): ExportSettings {
    return {
        filename: preset.pdf.filename || exportName(preset.id, 'pdf'),
        margin: preset.pdf.margin ?? 10,
        orientation: preset.pdf.orientation ?? 'portrait',
        cleanHtml: preset.word.cleanHtml ?? true,
        summary: buildPreviewSummary({
            margin: preset.pdf.margin ?? 10,
            orientation: preset.pdf.orientation ?? 'portrait',
            cleanHtml: preset.word.cleanHtml ?? true,
        }),
    };
}

function ensureExtension(filename: string, ext: 'pdf' | 'doc'): string {
    const trimmed = filename.trim();
    const suffix = `.${ext}`;
    return trimmed.toLowerCase().endsWith(suffix) ? trimmed : `${trimmed}${suffix}`;
}

function renderPreview(): void {
    if (!panelRoot) return;

    const previewChip = panelRoot.querySelector('#export-presets-preview-chip');
    const previewRuler = panelRoot.querySelector('#export-presets-preview-ruler') as HTMLElement | null;

    if (previewChip) {
        previewChip.textContent = currentSettings.summary;
    }

    if (previewRuler) {
        previewRuler.className = `export-presets-preview-ruler ${currentSettings.orientation}`;
        previewRuler.style.setProperty('--preview-margin', `${Math.max(0, currentSettings.margin)}px`);
    }
}

function buildPreviewSummary(settings: Pick<ExportSettings, 'orientation' | 'margin' | 'cleanHtml'>): string {
    const side = settings.orientation === 'landscape' ? 'Wide PDF' : 'Standard PDF';
    const htmlMode = settings.cleanHtml ? 'clean Word' : 'fidelity Word';
    return `${side} | ${settings.margin}mm margins | ${htmlMode}`;
}

export function buildSummary(settings: Pick<ExportSettings, 'orientation' | 'margin' | 'cleanHtml'>): string {
    const side = settings.orientation === 'landscape' ? 'Wide PDF' : 'Standard PDF';
    const htmlMode = settings.cleanHtml ? 'clean Word' : 'fidelity Word';
    return `${side} · ${settings.margin}mm margins · ${htmlMode}`;
}

function exportName(suffix: string, ext: 'pdf' | 'doc'): string {
    const date = new Date().toISOString().slice(0, 10);
    return `document-${suffix}-${date}.${ext}`;
}

function getStoredPresetId(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) || EXPORT_PRESETS[0].id;
    } catch {
        return EXPORT_PRESETS[0].id;
    }
}

function persistPresetId(id: string): void {
    try {
        localStorage.setItem(STORAGE_KEY, id);
    } catch {
        // Ignore storage errors.
    }
}
