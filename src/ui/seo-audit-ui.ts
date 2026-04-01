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
import { ICONS } from './icons';

type SeoMetricState = 'good' | 'warn' | 'bad';

type SeoMetric = {
    label: string;
    value: string;
    state: SeoMetricState;
    note: string;
};

type SeoAuditReport = {
    score: number;
    level: string;
    summary: string;
    metrics: SeoMetric[];
    recommendations: string[];
    stats: {
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
};

let panelRoot: HTMLElement | null = null;
let visible = false;
let listenersAttached = false;
let activeEditor: LexicalEditor | null = null;

export function setupSeoAuditUI(editor: LexicalEditor): void {
    activeEditor = editor;
    ensurePanel();

    const refresh = () => {
        if (!panelRoot) return;
        renderAudit(panelRoot, buildReport(editor));
    };

    editor.registerUpdateListener(() => {
        if (visible) {
            refresh();
        }
    });

    window.addEventListener('cms-metadata-changed', refresh);

    if (!listenersAttached) {
        listenersAttached = true;
        window.addEventListener('keydown', (event) => {
            if (!visible) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                hideSeoAuditPanel();
            }
        }, true);
    }

    refresh();
}

export function toggleSeoAuditPanel(): void {
    if (visible) {
        hideSeoAuditPanel();
    } else {
        showSeoAuditPanel();
    }
}

export function showSeoAuditPanel(): void {
    ensurePanel();
    if (!panelRoot) return;

    visible = true;
    panelRoot.classList.remove('hidden');
    panelRoot.setAttribute('aria-hidden', 'false');
    renderAudit(panelRoot, buildReportFromActiveContext());
}

export function hideSeoAuditPanel(): void {
    if (!panelRoot) return;

    visible = false;
    panelRoot.classList.add('hidden');
    panelRoot.setAttribute('aria-hidden', 'true');
}

function ensurePanel(): void {
    if (panelRoot) return;

    panelRoot = document.createElement('aside');
    panelRoot.id = 'seo-audit-panel';
    panelRoot.className = 'seo-audit-panel hidden';
    panelRoot.setAttribute('aria-hidden', 'true');
    panelRoot.innerHTML = `
        <div class="seo-audit-backdrop" data-close="true"></div>
        <section class="seo-audit-card" role="dialog" aria-modal="true" aria-label="SEO audit">
            <header class="seo-audit-header">
                <div>
                    <span class="seo-audit-badge">${ICONS.SEO}</span>
                    <p class="seo-audit-kicker">SEO</p>
                    <h3>Audit and optimize</h3>
                    <p class="seo-audit-subtitle">A live snapshot of page metadata and document structure.</p>
                </div>
                <button type="button" class="seo-audit-close" aria-label="Close SEO audit">&times;</button>
            </header>
            <div class="seo-audit-score">
                <div class="seo-audit-score-ring" data-score-ring>0</div>
                <div class="seo-audit-score-copy">
                    <strong data-level>Needs attention</strong>
                    <p data-summary>Open the CMS panel to tune page metadata, then refine the document structure here.</p>
                </div>
            </div>
            <div class="seo-audit-metrics" data-metrics></div>
            <div class="seo-audit-recommendations">
                <div class="seo-audit-section-title">Recommendations</div>
                <ul class="seo-audit-list" data-recommendations></ul>
            </div>
            <footer class="seo-audit-footer">
                <button type="button" class="seo-audit-button secondary" data-action="cms">Open CMS</button>
                <button type="button" class="seo-audit-button secondary" data-action="copy">Copy report</button>
            </footer>
        </section>
    `;

    document.body.appendChild(panelRoot);

    panelRoot.addEventListener('click', async (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('[data-close="true"]') || target.closest('.seo-audit-close')) {
            hideSeoAuditPanel();
            return;
        }

        const action = target.closest('[data-action]') as HTMLElement | null;
        if (!action?.dataset.action) return;

        if (action.dataset.action === 'cms') {
            toggleContentWorkspace('cms');
            return;
        }

        if (action.dataset.action === 'copy') {
            const report = buildReportFromActiveContext();
            await navigator.clipboard.writeText(buildCopyText(report));
        }
    });
}

function buildReportFromActiveContext(): SeoAuditReport {
    return buildReportFromEditor(activeEditor);
}

function buildReport(editor: LexicalEditor): SeoAuditReport {
    return buildReportFromEditor(editor);
}

