import { $getSelection, $isRangeSelection } from 'lexical';
import { AureliaEditor } from '../core/engine';

type PresenceState = {
    id: string;
    name: string;
    color: string;
    activeAt: number;
    anchorKey?: string;
    anchorOffset?: number;
    focusKey?: string;
    focusOffset?: number;
    collapsed: boolean;
};

const CHANNEL_NAME = 'aurelia-editor-presence';
const STATE_KEY = 'aurelia-editor-presence-self';
const STALE_AFTER_MS = 6000;
const HEARTBEAT_MS = 2000;

let editorRef: AureliaEditor | null = null;
let ownState: PresenceState | null = null;
let remoteStates = new Map<string, PresenceState>();
let presenceCountEl: HTMLElement | null = null;
let presenceButton: HTMLElement | null = null;
let presenceLayer: HTMLElement | null = null;
let presencePanel: HTMLElement | null = null;
let channel: BroadcastChannel | null = null;
let heartbeatTimer: number | null = null;
let listenersAttached = false;
let initialized = false;

export function setupPresenceUI(editor: AureliaEditor): void {
    editorRef = editor;
    ensurePresenceUI();

    if (!initialized) {
        initialized = true;
        ownState = createSelfState();
        channel = new BroadcastChannel(CHANNEL_NAME);
        channel.addEventListener('message', handleMessage);

        window.addEventListener('beforeunload', cleanupPresence);
        window.addEventListener('scroll', () => requestAnimationFrame(renderPresenceLayer), true);
        window.addEventListener('resize', () => requestAnimationFrame(renderPresenceLayer));
        heartbeatTimer = window.setInterval(() => {
            publishPresence();
            pruneRemoteStates();
        }, HEARTBEAT_MS);
    }

    if (!listenersAttached) {
        listenersAttached = true;
        const internal = editor.getInternalEditor();

        internal.registerUpdateListener(({ editorState }: any) => {
            editorState.read(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    ownState = {
                        ...(ownState || createSelfState()),
                        activeAt: Date.now(),
                        anchorKey: selection.anchor.key,
                        anchorOffset: selection.anchor.offset,
                        focusKey: selection.focus.key,
                        focusOffset: selection.focus.offset,
                        collapsed: selection.isCollapsed()
                    };
                }
                publishPresence();
            });
        });
    }

    publishPresence();
    pruneRemoteStates();
    renderPresenceLayer();
    renderPresencePanel();
}

export function togglePresencePanel(): void {
    ensurePresenceUI();
    if (!presencePanel) return;

    const isOpen = !presencePanel.classList.contains('hidden');
    if (isOpen) {
        presencePanel.classList.add('hidden');
    } else {
        renderPresencePanel();
        presencePanel.classList.remove('hidden');
    }
}

function ensurePresenceUI(): void {
    if (presenceLayer) return;

    presenceLayer = document.createElement('div');
    presenceLayer.id = 'presence-layer';
    presenceLayer.className = 'presence-layer';
    document.body.appendChild(presenceLayer);

    presencePanel = document.createElement('div');
    presencePanel.id = 'presence-panel';
    presencePanel.className = 'presence-panel hidden';
    presencePanel.innerHTML = `
        <div class="presence-panel-header">
            <div>
                <div class="presence-panel-title">Live Presence</div>
                <div class="presence-panel-subtitle">Updates across open tabs in this browser</div>
            </div>
            <button type="button" class="presence-panel-close" aria-label="Close presence panel">&times;</button>
        </div>
        <div id="presence-panel-list" class="presence-panel-list"></div>
    `;
    document.body.appendChild(presencePanel);

    presenceButton = document.getElementById('presence-btn');
    presenceCountEl = document.getElementById('presence-count');

    presenceButton?.addEventListener('click', togglePresencePanel);
    presencePanel.querySelector('.presence-panel-close')?.addEventListener('click', togglePresencePanel);
}

