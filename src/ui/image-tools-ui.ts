import { $getNodeByKey, $getSelection, $isNodeSelection, type LexicalEditor } from 'lexical';
import { ImageNode, type ImageAlignment, $isImageNode } from '../plugins/media/image-node';

type ImageToolsState = {
    key: string;
    altText: string;
    caption: string;
    width: string;
    height: string;
    alignment: ImageAlignment;
    showCaption: boolean;
    linkUrl: string;
};

let editorRef: LexicalEditor | null = null;
let panelRoot: HTMLElement | null = null;
let listenersAttached = false;
let visible = false;
let currentImageKey: string | null = null;

export function setupImageToolsUI(editor: LexicalEditor): void {
    editorRef = editor;
    ensurePanel();

    if (listenersAttached) return;
    listenersAttached = true;

    editor.registerUpdateListener(() => {
        if (!visible) return;
        syncFromSelection();
    });

    window.addEventListener('keydown', (event) => {
        if (!visible) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hideImageToolsPanel();
        }
    }, true);
}

export function toggleImageToolsPanel(): void {
    if (visible) {
        hideImageToolsPanel();
    } else {
        showImageToolsPanel();
    }
}

export function showImageToolsPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    visible = true;
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
    syncFromSelection();
}

export function hideImageToolsPanel(): void {
    if (!panelRoot) return;

    visible = false;
    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('aside');
    panelRoot.id = 'image-tools-panel';
    panelRoot.className = 'image-tools-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <div class="image-tools-backdrop" data-close="true"></div>
        <section class="image-tools-card" role="dialog" aria-modal="true" aria-label="Image tools">
            <header class="image-tools-header">
                <div>
                    <p class="image-tools-kicker">Image tools</p>
                    <h3>Inspect the selected image</h3>
                    <p class="image-tools-subtitle">Edit alt text, caption, alignment, size, and link.</p>
                </div>
                <button type="button" class="image-tools-close" aria-label="Close image tools">&times;</button>
            </header>
            <div class="image-tools-preview">
                <img id="image-tools-preview" alt="" />
                <div id="image-tools-empty" class="image-tools-empty">Select an image to edit it.</div>
            </div>
            <div class="image-tools-grid">
                <label class="image-tools-field">
                    <span>Alt text</span>
                    <input id="image-tools-alt" type="text" placeholder="Describe the image" />
                </label>
                <label class="image-tools-field">
                    <span>Caption</span>
                    <input id="image-tools-caption" type="text" placeholder="Write a caption" />
                </label>
                <div class="image-tools-inline">
                    <label class="image-tools-field">
                        <span>Width</span>
                        <input id="image-tools-width" type="number" min="1" step="1" />
                    </label>
                    <label class="image-tools-field">
                        <span>Height</span>
                        <input id="image-tools-height" type="number" min="1" step="1" />
                    </label>
                </div>
                <label class="image-tools-field">
                    <span>Link URL</span>
                    <input id="image-tools-link" type="url" placeholder="https://example.com" />
                </label>
                <label class="image-tools-field">
                    <span>Alignment</span>
                    <select id="image-tools-alignment">
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                        <option value="full">Full width</option>
                    </select>
                </label>
                <label class="image-tools-check">
                    <input id="image-tools-show-caption" type="checkbox" />
                    <span>Show caption</span>
                </label>
            </div>
            <footer class="image-tools-footer">
                <button type="button" class="image-tools-button secondary" data-action="reset">Reset from image</button>
                <button type="button" class="image-tools-button danger" data-action="remove">Remove image</button>
            </footer>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.image-tools-close')) {
            hideImageToolsPanel();
            return;
        }

        const action = target.closest('[data-action]') as HTMLElement | null;
        if (!action?.dataset.action) return;
        if (!currentImageKey) return;

        if (action.dataset.action === 'reset') {
            syncFromSelection();
            return;
        }

        if (action.dataset.action === 'remove') {
            const key = currentImageKey;
            if (!key) return;
            editorRef?.update(() => {
                const node = $getNodeByKey(key);
                if ($isImageNode(node)) {
                    node.remove();
                }
            });
            hideImageToolsPanel();
        }
    });

    bindInputs();
}