function buildReportFromEditor(editor: LexicalEditor | null): SeoAuditReport {
    const metadata = getCmsPageMetadata();
    const stats = {
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

    if (editor) {
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
    }

    const metrics: SeoMetric[] = [];
    let score = 0;

    const titleLength = metadata.title.trim().length;
    const descriptionLength = metadata.description.trim().length;
    const excerptLength = metadata.excerpt.trim().length;
    const slugLength = metadata.slug.trim().length;

    metrics.push(scoreMetric(
        'Title',
        metadata.title || 'Missing',
        titleLength >= 25 && titleLength <= 60 ? 'good' : titleLength > 0 ? 'warn' : 'bad',
        titleLength >= 25 && titleLength <= 60
            ? 'A strong title length for search results.'
            : titleLength > 0
                ? 'Consider keeping it closer to 25-60 characters.'
                : 'Add a page title.'
    ));
    score += points(titleLength >= 25 && titleLength <= 60 ? 20 : titleLength > 0 ? 12 : 0);

    metrics.push(scoreMetric(
        'Description',
        descriptionLength ? `${descriptionLength} chars` : 'Missing',
        descriptionLength >= 120 && descriptionLength <= 160 ? 'good' : descriptionLength > 0 ? 'warn' : 'bad',
        descriptionLength >= 120 && descriptionLength <= 160
            ? 'Meta description is in the sweet spot.'
            : descriptionLength > 0
                ? 'Aim for roughly 120-160 characters.'
                : 'Add a meta description.'
    ));
    score += points(descriptionLength >= 120 && descriptionLength <= 160 ? 20 : descriptionLength > 0 ? 12 : 0);

    metrics.push(scoreMetric(
        'Slug',
        metadata.slug || 'untitled-page',
        slugLength >= 3 && metadata.slug !== 'untitled-page' ? 'good' : 'warn',
        slugLength >= 3 && metadata.slug !== 'untitled-page'
            ? 'Slug is readable and usable in URLs.'
            : 'Use a short, descriptive slug.'
    ));
    score += points(slugLength >= 3 && metadata.slug !== 'untitled-page' ? 10 : 4);

    metrics.push(scoreMetric(
        'Excerpt',
        excerptLength ? `${excerptLength} chars` : 'Missing',
        excerptLength >= 40 && excerptLength <= 160 ? 'good' : excerptLength > 0 ? 'warn' : 'bad',
        excerptLength >= 40 && excerptLength <= 160
            ? 'Excerpt length looks healthy.'
            : excerptLength > 0
                ? 'Keep excerpts concise and readable.'
                : 'Add a short summary.'
    ));
    score += points(excerptLength >= 40 && excerptLength <= 160 ? 10 : excerptLength > 0 ? 6 : 0);

    metrics.push(scoreMetric(
        'Words',
        String(stats.words),
        stats.words >= 300 ? 'good' : stats.words >= 120 ? 'warn' : 'bad',
        stats.words >= 300
            ? 'Enough body content for a fuller page.'
            : stats.words >= 120
                ? 'More depth would help this page rank better.'
                : 'Add more content before publishing.'
    ));
    score += points(stats.words >= 300 ? 20 : stats.words >= 120 ? 10 : 2);

    metrics.push(scoreMetric(
        'Headings',
        String(stats.headings),
        stats.headings >= 2 ? 'good' : stats.headings >= 1 ? 'warn' : 'bad',
        stats.headings >= 2
            ? 'Page structure is easy to scan.'
            : stats.headings >= 1
                ? 'Add one more heading for clarity.'
                : 'Break the page into sections.'
    ));
    score += points(stats.headings >= 2 ? 10 : stats.headings >= 1 ? 6 : 0);

    metrics.push(scoreMetric(
        'Media',
        `${stats.images} images`,
        stats.images >= 1 ? 'good' : 'warn',
        stats.images >= 1
            ? 'Visual support is present.'
            : 'Add an image if the page benefits from one.'
    ));
    score += points(stats.images >= 1 ? 5 : 2);

    metrics.push(scoreMetric(
        'Links',
        String(stats.links),
        stats.links >= 1 ? 'good' : 'warn',
        stats.links >= 1
            ? 'Useful references are present.'
            : 'Consider adding internal or external references.'
    ));
    score += points(stats.links >= 1 ? 5 : 2);

    const canonicalScore = metadata.canonicalUrl ? 5 : 0;
    metrics.push(scoreMetric(
        'Canonical',
        metadata.canonicalUrl ? 'Set' : 'Missing',
        metadata.canonicalUrl ? 'good' : 'warn',
        metadata.canonicalUrl
            ? 'Canonical URL is defined.'
            : 'Add a canonical URL for duplicate-content safety.'
    ));
    score += canonicalScore;

    const noIndexState = metadata.noIndex ? 'warn' : 'good';
    metrics.push(scoreMetric(
        'Indexing',
        metadata.noIndex ? 'Noindex' : 'Indexable',
        noIndexState,
        metadata.noIndex
            ? 'This page will be hidden from search engines.'
            : 'Search engines can index this page.'
    ));
    score += metadata.noIndex ? 0 : 5;

    score = Math.max(0, Math.min(100, score));

    return {
        score,
        level: getScoreLevel(score),
        summary: getScoreSummary(score),
        metrics,
        recommendations: buildRecommendations(metadata, stats),
        stats,
    };
}

function buildRecommendations(metadata: ReturnType<typeof getCmsPageMetadata>, stats: SeoAuditReport['stats']): string[] {
    const recommendations: string[] = [];

    if (!metadata.title.trim()) recommendations.push('Add a page title before publishing.');
    if (metadata.description.trim().length < 120) recommendations.push('Expand the meta description to roughly 120-160 characters.');
    if (stats.words < 120) recommendations.push('Add more body content to improve topical depth.');
    if (stats.headings < 2) recommendations.push('Use at least two headings to create a clearer structure.');
    if (!metadata.excerpt.trim()) recommendations.push('Write a short excerpt for feeds and CMS previews.');
    if (!metadata.canonicalUrl.trim()) recommendations.push('Add a canonical URL if this page can be duplicated elsewhere.');

    return recommendations.length > 0
        ? recommendations
        : ['This page is in good shape. Keep refining the content and links.'];
}

function renderAudit(panel: HTMLElement, report: SeoAuditReport): void {
    const scoreRing = panel.querySelector<HTMLElement>('[data-score-ring]');
    const level = panel.querySelector<HTMLElement>('[data-level]');
    const summary = panel.querySelector<HTMLElement>('[data-summary]');
    const metrics = panel.querySelector<HTMLElement>('[data-metrics]');
    const recommendations = panel.querySelector<HTMLElement>('[data-recommendations]');

    if (scoreRing) {
        scoreRing.textContent = String(report.score);
        scoreRing.style.setProperty('--seo-score', `${report.score}`);
        scoreRing.dataset.level = report.level;
    }

    if (level) level.textContent = report.level;
    if (summary) summary.textContent = report.summary;

    if (metrics) {
        metrics.innerHTML = report.metrics.map(metric => `
            <div class="seo-audit-metric ${metric.state}">
                <span class="seo-audit-metric-label">${metric.label}</span>
                <strong class="seo-audit-metric-value">${metric.value}</strong>
                <span class="seo-audit-metric-note">${metric.note}</span>
            </div>
        `).join('');
    }

    if (recommendations) {
        recommendations.innerHTML = report.recommendations.map(item => `
            <li>${item}</li>
        `).join('');
    }
}

function scoreMetric(label: string, value: string, state: SeoMetricState, note: string): SeoMetric {
    return { label, value, state, note };
}

function points(value: number): number {
    return value;
}

function getScoreLevel(score: number): string {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 45) return 'fair';
    return 'needs work';
}

function getScoreSummary(score: number): string {
    if (score >= 85) return 'Strong SEO basics with only minor polish left.';
    if (score >= 70) return 'Good foundation. A few optimizations could help.';
    if (score >= 45) return 'Decent start, but the page still needs more structure.';
    return 'The page needs more metadata and content before publishing.';
}

function buildCopyText(report: SeoAuditReport): string {
    const metadata = getCmsPageMetadata();
    return [
        'SEO Audit',
        `Score: ${report.score}/100 (${report.level})`,
        `Title: ${metadata.title || 'Missing'}`,
        `Slug: ${metadata.slug}`,
        `Description: ${metadata.description || 'Missing'}`,
        `Excerpt: ${metadata.excerpt || 'Missing'}`,
        `Words: ${report.stats.words}`,
        `Headings: ${report.stats.headings}`,
        `Images: ${report.stats.images}`,
        `Links: ${report.stats.links}`,
        '',
        'Recommendations:',
        ...report.recommendations.map(item => `- ${item}`),
    ].join('\n');
}
