import { $getRoot, $isElementNode, type LexicalEditor } from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode } from '@lexical/list';
import { $isTableNode } from '@lexical/table';
import { $isImageNode } from '../plugins/media/image-node';
import { $isYouTubeNode } from '../plugins/advanced/youtube-node';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import { getCmsPageMetadata, setCmsPageMetadata } from './cms-page-settings-ui';
import { toggleExportPresetsPanel } from './export-presets-ui';
import { ICONS } from './icons';

type WorkspaceTab = 'cms' | 'seo' | 'publish';

type WorkspaceStats = {
    words: number;
    headings: number;
    paragraphs: number;
    images: number;
    links: number;
    tables: number;
    quotes: number;
    codeBlocks: number;
    videos: number;
};

let activeEditor: LexicalEditor | null = null;
let panelRoot: HTMLElement | null = null;
let visible = false;
let listenersAttached = false;
let activeTab: WorkspaceTab = 'cms';
let publishReady = loadPublishReady();

export function setupContentWorkspaceUI(editor: LexicalEditor): void {
    activeEditor = editor;
    ensurePanel();

    if (listenersAttached) return;
    listenersAttached = true;

    editor.registerUpdateListener(() => {
        if (visible) {
            renderWorkspace();
        }
    });

    window.addEventListener('cms-metadata-changed', () => {
        if (visible) {
            renderWorkspace();
        }
    });

    window.addEventListener('keydown', (event) => {
        if (!visible) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hideContentWorkspace();
        }
    }, true);
}

export function toggleContentWorkspace(tab: WorkspaceTab = 'cms'): void {
    activeTab = tab;
    if (visible) {
        renderWorkspace();
    } else {
        showContentWorkspace(tab);
    }
}

export function showContentWorkspace(tab: WorkspaceTab = 'cms'): void {
    ensurePanel();
    if (!panelRoot) return;

    activeTab = tab;
    visible = true;
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
    renderWorkspace();
}

export function hideContentWorkspace(): void {
    if (!panelRoot) return;

    visible = false;
    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('aside');
    panelRoot.id = 'content-workspace-panel';
    panelRoot.className = 'content-workspace-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <div class="content-workspace-backdrop" data-close="true"></div>
        <section class="content-workspace-card" role="dialog" aria-modal="true" aria-label="Content workspace">
            <header class="content-workspace-header">
                <div>
                    <p class="content-workspace-kicker">Workspace</p>
                    <h3>CMS, SEO, and Publish</h3>
                    <p class="content-workspace-subtitle">Manage metadata, readiness, and publishing from one place.</p>
                </div>
                <button type="button" class="content-workspace-close" aria-label="Close workspace">&times;</button>
            </header>
            <nav class="content-workspace-tabs" role="tablist" aria-label="Workspace sections">
                <button type="button" class="content-workspace-tab" data-tab="cms">CMS</button>
                <button type="button" class="content-workspace-tab" data-tab="seo">SEO</button>
                <button type="button" class="content-workspace-tab" data-tab="publish">Publish</button>
            </nav>
            <div class="content-workspace-body" data-body></div>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.content-workspace-close')) {
            hideContentWorkspace();
            return;
        }

        const tabButton = target.closest('[data-tab]') as HTMLElement | null;
        if (tabButton?.dataset.tab) {
            activeTab = tabButton.dataset.tab as WorkspaceTab;
            renderWorkspace();
            return;
        }

        const action = target.closest('[data-action]') as HTMLElement | null;
        if (!action?.dataset.action) return;

        if (action.dataset.action === 'save-cms') {
            readCmsFields();
            return;
        }

        if (action.dataset.action === 'copy-cms') {
            readCmsFields();
            await navigator.clipboard.writeText(JSON.stringify(getCmsPageMetadata(), null, 2));
            return;
        }

        if (action.dataset.action === 'open-export') {
            toggleExportPresetsPanel();
            return;
        }

        if (action.dataset.action === 'toggle-ready') {
            publishReady = (action.querySelector('input') as HTMLInputElement | null)?.checked ?? publishReady;
            persistPublishReady(publishReady);
            renderWorkspace();
            return;
        }

        if (action.dataset.action === 'copy-summary') {
            await navigator.clipboard.writeText(buildPublishSummary());
        }
    });
}

function renderWorkspace(): void {
    if (!panelRoot) return;

    panelRoot.querySelectorAll<HTMLElement>('.content-workspace-tab').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === activeTab);
    });

    const body = panelRoot.querySelector<HTMLElement>('[data-body]');
    if (!body) return;

    if (activeTab === 'cms') {
        body.innerHTML = renderCmsTab();
        bindCmsTab();
        return;
    }

    if (activeTab === 'seo') {
        const report = buildSeoReport();
        body.innerHTML = renderSeoTab(report);
        return;
    }

    const report = buildPublishReport();
    body.innerHTML = renderPublishTab(report);
}

