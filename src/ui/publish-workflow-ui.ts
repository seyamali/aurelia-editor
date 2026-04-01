import { $getRoot, $isElementNode, type LexicalEditor } from 'lexical';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isListNode } from '@lexical/list';
import { $isTableNode } from '@lexical/table';
import { $isImageNode } from '../plugins/media/image-node';
import { $isYouTubeNode } from '../plugins/advanced/youtube-node';
import { $isCodeNode } from '@lexical/code';
import { $isLinkNode } from '@lexical/link';
import { getCmsPageMetadata } from './cms-page-settings-ui';
import { toggleContentWorkspace } from './content-workspace-ui';
import { toggleExportPresetsPanel } from './export-presets-ui';
import { ICONS } from './icons';

type PublishCheck = {
    label: string;
    passed: boolean;
    detail: string;
};

type PublishStats = {
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

const STORAGE_KEY = 'aurelia-editor-publish-ready';

let activeEditor: LexicalEditor | null = null;
let panelRoot: HTMLElement | null = null;
let visible = false;
let listenersAttached = false;
let publishReady = loadPublishReady();

export function setupPublishWorkflowUI(editor: LexicalEditor): void {
    activeEditor = editor;
    ensurePanel();

    if (listenersAttached) return;
    listenersAttached = true;

    editor.registerUpdateListener(() => {
        if (visible) {
            refreshPanel();
        }
    });

    window.addEventListener('cms-metadata-changed', refreshPanel);

    window.addEventListener('keydown', (event) => {
        if (!visible) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            hidePublishWorkflowPanel();
        }
    }, true);
}

export function togglePublishWorkflowPanel(): void {
    if (visible) {
        hidePublishWorkflowPanel();
    } else {
        showPublishWorkflowPanel();
    }
}

export function showPublishWorkflowPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    visible = true;
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
    refreshPanel();
}

export function hidePublishWorkflowPanel(): void {
    if (!panelRoot) return;

    visible = false;
    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('aside');
    panelRoot.id = 'publish-workflow-panel';
    panelRoot.className = 'publish-workflow-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <div class="publish-workflow-backdrop" data-close="true"></div>
        <section class="publish-workflow-card" role="dialog" aria-modal="true" aria-label="Publish workflow">
            <header class="publish-workflow-header">
                <div>
                    <p class="publish-workflow-kicker">Publish</p>
                    <h3>Ready to publish</h3>
                    <p class="publish-workflow-subtitle">A single place for metadata, SEO, content checks, and export.</p>
                </div>
                <button type="button" class="publish-workflow-close" aria-label="Close publish workflow">&times;</button>
            </header>
            <div class="publish-workflow-hero">
                <span class="publish-workflow-badge">${ICONS.PUBLISH}</span>
                <div>
                    <strong data-title>Untitled page</strong>
                    <p data-slug>/untitled-page</p>
                </div>
            </div>
            <div class="publish-workflow-score">
                <div class="publish-workflow-score-ring" data-score>0</div>
                <div>
                    <strong data-status>Draft</strong>
                    <p data-summary>Fill in page metadata and review the checks before publishing.</p>
                </div>
            </div>
            <label class="publish-workflow-ready">
                <input type="checkbox" data-action="ready" />
                <span>Mark as ready to publish</span>
            </label>
            <div class="publish-workflow-checks" data-checks></div>
            <div class="publish-workflow-actions">
                <button type="button" class="publish-workflow-button secondary" data-action="cms">Open CMS</button>
                <button type="button" class="publish-workflow-button secondary" data-action="seo">Open SEO</button>
                <button type="button" class="publish-workflow-button secondary" data-action="export">Export</button>
                <button type="button" class="publish-workflow-button primary" data-action="copy">Copy summary</button>
            </div>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.publish-workflow-close')) {
            hidePublishWorkflowPanel();
            return;
        }

        const action = target.closest('[data-action]') as HTMLElement | null;
        if (!action?.dataset.action) return;

        switch (action.dataset.action) {
            case 'cms':
                toggleContentWorkspace('cms');
                break;
            case 'seo':
                toggleContentWorkspace('seo');
                break;
            case 'export':
                toggleExportPresetsPanel();
                break;
            case 'copy':
                await navigator.clipboard.writeText(buildSummaryText(buildReport()));
                break;
        }
    });

    const readyToggle = panelRoot.querySelector<HTMLInputElement>('[data-action="ready"]');
    if (readyToggle) {
        readyToggle.checked = publishReady;
        readyToggle.addEventListener('change', () => {
            publishReady = readyToggle.checked;
            persistPublishReady(publishReady);
            refreshPanel();
        });
    }
}