function bindInputs(): void {
    if (!panelRoot) return;

    const alt = getInput('#image-tools-alt');
    const caption = getInput('#image-tools-caption');
    const width = getInput('#image-tools-width');
    const height = getInput('#image-tools-height');
    const link = getInput('#image-tools-link');
    const alignment = getSelect('#image-tools-alignment');
    const showCaption = getCheckbox('#image-tools-show-caption');

    alt?.addEventListener('input', () => updateImage(node => node.setAltText(alt.value)));
    caption?.addEventListener('input', () => updateImage(node => node.setCaption(caption.value)));
    width?.addEventListener('input', () => updateDimensions());
    height?.addEventListener('input', () => updateDimensions());
    link?.addEventListener('input', () => updateImage(node => node.setLinkUrl(link.value.trim())));
    alignment?.addEventListener('change', () => updateImage(node => node.setAlignment(alignment.value as ImageAlignment)));
    showCaption?.addEventListener('change', () => updateImage(node => node.setShowCaption(showCaption.checked)));
}

function syncFromSelection(): void {
    const state = getCurrentImageState();
    const empty = panelRoot?.querySelector('#image-tools-empty') as HTMLElement | null;
    const preview = panelRoot?.querySelector('#image-tools-preview') as HTMLImageElement | null;
    const alt = getInput('#image-tools-alt');
    const caption = getInput('#image-tools-caption');
    const width = getInput('#image-tools-width');
    const height = getInput('#image-tools-height');
    const link = getInput('#image-tools-link');
    const alignment = getSelect('#image-tools-alignment');
    const showCaption = getCheckbox('#image-tools-show-caption');

    currentImageKey = state?.key || null;

    if (!state) {
        if (empty) empty.style.display = 'grid';
        if (preview) preview.style.display = 'none';
        return;
    }

    if (empty) empty.style.display = 'none';
    if (preview) {
        preview.style.display = 'block';
        preview.src = getImageSrc(state.key);
        preview.alt = state.altText;
    }

    if (alt) alt.value = state.altText;
    if (caption) caption.value = state.caption;
    if (width) width.value = state.width;
    if (height) height.value = state.height;
    if (link) link.value = state.linkUrl;
    if (alignment) alignment.value = state.alignment;
    if (showCaption) showCaption.checked = state.showCaption;
}

function getCurrentImageState(): ImageToolsState | null {
    const editor = editorRef;
    if (!editor) return null;

    let state: ImageToolsState | null = null;

    editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isNodeSelection(selection)) return;

        const node = selection.getNodes().find($isImageNode);
        if (!node) return;

        state = {
            key: node.getKey(),
            altText: node.__altText,
            caption: node.__caption,
            width: node.__width === 'inherit' ? '' : String(node.__width),
            height: node.__height === 'inherit' ? '' : String(node.__height),
            alignment: node.__alignment,
            showCaption: node.__showCaption,
            linkUrl: node.__linkUrl,
        };
    });

    return state;
}

function updateImage(mutator: (node: ImageNode) => void): void {
    const key = currentImageKey;
    if (!editorRef || !key) return;

    editorRef.update(() => {
        const node = $getNodeByKey(key);
        if ($isImageNode(node)) {
            mutator(node);
        }
    });
    syncFromSelection();
}

function updateDimensions(): void {
    const width = getInput('#image-tools-width')?.value.trim() || '';
    const height = getInput('#image-tools-height')?.value.trim() || '';
    updateImage((node) => {
        node.setWidthAndHeight(width ? Number(width) : 'inherit', height ? Number(height) : 'inherit');
    });
}

function getImageSrc(key: string): string {
    let src = '';
    editorRef?.getEditorState().read(() => {
        const node = $getNodeByKey(key);
        if ($isImageNode(node)) {
            src = node.__src;
        }
    });
    return src;
}

function getInput(selector: string): HTMLInputElement | null {
    return panelRoot?.querySelector(selector) as HTMLInputElement | null;
}

function getSelect(selector: string): HTMLSelectElement | null {
    return panelRoot?.querySelector(selector) as HTMLSelectElement | null;
}

function getCheckbox(selector: string): HTMLInputElement | null {
    return panelRoot?.querySelector(selector) as HTMLInputElement | null;
}