function renderCmsTab(): string {
    const metadata = getCmsPageMetadata();
    return `
        <div class="workspace-preview">
            <span class="workspace-preview-badge">${ICONS.CMS}</span>
            <div>
                <strong id="cms-preview-title">${metadata.title || 'Untitled page'}</strong>
                <p id="cms-preview-slug">/${metadata.slug || 'untitled-page'}</p>
            </div>
        </div>
        <div class="workspace-template-grid">
            ${[
                ['home', 'Home Page', 'Clean landing page for a site homepage.'],
                ['blog', 'Blog Post', 'Article-friendly metadata for blog publishing.'],
                ['landing', 'Landing Page', 'High-conversion page with focused messaging.'],
                ['docs', 'Docs Page', 'Documentation or knowledge-base content.'],
                ['product', 'Product Page', 'Product or feature page with SEO fields.'],
            ].map(([id, name, description]) => `
                <button type="button" class="workspace-template-card" data-template-id="${id}">
                    <strong>${name}</strong>
                    <span>${description}</span>
                </button>
            `).join('')}
        </div>
        <div class="workspace-grid">
            <label class="workspace-field"><span>Page title</span><input id="cms-title" type="text" /></label>
            <label class="workspace-field"><span>Slug</span><input id="cms-slug" type="text" /></label>
            <label class="workspace-field"><span>Meta description</span><input id="cms-description" type="text" /></label>
            <label class="workspace-field"><span>Excerpt</span><textarea id="cms-excerpt" rows="4"></textarea></label>
            <label class="workspace-field"><span>Featured image URL</span><input id="cms-featured-image" type="url" /></label>
            <label class="workspace-field"><span>Canonical URL</span><input id="cms-canonical-url" type="url" /></label>
            <label class="workspace-check"><input id="cms-no-index" type="checkbox" /><span>No index this page</span></label>
        </div>
        <footer class="workspace-footer">
            <button type="button" class="workspace-button secondary" data-action="copy-cms">Copy metadata</button>
            <button type="button" class="workspace-button primary" data-action="save-cms">Save settings</button>
        </footer>
    `;
}

function bindCmsTab(): void {
    const root = panelRoot;
    if (!root) return;
    const metadata = getCmsPageMetadata();

    setValue('#cms-title', metadata.title);
    setValue('#cms-slug', metadata.slug);
    setValue('#cms-description', metadata.description);
    setTextarea('#cms-excerpt', metadata.excerpt);
    setValue('#cms-featured-image', metadata.featuredImage);
    setValue('#cms-canonical-url', metadata.canonicalUrl);
    setCheckbox('#cms-no-index', metadata.noIndex);

    root.querySelectorAll<HTMLElement>('[data-template-id]').forEach((button) => {
        button.addEventListener('click', () => {
            const id = button.dataset.templateId;
            const template = getTemplate(id || '');
            if (!template) return;
            setCmsPageMetadata(template);
            renderWorkspace();
        });
    });

    ['#cms-title', '#cms-slug', '#cms-description', '#cms-excerpt', '#cms-featured-image', '#cms-canonical-url', '#cms-no-index'].forEach((selector) => {
        const el = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!el) return;
        el.addEventListener('input', () => {
            readCmsFields(false);
            updateCmsPreview();
        });
        el.addEventListener('change', () => {
            readCmsFields(false);
            updateCmsPreview();
        });
    });
}

function readCmsFields(persist = true): void {
    const title = getValue('#cms-title');
    const slug = normalizeSlug(getValue('#cms-slug'));
    const description = getValue('#cms-description');
    const excerpt = getTextareaValue('#cms-excerpt');
    const featuredImage = getValue('#cms-featured-image');
    const canonicalUrl = getValue('#cms-canonical-url');
    const noIndex = getCheckboxValue('#cms-no-index');

    setCmsPageMetadata({ title, slug, description, excerpt, featuredImage, canonicalUrl, noIndex });
    if (!persist) {
        // setCmsPageMetadata already persists and emits the change event
    }
}

function updateCmsPreview(): void {
    const metadata = getCmsPageMetadata();
    const title = panelRoot?.querySelector<HTMLElement>('#cms-preview-title');
    const slug = panelRoot?.querySelector<HTMLElement>('#cms-preview-slug');
    if (title) title.textContent = metadata.title || 'Untitled page';
    if (slug) slug.textContent = `/${metadata.slug || 'untitled-page'}`;
}