function refreshPanel(): void {
    if (!panelRoot) return;

    const report = buildReport();
    const title = panelRoot.querySelector<HTMLElement>('[data-title]');
    const slug = panelRoot.querySelector<HTMLElement>('[data-slug]');
    const score = panelRoot.querySelector<HTMLElement>('[data-score]');
    const status = panelRoot.querySelector<HTMLElement>('[data-status]');
    const summary = panelRoot.querySelector<HTMLElement>('[data-summary]');
    const checks = panelRoot.querySelector<HTMLElement>('[data-checks]');

    if (title) title.textContent = report.title || 'Untitled page';
    if (slug) slug.textContent = `/${report.slug}`;
    if (score) score.textContent = String(report.score);
    if (score) score.style.setProperty('--publish-score', String(report.score));
    if (status) status.textContent = publishReady ? 'Ready to publish' : report.level;
    if (summary) summary.textContent = report.summary;

    if (checks) {
        checks.innerHTML = report.checks.map(check => `
            <div class="publish-check ${check.passed ? 'passed' : 'failed'}">
                <span class="publish-check-label">${check.label}</span>
                <strong>${check.passed ? 'Ready' : 'Needs work'}</strong>
                <p>${check.detail}</p>
            </div>
        `).join('');
    }
}

function buildReport() {
    const metadata = getCmsPageMetadata();
    const stats = collectStats(activeEditor);

    const checks: PublishCheck[] = [
        {
            label: 'Title',
            passed: metadata.title.trim().length > 0,
            detail: metadata.title.trim().length > 0 ? 'Page title is set.' : 'Add a title in CMS.',
        },
        {
            label: 'Slug',
            passed: metadata.slug.trim().length > 0 && metadata.slug !== 'untitled-page',
            detail: metadata.slug.trim().length > 0 && metadata.slug !== 'untitled-page' ? 'Slug is readable.' : 'Choose a publishable slug.',
        },
        {
            label: 'Description',
            passed: metadata.description.trim().length >= 80,
            detail: metadata.description.trim().length >= 80 ? 'Meta description looks healthy.' : 'Expand the meta description.',
        },
        {
            label: 'Content depth',
            passed: stats.words >= 120,
            detail: stats.words >= 120 ? 'Enough body content for a public page.' : 'Add more content before publishing.',
        },
        {
            label: 'Structure',
            passed: stats.headings >= 2,
            detail: stats.headings >= 2 ? 'Document has a clear section structure.' : 'Add headings for readability.',
        },
        {
            label: 'Media',
            passed: stats.images >= 1 || stats.videos >= 1,
            detail: stats.images >= 1 || stats.videos >= 1 ? 'Visual support is present.' : 'Add an image or video if relevant.',
        },
        {
            label: 'SEO',
            passed: !!metadata.canonicalUrl.trim() && !metadata.noIndex,
            detail: !!metadata.canonicalUrl.trim() && !metadata.noIndex ? 'Indexable with a canonical URL.' : 'Set canonical URL and check noindex.',
        },
    ];

    const score = Math.round((checks.filter(item => item.passed).length / checks.length) * 100);
    const level = score >= 85 ? 'ready to publish' : score >= 65 ? 'close to ready' : 'draft';
    const summary = score >= 85
        ? 'This page is in great shape for publishing.'
        : score >= 65
            ? 'A few items still need attention before publishing.'
            : 'The page needs more metadata and structure before publishing.';

    return {
        title: metadata.title || 'Untitled page',
        slug: metadata.slug || 'untitled-page',
        score,
        level,
        summary,
        checks,
        stats,
        metadata,
    };
}

function collectStats(editor: LexicalEditor | null): PublishStats {
    const stats: PublishStats = {
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

function buildSummaryText(report: ReturnType<typeof buildReport>): string {
    return [
        'Publish Workflow',
        `Title: ${report.title}`,
        `Slug: ${report.slug}`,
        `Score: ${report.score}/100 (${report.level})`,
        `Words: ${report.stats.words}`,
        `Headings: ${report.stats.headings}`,
        `Images: ${report.stats.images}`,
        `Links: ${report.stats.links}`,
        '',
        'Checks:',
        ...report.checks.map(check => `- ${check.label}: ${check.passed ? 'Ready' : 'Needs work'}`),
    ].join('\n');
}

function loadPublishReady(): boolean {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return false;
    }
}

function persistPublishReady(value: boolean): void {
    try {
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
        // Ignore storage issues.
    }
}
