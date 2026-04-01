import { $nodesOfType, type LexicalEditor } from 'lexical';
import { CommentNode, type CommentReply } from '../plugins/collaboration/comment-node';
import {
    ADD_COMMENT_REPLY_COMMAND,
    DELETE_COMMENT_COMMAND,
    SET_COMMENT_RESOLVED_COMMAND,
} from '../plugins/collaboration/comments';

type CommentFilter = 'all' | 'open' | 'resolved';

type CommentThread = {
    id: string;
    author: string;
    commentText: string;
    quote: string;
    timestamp: number;
    nodeKeys: string[];
    resolved: boolean;
    replies: CommentReply[];
};

export function setupCommentsUI(editor: LexicalEditor) {
    let activeCommentId: string | null = null;
    let activeFilter: CommentFilter = 'open';
    const sidebar = createCommentsSidebar(
        editor,
        () => activeFilter,
        (nextFilter) => { activeFilter = nextFilter; }
    );
    document.body.appendChild(sidebar);

    const widget = createCommentsWidget();
    document.body.appendChild(widget);

    const refresh = (detail?: { open?: boolean; focusCommentId?: string }) => {
        const threads = collectCommentThreads(editor);
        renderCommentThreads(sidebar, editor, threads, activeCommentId, activeFilter);
        updateWidget(widget, threads.filter(thread => !thread.resolved).length);

        if (detail?.focusCommentId) {
            activeCommentId = detail.focusCommentId;
            focusComment(editor, sidebar, activeCommentId);
        }

        if (detail?.open) {
            sidebar.classList.add('open');
        }
    };

    window.addEventListener('editor-comments-toggle', () => {
        sidebar.classList.toggle('open');
        refresh();
    });

    window.addEventListener('editor-comments-updated', ((event: CustomEvent) => {
        refresh(event.detail);
    }) as EventListener);

    widget.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        refresh();
    });

    editor.registerUpdateListener(() => {
        if (sidebar.classList.contains('open')) {
            refresh();
        } else {
            updateWidget(widget, collectCommentThreads(editor).filter(thread => !thread.resolved).length);
        }
    });

    editor.registerRootListener((rootElement) => {
        if (!rootElement) return;

        rootElement.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const commentEl = target.closest('.comment-node') as HTMLElement | null;
            if (!commentEl) return;

            const commentId = commentEl.dataset.commentId;
            if (!commentId) return;

            activeCommentId = commentId;
            sidebar.classList.add('open');
            activeFilter = 'all';
            refresh({ open: true, focusCommentId: commentId });
        });
    });

    refresh();
}

function createCommentsSidebar(
    editor: LexicalEditor,
    getActiveFilter: () => CommentFilter,
    setActiveFilter: (filter: CommentFilter) => void
): HTMLElement {
    const sidebar = document.createElement('aside');
    sidebar.className = 'comments-sidebar';
    sidebar.innerHTML = `
        <div class="comments-sidebar-header">
            <div>
                <h3>Comments</h3>
                <p class="comments-sidebar-subtitle">Threaded replies and status filters</p>
            </div>
            <button class="comments-close-btn" aria-label="Close comments">&times;</button>
        </div>
        <div class="comments-filter-bar" role="tablist" aria-label="Comment filters">
            <button class="comments-filter-btn active" type="button" data-filter="open">Open</button>
            <button class="comments-filter-btn" type="button" data-filter="resolved">Resolved</button>
            <button class="comments-filter-btn" type="button" data-filter="all">All</button>
        </div>
        <div class="comments-sidebar-list" id="comments-sidebar-list"></div>
    `;

    sidebar.querySelector('.comments-close-btn')?.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    sidebar.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;

        const filterButton = target.closest('.comments-filter-btn') as HTMLButtonElement | null;
        if (filterButton?.dataset.filter) {
            const nextFilter = filterButton.dataset.filter as CommentFilter;
            setActiveFilter(nextFilter);
            refreshCommentsSidebar(sidebar, editor, getActiveFilter());
            return;
        }

        const commentCard = target.closest('.comment-thread-card') as HTMLElement | null;
        const commentId = commentCard?.dataset.commentId;
        if (!commentId) return;

        if (target.closest('.comment-resolve-btn')) {
            const isResolved = commentCard?.dataset.resolved === 'true';
            editor.dispatchCommand(SET_COMMENT_RESOLVED_COMMAND, { commentId, resolved: !isResolved });
            return;
        }

        if (target.closest('.comment-delete-btn')) {
            editor.dispatchCommand(DELETE_COMMENT_COMMAND, commentId);
            return;
        }

        if (target.closest('.comment-jump-btn')) {
            focusComment(editor, sidebar, commentId);
            return;
        }
    });

    sidebar.addEventListener('submit', (event) => {
        const form = event.target as HTMLFormElement;
        if (!form.classList.contains('comment-reply-form')) {
            return;
        }

        event.preventDefault();

        const commentId = form.dataset.commentId;
        const textarea = form.querySelector('textarea');
        const replyText = textarea?.value.trim();
        if (!commentId || !replyText) {
            return;
        }

        editor.dispatchCommand(ADD_COMMENT_REPLY_COMMAND, {
            commentId,
            replyText,
            author: 'Current User'
        });

        if (textarea) {
            textarea.value = '';
        }
    });

    return sidebar;
}

function createCommentsWidget(): HTMLElement {
    const widget = document.createElement('button');
    widget.className = 'comments-widget';
    widget.type = 'button';
    widget.innerHTML = `
        <span class="comments-widget-dot"></span>
        <span class="comments-widget-label">Comments</span>
        <span class="comments-widget-count">0</span>
    `;
    return widget;
}