function createSelfState(): PresenceState {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved) as PresenceState;
            if (parsed.id && parsed.name && parsed.color) {
                return {
                    ...parsed,
                    activeAt: Date.now(),
                    collapsed: true
                };
            }
        } catch {
            // Fall through to a new identity.
        }
    }

    const state: PresenceState = {
        id: `self-${Math.random().toString(36).slice(2, 10)}`,
        name: `Guest ${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
        color: pickColor(),
        activeAt: Date.now(),
        collapsed: true
    };

    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    return state;
}

function publishPresence(): void {
    if (!channel || !ownState) return;

    const editor = editorRef?.getInternalEditor();
    if (!editor) return;

    const payload = { ...ownState, activeAt: Date.now() };

    editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            payload.anchorKey = selection.anchor.key;
            payload.anchorOffset = selection.anchor.offset;
            payload.focusKey = selection.focus.key;
            payload.focusOffset = selection.focus.offset;
            payload.collapsed = selection.isCollapsed();
        }
    });

    ownState = payload;
    channel.postMessage({ type: 'presence', state: payload });
    renderPresenceCount();
}

function handleMessage(event: MessageEvent): void {
    const data = event.data as { type?: string; state?: PresenceState };
    if (data?.type !== 'presence' || !data.state || data.state.id === ownState?.id) return;

    remoteStates.set(data.state.id, data.state);
    pruneRemoteStates();
    renderPresenceLayer();
    renderPresencePanel();
}

function renderPresenceCount(): void {
    if (!presenceCountEl || !ownState) return;

    const count = 1 + remoteStates.size;
    presenceCountEl.textContent = `${count} online`;
    const button = presenceButton;
    if (button) {
        button.classList.toggle('has-others', remoteStates.size > 0);
    }
}

function renderPresencePanel(): void {
    const list = document.getElementById('presence-panel-list');
    if (!list) return;

    const people = [ownState, ...Array.from(remoteStates.values())].filter(Boolean) as PresenceState[];
    list.innerHTML = people.map(person => `
        <div class="presence-person">
            <span class="presence-person-dot" style="background:${person.color}"></span>
            <div class="presence-person-meta">
                <div class="presence-person-name">${person.id === ownState?.id ? `${person.name} (You)` : person.name}</div>
                <div class="presence-person-status">${person.collapsed ? 'Cursor only' : 'Selecting text'}</div>
            </div>
        </div>
    `).join('');
    renderPresenceCount();
}

function renderPresenceLayer(): void {
    const layer = presenceLayer;
    if (!layer || !editorRef) return;

    const editor = editorRef.getInternalEditor();
    layer.innerHTML = '';

    const visibleStates = Array.from(remoteStates.values()).filter(state => Date.now() - state.activeAt <= STALE_AFTER_MS);
    visibleStates.forEach(state => {
        const anchorEl = state.anchorKey ? editor.getElementByKey(state.anchorKey) : null;
        if (!anchorEl) return;

        const rect = anchorEl.getBoundingClientRect();
        const marker = document.createElement('div');
        marker.className = 'presence-cursor';
        marker.style.borderColor = state.color;
        marker.style.left = `${Math.max(0, rect.left)}px`;
        marker.style.top = `${Math.max(0, rect.top)}px`;
        marker.innerHTML = `
            <span class="presence-cursor-line" style="background:${state.color}"></span>
            <span class="presence-cursor-label" style="background:${state.color}">${state.name}</span>
        `;
        layer.appendChild(marker);
    });
}

function pruneRemoteStates(): void {
    const now = Date.now();
    let changed = false;

    for (const [id, state] of remoteStates.entries()) {
        if (now - state.activeAt > STALE_AFTER_MS) {
            remoteStates.delete(id);
            changed = true;
        }
    }

    if (changed) {
        renderPresenceLayer();
        renderPresencePanel();
    }
}

function cleanupPresence(): void {
    if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer);
    }

    channel?.close();
}

function pickColor(): string {
    const palette = ['#2563eb', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#14b8a6'];
    return palette[Math.floor(Math.random() * palette.length)];
}
