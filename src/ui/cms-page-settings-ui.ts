import { ICONS } from './icons';

export type CmsPageMetadata = {
    title: string;
    slug: string;
    description: string;
    excerpt: string;
    featuredImage: string;
    canonicalUrl: string;
    noIndex: boolean;
};

type CmsTemplate = {
    id: string;
    name: string;
    description: string;
    metadata: Partial<CmsPageMetadata>;
};

const STORAGE_KEY = 'aurelia-editor-cms-metadata';

const CMS_TEMPLATES: CmsTemplate[] = [
    {
        id: 'home',
        name: 'Home Page',
        description: 'Clean landing page for a site homepage.',
        metadata: {
            title: 'Home',
            slug: 'home',
            description: 'Welcome visitors with a clear, focused homepage.',
            excerpt: 'A concise homepage introduction with clear calls to action.',
            featuredImage: '',
            canonicalUrl: '',
            noIndex: false,
        }
    },
    {
        id: 'blog',
        name: 'Blog Post',
        description: 'Article-friendly metadata for blog publishing.',
        metadata: {
            title: 'New Blog Post',
            slug: 'new-blog-post',
            description: 'An SEO-friendly article description.',
            excerpt: 'A short summary that works well as a blog excerpt.',
            featuredImage: '',
            canonicalUrl: '',
            noIndex: false,
        }
    },
    {
        id: 'landing',
        name: 'Landing Page',
        description: 'High-conversion page with focused messaging.',
        metadata: {
            title: 'Landing Page',
            slug: 'landing-page',
            description: 'A page template designed for conversion and campaigns.',
            excerpt: 'Focused campaign copy with a clear action.',
            featuredImage: '',
            canonicalUrl: '',
            noIndex: false,
        }
    },
    {
        id: 'docs',
        name: 'Docs Page',
        description: 'Documentation or knowledge-base content.',
        metadata: {
            title: 'Documentation',
            slug: 'documentation',
            description: 'Structured documentation page metadata.',
            excerpt: 'Helpful content for product docs and knowledge bases.',
            featuredImage: '',
            canonicalUrl: '',
            noIndex: false,
        }
    },
    {
        id: 'product',
        name: 'Product Page',
        description: 'Product or feature page with SEO fields.',
        metadata: {
            title: 'Product',
            slug: 'product',
            description: 'Product page metadata for CMS publishing.',
            excerpt: 'Feature highlights and product details in a tidy summary.',
            featuredImage: '',
            canonicalUrl: '',
            noIndex: false,
        }
    }
];

let panelRoot: HTMLElement | null = null;
let visible = false;
let listenersAttached = false;
let currentMetadata = loadMetadata();

export function setupCmsPageSettingsUI(): void {
    ensurePanel();

    if (listenersAttached) return;
    listenersAttached = true;

    window.addEventListener('keydown', (event) => {
        if (!visible) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hideCmsPageSettingsPanel();
        }
    }, true);
}

export function toggleCmsPageSettingsPanel(): void {
    if (visible) {
        hideCmsPageSettingsPanel();
    } else {
        showCmsPageSettingsPanel();
    }
}

export function showCmsPageSettingsPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    visible = true;
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
    syncFields();
}

export function hideCmsPageSettingsPanel(): void {
    if (!panelRoot) return;

    visible = false;
    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

export function getCmsPageMetadata(): CmsPageMetadata {
    return { ...currentMetadata };
}

export function setCmsPageMetadata(metadata: Partial<CmsPageMetadata>): CmsPageMetadata {
    currentMetadata = {
        ...currentMetadata,
        ...metadata,
        slug: normalizeSlug(metadata.slug ?? currentMetadata.slug),
    };
    persistMetadata(currentMetadata);
    notifyMetadataChanged();
    syncFields();
    return getCmsPageMetadata();
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('aside');
    panelRoot.id = 'cms-page-settings-panel';
    panelRoot.className = 'cms-page-settings-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <div class="cms-page-settings-backdrop" data-close="true"></div>
        <section class="cms-page-settings-card" role="dialog" aria-modal="true" aria-label="CMS page settings">
            <header class="cms-page-settings-header">
                <div>
                    <p class="cms-page-settings-kicker">CMS</p>
                    <h3>Page settings</h3>
                    <p class="cms-page-settings-subtitle">Manage title, slug, SEO copy, and featured media.</p>
                </div>
                <button type="button" class="cms-page-settings-close" aria-label="Close page settings">&times;</button>
            </header>
            <div class="cms-page-settings-preview">
                <span class="cms-page-settings-preview-badge">${ICONS.CMS}</span>
                <div>
                    <strong id="cms-preview-title">Untitled page</strong>
                    <p id="cms-preview-slug">/untitled-page</p>
                </div>
            </div>
            <div class="cms-template-grid">
                ${CMS_TEMPLATES.map(template => `
                    <button type="button" class="cms-template-card" data-template-id="${template.id}">
                        <strong>${template.name}</strong>
                        <span>${template.description}</span>
                    </button>
                `).join('')}
            </div>
            <div class="cms-page-settings-grid">
                <label class="cms-field">
                    <span>Page title</span>
                    <input id="cms-title" type="text" placeholder="Home page" />
                </label>
                <label class="cms-field">
                    <span>Slug</span>
                    <input id="cms-slug" type="text" placeholder="home-page" />
                </label>
                <label class="cms-field">
                    <span>Meta description</span>
                    <input id="cms-description" type="text" placeholder="Search engine description" />
                </label>
                <label class="cms-field">
                    <span>Excerpt</span>
                    <textarea id="cms-excerpt" rows="4" placeholder="Short page summary"></textarea>
                </label>
                <label class="cms-field">
                    <span>Featured image URL</span>
                    <input id="cms-featured-image" type="url" placeholder="https://example.com/cover.jpg" />
                </label>
                <label class="cms-field">
                    <span>Canonical URL</span>
                    <input id="cms-canonical-url" type="url" placeholder="https://example.com/page" />
                </label>
                <label class="cms-check">
                    <input id="cms-no-index" type="checkbox" />
                    <span>No index this page</span>
                </label>
            </div>
            <footer class="cms-page-settings-footer">
                <button type="button" class="cms-page-settings-button secondary" data-action="copy">Copy metadata</button>
                <button type="button" class="cms-page-settings-button primary" data-action="save">Save settings</button>
            </footer>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.cms-page-settings-close')) {
            hideCmsPageSettingsPanel();
            return;
        }

        const action = target.closest('[data-action]') as HTMLElement | null;
        if (!action?.dataset.action) return;

        if (action.dataset.action === 'save') {
            readFields();
            return;
        }

        if (action.dataset.action === 'copy') {
            readFields();
            await navigator.clipboard.writeText(JSON.stringify(currentMetadata, null, 2));
        }
    });

    panelRoot.querySelectorAll<HTMLElement>('[data-template-id]').forEach((button) => {
        button.addEventListener('click', () => {
            const template = CMS_TEMPLATES.find(item => item.id === button.dataset.templateId);
            if (!template) return;
            setCmsPageMetadata(template.metadata);
            syncFields();
        });
    });

    panelRoot.addEventListener('input', () => {
        readFields(false);
        renderPreview();
    });

    syncFields();
}