function renderSeoTab(report: ReturnType<typeof buildSeoReport>): string {
    return `
        <div class="workspace-score">
            <div class="workspace-score-ring" data-score="${report.score}">${report.score}</div>
            <div>
                <strong>${report.level}</strong>
                <p>${report.summary}</p>
            </div>
        </div>
        <div class="workspace-metrics">
            ${report.metrics.map(metric => `
                <div class="workspace-metric ${metric.state}">
                    <span class="workspace-metric-label">${metric.label}</span>
                    <strong>${metric.value}</strong>
                    <span>${metric.note}</span>
                </div>
            `).join('')}
        </div>
        <div class="workspace-list">
            <div class="workspace-section-title">Recommendations</div>
            <ul>${report.recommendations.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        <footer class="workspace-footer">
            <button type="button" class="workspace-button secondary" data-action="cms">Open CMS</button>
            <button type="button" class="workspace-button secondary" data-action="copy-summary">Copy report</button>
        </footer>
    `;
}

function renderPublishTab(report: ReturnType<typeof buildPublishReport>): string {
    return `
        <div class="workspace-hero">
            <span class="workspace-preview-badge">${ICONS.PUBLISH}</span>
            <div>
                <strong>${report.title}</strong>
                <p>/${report.slug}</p>
            </div>
        </div>
        <div class="workspace-score">
            <div class="workspace-score-ring" data-score="${report.score}">${report.score}</div>
            <div>
                <strong>${publishReady ? 'Ready to publish' : report.level}</strong>
                <p>${report.summary}</p>
            </div>
        </div>
        <label class="workspace-ready">
            <input type="checkbox" data-action="toggle-ready" ${publishReady ? 'checked' : ''} />
            <span>Mark as ready to publish</span>
        </label>
        <div class="workspace-list">
            <div class="workspace-section-title">Checklist</div>
            <ul>${report.checks.map(check => `<li>${check.label}: ${check.passed ? 'Ready' : 'Needs work'}</li>`).join('')}</ul>
        </div>
        <footer class="workspace-footer">
            <button type="button" class="workspace-button secondary" data-action="cms">Open CMS</button>
            <button type="button" class="workspace-button secondary" data-action="seo">Open SEO</button>
            <button type="button" class="workspace-button secondary" data-action="open-export">Export</button>
            <button type="button" class="workspace-button primary" data-action="copy-summary">Copy summary</button>
        </footer>
    `;
}

function buildSeoReport() {
    const metadata = getCmsPageMetadata();
    const stats = collectStats(activeEditor);
    const metrics = [
        {
            label: 'Title',
            value: metadata.title || 'Missing',
            state: metadata.title.trim().length ? 'good' as const : 'bad' as const,
            note: metadata.title.trim().length ? 'Strong title in place.' : 'Add a title.',
        },
        {
            label: 'Description',
            value: metadata.description ? `${metadata.description.length} chars` : 'Missing',
            state: metadata.description.trim().length >= 120 ? 'good' as const : metadata.description.trim().length ? 'warn' as const : 'bad' as const,
            note: metadata.description.trim().length >= 120 ? 'Healthy meta description length.' : 'Expand the description.',
        },
        {
            label: 'Words',
            value: String(stats.words),
            state: stats.words >= 120 ? 'good' as const : 'warn' as const,
            note: stats.words >= 120 ? 'Enough content depth.' : 'Add more body content.',
        },
        {
            label: 'Headings',
            value: String(stats.headings),
            state: stats.headings >= 2 ? 'good' as const : 'warn' as const,
            note: stats.headings >= 2 ? 'Good structure.' : 'Add more sections.',
        },
    ];

    const recommendations = [
        !metadata.title.trim() ? 'Add a page title.' : '',
        metadata.description.trim().length < 120 ? 'Expand the meta description.' : '',
        stats.words < 120 ? 'Add more content depth.' : '',
        stats.headings < 2 ? 'Use more headings.' : '',
        !metadata.canonicalUrl.trim() ? 'Add a canonical URL.' : '',
    ].filter(Boolean) as string[];

    const score = Math.round((metrics.filter(item => item.state === 'good').length / metrics.length) * 100);
    const level = score >= 85 ? 'excellent' : score >= 65 ? 'good' : 'needs work';
    const summary = score >= 85 ? 'Strong SEO basics.' : score >= 65 ? 'Good foundation.' : 'Needs more work.';

    return { score, level, summary, metrics, recommendations, stats };
}

function buildPublishReport() {
    const metadata = getCmsPageMetadata();
    const stats = collectStats(activeEditor);
    const checks = [
        { label: 'Title', passed: !!metadata.title.trim() },
        { label: 'Slug', passed: metadata.slug.trim().length > 0 && metadata.slug !== 'untitled-page' },
        { label: 'Description', passed: metadata.description.trim().length >= 80 },
        { label: 'Content depth', passed: stats.words >= 120 },
        { label: 'Structure', passed: stats.headings >= 2 },
        { label: 'SEO', passed: !!metadata.canonicalUrl.trim() && !metadata.noIndex },
    ];
    const score = Math.round((checks.filter(item => item.passed).length / checks.length) * 100);
    const level = score >= 85 ? 'ready to publish' : score >= 65 ? 'close to ready' : 'draft';
    const summary = score >= 85 ? 'This page is in great shape.' : score >= 65 ? 'A few items still need attention.' : 'The page needs more metadata and structure.';
    return { title: metadata.title || 'Untitled page', slug: metadata.slug || 'untitled-page', score, level, summary, checks, stats };
}