function collectCommentThreads(editor: LexicalEditor): CommentThread[] {
    const threads = new Map<string, CommentThread>();

    editor.getEditorState().read(() => {
        const nodes = $nodesOfType(CommentNode);
        nodes.forEach(node => {
            const existing = threads.get(node.getCommentId());
            const replies = node.getReplies();

            if (existing) {
                existing.quote += node.getTextContent();
                existing.nodeKeys.push(node.getKey());
                existing.resolved = existing.resolved || node.isResolved();
                if (replies.length > existing.replies.length) {
                    existing.replies = replies;
                }
                return;
            }

            threads.set(node.getCommentId(), {
                id: node.getCommentId(),
                author: node.getAuthor(),
                commentText: node.getCommentText(),
                quote: node.getTextContent(),
                timestamp: node.getTimestamp(),
                nodeKeys: [node.getKey()],
                resolved: node.isResolved(),
                replies
            });
        });
    });

    return Array.from(threads.values()).sort((a, b) => b.timestamp - a.timestamp);
}

function refreshCommentsSidebar(sidebar: HTMLElement, editor: LexicalEditor, activeFilter: CommentFilter) {
    renderCommentThreads(sidebar, editor, collectCommentThreads(editor), null, activeFilter);
}

function renderCommentThreads(
    sidebar: HTMLElement,
    editor: LexicalEditor,
    threads: CommentThread[],
    activeCommentId: string | null,
    activeFilter: CommentFilter
) {
    const list = sidebar.querySelector('#comments-sidebar-list');
    if (!list) return;

    sidebar.querySelectorAll('.comments-filter-btn').forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLButtonElement).dataset.filter === activeFilter);
    });

    const visibleThreads = threads.filter(thread => {
        if (activeFilter === 'open') return !thread.resolved;
        if (activeFilter === 'resolved') return thread.resolved;
        return true;
    });

    list.innerHTML = '';

    if (visibleThreads.length === 0) {
        list.innerHTML = `<div class="comments-empty-state">No ${activeFilter === 'all' ? '' : activeFilter + ' '}comments yet.</div>`;
        clearCommentHighlights(editor);
        return;
    }

    visibleThreads.forEach(thread => {
        const card = document.createElement('article');
        card.className = `comment-thread-card${thread.id === activeCommentId ? ' active' : ''}${thread.resolved ? ' resolved' : ''}`;
        card.dataset.commentId = thread.id;
        card.dataset.resolved = String(thread.resolved);
        card.innerHTML = `
            <div class="comment-thread-header">
                <div class="comment-thread-header-main">
                    <span class="comment-thread-author">${thread.author}</span>
                    <span class="comment-thread-status${thread.resolved ? ' resolved' : ''}">${thread.resolved ? 'Resolved' : 'Open'}</span>
                </div>
                <span class="comment-thread-time">${new Date(thread.timestamp).toLocaleString()}</span>
            </div>
            <div class="comment-thread-body">${thread.commentText}</div>
            <blockquote class="comment-thread-quote">"${thread.quote}"</blockquote>
            <div class="comment-thread-actions">
                <button class="comment-jump-btn" type="button">Jump</button>
                <button class="comment-resolve-btn" type="button">${thread.resolved ? 'Reopen' : 'Resolve'}</button>
                <button class="comment-delete-btn" type="button">Delete</button>
            </div>
            <div class="comment-thread-replies">
                ${thread.replies.map(reply => `
                    <div class="comment-thread-reply">
                        <div class="comment-thread-reply-meta">
                            <span class="comment-thread-reply-author">${reply.author}</span>
                            <span class="comment-thread-reply-time">${new Date(reply.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="comment-thread-reply-body">${reply.text}</div>
                    </div>
                `).join('')}
            </div>
            <form class="comment-reply-form" data-comment-id="${thread.id}">
                <textarea class="comment-reply-input" rows="2" placeholder="Write a reply..."></textarea>
                <div class="comment-reply-actions">
                    <button type="submit">Reply</button>
                </div>
            </form>
        `;
        list.appendChild(card);
    });

    if (activeCommentId) {
        highlightCommentThread(editor, activeCommentId);
    }
}

function updateWidget(widget: HTMLElement, unresolvedCount: number) {
    const countEl = widget.querySelector('.comments-widget-count');
    if (countEl) {
        countEl.textContent = String(unresolvedCount);
    }
    widget.classList.toggle('has-comments', unresolvedCount > 0);
}

function focusComment(editor: LexicalEditor, sidebar: HTMLElement, commentId: string) {
    const threads = collectCommentThreads(editor);
    renderCommentThreads(sidebar, editor, threads, commentId, 'all');
    highlightCommentThread(editor, commentId);

    const thread = threads.find(item => item.id === commentId);
    const firstKey = thread?.nodeKeys[0];
    if (!firstKey) return;

    const element = editor.getElementByKey(firstKey);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearCommentHighlights(editor: LexicalEditor) {
    editor.getRootElement()
        ?.querySelectorAll('.comment-node.comment-node-active')
        .forEach(el => el.classList.remove('comment-node-active'));
}

function highlightCommentThread(editor: LexicalEditor, commentId: string) {
    clearCommentHighlights(editor);

    editor.getRootElement()
        ?.querySelectorAll(`.comment-node[data-comment-id="${commentId}"]`)
        .forEach(el => el.classList.add('comment-node-active'));
}