function syncFields(): void {
    if (!panelRoot) return;

    const title = getInput('#cms-title');
    const slug = getInput('#cms-slug');
    const description = getInput('#cms-description');
    const excerpt = getTextarea('#cms-excerpt');
    const featuredImage = getInput('#cms-featured-image');
    const canonicalUrl = getInput('#cms-canonical-url');
    const noIndex = getCheckbox('#cms-no-index');

    if (title) title.value = currentMetadata.title;
    if (slug) slug.value = currentMetadata.slug;
    if (description) description.value = currentMetadata.description;
    if (excerpt) excerpt.value = currentMetadata.excerpt;
    if (featuredImage) featuredImage.value = currentMetadata.featuredImage;
    if (canonicalUrl) canonicalUrl.value = currentMetadata.canonicalUrl;
    if (noIndex) noIndex.checked = currentMetadata.noIndex;

    renderPreview();
}

function readFields(persist = true): void {
    const title = getInput('#cms-title')?.value.trim() || '';
    const slug = normalizeSlug(getInput('#cms-slug')?.value || '');
    const description = getInput('#cms-description')?.value.trim() || '';
    const excerpt = getTextarea('#cms-excerpt')?.value.trim() || '';
    const featuredImage = getInput('#cms-featured-image')?.value.trim() || '';
    const canonicalUrl = getInput('#cms-canonical-url')?.value.trim() || '';
    const noIndex = getCheckbox('#cms-no-index')?.checked || false;

    currentMetadata = { title, slug, description, excerpt, featuredImage, canonicalUrl, noIndex };

    if (persist) {
        persistMetadata(currentMetadata);
    }

    notifyMetadataChanged();
}

function renderPreview(): void {
    const title = panelRoot?.querySelector('#cms-preview-title');
    const slug = panelRoot?.querySelector('#cms-preview-slug');
    if (title) title.textContent = currentMetadata.title || 'Untitled page';
    if (slug) slug.textContent = `/${currentMetadata.slug || 'untitled-page'}`;
}

function getInput(selector: string): HTMLInputElement | null {
    return panelRoot?.querySelector(selector) as HTMLInputElement | null;
}

function getTextarea(selector: string): HTMLTextAreaElement | null {
    return panelRoot?.querySelector(selector) as HTMLTextAreaElement | null;
}

function getCheckbox(selector: string): HTMLInputElement | null {
    return panelRoot?.querySelector(selector) as HTMLInputElement | null;
}

function normalizeSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'untitled-page';
}

function loadMetadata(): CmsPageMetadata {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as Partial<CmsPageMetadata>;
            return {
                title: parsed.title || '',
                slug: normalizeSlug(parsed.slug || ''),
                description: parsed.description || '',
                excerpt: parsed.excerpt || '',
                featuredImage: parsed.featuredImage || '',
                canonicalUrl: parsed.canonicalUrl || '',
                noIndex: !!parsed.noIndex,
            };
        }
    } catch {
        // Ignore storage issues.
    }

    return {
        title: '',
        slug: 'untitled-page',
        description: '',
        excerpt: '',
        featuredImage: '',
        canonicalUrl: '',
        noIndex: false,
    };
}

function persistMetadata(metadata: CmsPageMetadata): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
    } catch {
        // Ignore storage issues.
    }
}

function notifyMetadataChanged(): void {
    window.dispatchEvent(new CustomEvent('cms-metadata-changed', {
        detail: getCmsPageMetadata(),
    }));
}