function collectStats(editor: LexicalEditor | null): WorkspaceStats {
    const stats: WorkspaceStats = {
        words: 0,
        headings: 0,
        paragraphs: 0,
        images: 0,
        links: 0,
        tables: 0,
        quotes: 0,
        codeBlocks: 0,
        videos: 0,
    };

    if (!editor) return stats;

    editor.getEditorState().read(() => {
        const root = $getRoot();
        const text = root.getTextContent().trim();
        stats.words = text ? text.split(/\s+/).length : 0;

        const visit = (node: any): void => {
            if ($isHeadingNode(node)) stats.headings += 1;
            else if ($isQuoteNode(node)) stats.quotes += 1;
            else if ($isListNode(node)) stats.paragraphs += 0;
            else if ($isTableNode(node)) stats.tables += 1;
            else if ($isImageNode(node)) stats.images += 1;
            else if ($isYouTubeNode(node)) stats.videos += 1;
            else if ($isCodeNode(node)) stats.codeBlocks += 1;
            else if ($isLinkNode(node)) stats.links += 1;
            else if ($isElementNode(node) && node.getType() === 'paragraph') stats.paragraphs += 1;

            if (typeof node.getChildren === 'function') {
                node.getChildren().forEach((child: any) => visit(child));
            }
        };

        visit(root);
    });

    return stats;
}

function getTemplate(id: string): Partial<ReturnType<typeof getCmsPageMetadata>> | null {
    const templates: Record<string, Partial<ReturnType<typeof getCmsPageMetadata>>> = {
        home: { title: 'Home', slug: 'home', description: 'Welcome visitors with a clear homepage.', excerpt: 'A concise homepage introduction.', featuredImage: '', canonicalUrl: '', noIndex: false },
        blog: { title: 'New Blog Post', slug: 'new-blog-post', description: 'An SEO-friendly article description.', excerpt: 'A short summary for your blog.', featuredImage: '', canonicalUrl: '', noIndex: false },
        landing: { title: 'Landing Page', slug: 'landing-page', description: 'A page designed for conversion.', excerpt: 'Focused campaign copy.', featuredImage: '', canonicalUrl: '', noIndex: false },
        docs: { title: 'Documentation', slug: 'documentation', description: 'Structured documentation page metadata.', excerpt: 'Helpful content for docs.', featuredImage: '', canonicalUrl: '', noIndex: false },
        product: { title: 'Product', slug: 'product', description: 'Product page metadata for publishing.', excerpt: 'Feature highlights and details.', featuredImage: '', canonicalUrl: '', noIndex: false },
    };
    return templates[id] || null;
}

function setValue(selector: string, value: string): void {
    const el = panelRoot?.querySelector(selector) as HTMLInputElement | null;
    if (el) el.value = value;
}

function setTextarea(selector: string, value: string): void {
    const el = panelRoot?.querySelector(selector) as HTMLTextAreaElement | null;
    if (el) el.value = value;
}

function setCheckbox(selector: string, value: boolean): void {
    const el = panelRoot?.querySelector(selector) as HTMLInputElement | null;
    if (el) el.checked = value;
}

function getValue(selector: string): string {
    return (panelRoot?.querySelector(selector) as HTMLInputElement | null)?.value.trim() || '';
}

function getTextareaValue(selector: string): string {
    return (panelRoot?.querySelector(selector) as HTMLTextAreaElement | null)?.value.trim() || '';
}

function getCheckboxValue(selector: string): boolean {
    return (panelRoot?.querySelector(selector) as HTMLInputElement | null)?.checked || false;
}

function normalizeSlug(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled-page';
}

function buildPublishSummary(): string {
    const report = buildPublishReport();
    return [
        'Publish Workflow',
        `Title: ${report.title}`,
        `Slug: ${report.slug}`,
        `Score: ${report.score}/100 (${report.level})`,
        '',
        'Checklist:',
        ...report.checks.map(check => `- ${check.label}: ${check.passed ? 'Ready' : 'Needs work'}`),
    ].join('\n');
}

function loadPublishReady(): boolean {
    try {
        return localStorage.getItem('aurelia-editor-publish-ready') === 'true';
    } catch {
        return false;
    }
}

function persistPublishReady(value: boolean): void {
    try {
        localStorage.setItem('aurelia-editor-publish-ready', value ? 'true' : 'false');
    } catch {
        // Ignore storage issues.
    }
}
