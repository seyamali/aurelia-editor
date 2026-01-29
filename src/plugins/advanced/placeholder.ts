// Merge Field / Placeholder Insert UI Plugin
// Provides a searchable dropdown for inserting placeholders

import { type LexicalEditor } from 'lexical';

const MERGE_FIELDS = [
    { name: 'FirstName', label: 'First Name', type: 'User', description: "The user's first name", sample: 'John' },
    { name: 'LastName', label: 'Last Name', type: 'User', description: "The user's last name", sample: 'Doe' },
    { name: 'Company', label: 'Company', type: 'Organization', description: 'The company name', sample: 'Acme Inc.' },
    { name: 'Date', label: 'Date', type: 'System', description: 'Current date', sample: '2026-01-22' },
    // Add more fields as needed
];

// Valid merge field names (for sanitization)
const VALID_MERGE_FIELD_NAMES = new Set(MERGE_FIELDS.map(f => f.name));

let recentFields: string[] = [];

/**
 * Sanitizes a placeholder name to ensure it's safe and valid.
 * Only allows alphanumeric characters and underscores.
 * Prevents script injection and unsafe content.
 */
export function sanitizePlaceholderName(name: string): string | null {
    if (!name || typeof name !== 'string') {
        return null;
    }

    // Remove any potentially dangerous characters
    // Only allow alphanumeric and underscore
    const sanitized = name.replace(/[^a-zA-Z0-9_]/g, '');

    if (!sanitized || sanitized.length === 0) {
        return null;
    }

    // Optional: Only allow predefined merge fields for security
    // Uncomment the following lines to enforce strict validation:
    // if (!VALID_MERGE_FIELD_NAMES.has(sanitized)) {
    //     return null;
    // }

    return sanitized;
}

/**
 * Checks if a placeholder name is valid (exists in predefined list).
 */
export function isValidPlaceholderName(name: string): boolean {
    return VALID_MERGE_FIELD_NAMES.has(name);
}

export function showPlaceholderInsertPanel(editor: LexicalEditor) {
    let panel = document.getElementById('placeholder-insert-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'placeholder-insert-panel';
        panel.className = 'placeholder-insert-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Insert Merge Field');
        panel.innerHTML = `
            <input type="text" id="placeholder-search" placeholder="Search fields..." class="placeholder-search" aria-label="Search merge fields" />
            <div id="placeholder-groups" class="placeholder-groups"></div>
            <div id="placeholder-error" class="placeholder-error" style="display:none;"></div>
            <button id="close-placeholder-panel" class="close-placeholder-panel" aria-label="Close">Close</button>
        `;
        document.body.appendChild(panel);
    }
    panel.style.display = 'block';
    panel.style.opacity = '0';
    setTimeout(() => { panel.style.opacity = '1'; }, 10); // Animate open
    positionPanel(panel);

    const searchInput = panel.querySelector('#placeholder-search') as HTMLInputElement;
    const groups = panel.querySelector('#placeholder-groups') as HTMLDivElement;
    const errorDiv = panel.querySelector('#placeholder-error') as HTMLDivElement;
    const closeBtn = panel.querySelector('#close-placeholder-panel') as HTMLButtonElement;

    function renderGroups(filter = '') {
        groups.innerHTML = '';
        errorDiv.style.display = 'none';
        let filtered = MERGE_FIELDS.filter(f =>
            f.label.toLowerCase().includes(filter.toLowerCase()) ||
            f.name.toLowerCase().includes(filter.toLowerCase())
        );
        // Recent fields
        if (!filter && recentFields.length) {
            const recentHeader = document.createElement('div');
            recentHeader.className = 'placeholder-group-header';
            recentHeader.innerText = 'Recent';
            groups.appendChild(recentHeader);
            const recentList = document.createElement('ul');
            recentList.className = 'placeholder-list';
            recentFields.forEach(name => {
                const field = MERGE_FIELDS.find(f => f.name === name);
                if (field) recentList.appendChild(createListItem(field));
            });
            groups.appendChild(recentList);
        }
        // Group by type
        const types = Array.from(new Set(filtered.map(f => f.type)));
        let anyAdded = false;
        types.forEach(type => {
            const header = document.createElement('div');
            header.className = 'placeholder-group-header';
            header.innerText = type;
            groups.appendChild(header);
            const ul = document.createElement('ul');
            ul.className = 'placeholder-list';
            filtered.filter(f => f.type === type).forEach(field => {
                ul.appendChild(createListItem(field));
                anyAdded = true;
            });
            groups.appendChild(ul);
        });
        if (filter.length > 0) {
            // Check if exact match exists
            const exactMatch = MERGE_FIELDS.find(f => f.name.toLowerCase() === filter.toLowerCase());
            if (!exactMatch) {
                const customHeader = document.createElement('div');
                customHeader.className = 'placeholder-group-header';
                customHeader.innerText = 'Custom';
                groups.appendChild(customHeader);

                const customUl = document.createElement('ul');
                customUl.className = 'placeholder-list';

                const customField = {
                    name: filter,
                    label: filter,
                    type: 'Custom',
                    description: 'Custom merge field',
                    sample: 'Value'
                };

                const li = createListItem(customField);
                li.innerHTML = `
                        <span class="placeholder-label">Create "{{${filter}}}"</span>
                        <span class="placeholder-meta">New</span>
                   `;
                customUl.appendChild(li);
                groups.appendChild(customUl);
                anyAdded = true;
            }
        }

        if (!anyAdded && !recentFields.length && filter.length === 0) {
            errorDiv.innerText = 'No fields found.';
            errorDiv.style.display = 'block';
        }
    }

    function createListItem(field: any) {
        const li = document.createElement('li');
        li.className = 'placeholder-list-item';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-label', field.label);
        li.innerHTML = `
            <span class="placeholder-label">{{${field.name}}}</span>
            <span class="placeholder-meta" title="${field.description}">${field.type}</span>
            <span class="placeholder-sample" title="Sample value">${field.sample}</span>
            <span class="placeholder-tooltip">${field.description}</span>
        `;
        li.title = `Insert ${field.label}`;
        li.tabIndex = 0;
        li.onmouseenter = () => li.classList.add('focused');
        li.onmouseleave = () => li.classList.remove('focused');
        li.onclick = () => {
            // Sanitize the field name before inserting
            const sanitized = sanitizePlaceholderName(field.name);
            if (!sanitized) {
                errorDiv.innerText = 'Invalid placeholder name. Only alphanumeric characters and underscores are allowed.';
                errorDiv.style.display = 'block';
                return;
            }

            editor.update(() => {
                const node = $createPlaceholderNode(sanitized);
                $insertNodes([node]);
            });
            if (!recentFields.includes(sanitized)) {
                recentFields.unshift(sanitized);
                if (recentFields.length > 5) recentFields.pop();
            }
            if (panel) panel.style.opacity = '0';
            setTimeout(() => {
                const p = document.getElementById('placeholder-insert-panel');
                if (p) p.style.display = 'none';
            }, 200);
        };
        return li;
    }

    renderGroups();

    searchInput.oninput = () => {
        renderGroups(searchInput.value);
    };

    closeBtn.onclick = () => {
        if (panel) panel.style.opacity = '0';
        setTimeout(() => { if (panel) panel.style.display = 'none'; }, 200);
    };

    // Keyboard navigation
    searchInput.onkeydown = (e) => {
        const items = Array.from(groups.querySelectorAll('.placeholder-list-item'));
        if (e.key === 'ArrowDown' && items.length) {
            const first = items[0];
            if (first && first instanceof HTMLElement) first.focus();
            e.preventDefault();
        }
    };
    groups.onkeydown = (e) => {
        const items = Array.from(groups.querySelectorAll('.placeholder-list-item'));
        const idx = items.indexOf(document.activeElement as HTMLElement);
        if (e.key === 'ArrowDown' && idx < items.length - 1) {
            const next = items[idx + 1];
            if (next && next instanceof HTMLElement) next.focus();
            e.preventDefault();
        } else if (e.key === 'ArrowUp' && idx > 0) {
            const prev = items[idx - 1];
            if (prev && prev instanceof HTMLElement) prev.focus();
            e.preventDefault();
        } else if (e.key === 'Enter' && idx >= 0) {
            const item = items[idx];
            if (item && item instanceof HTMLElement) item.click();
            e.preventDefault();
        } else if (e.key === 'Escape') {
            if (panel) panel.style.opacity = '0';
            setTimeout(() => { if (panel) panel.style.display = 'none'; }, 200);
            searchInput.focus();
        }
    };
}

function positionPanel(panel: HTMLElement) {
    // Position near selection or center
    panel.style.position = 'fixed';
    panel.style.top = '20%';
    panel.style.left = '50%';
    panel.style.transform = 'translate(-50%, 0)';
    panel.style.zIndex = '3000';
    panel.style.background = '#fff';
    panel.style.borderRadius = '12px';
    panel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
    panel.style.padding = '18px 22px';
    panel.style.minWidth = '340px';
    panel.style.maxWidth = '420px';
    panel.style.border = '1px solid #e5e7eb';
    panel.style.transition = 'opacity 0.2s';
}
import {
    $insertNodes,
    COMMAND_PRIORITY_EDITOR,
    createCommand,
    type LexicalCommand,
} from 'lexical';
import { $createPlaceholderNode, PlaceholderNode } from './placeholder-node';
import { EditorSDK } from '../../core/sdk';

export const INSERT_PLACEHOLDER_COMMAND: LexicalCommand<string> = createCommand(
    'INSERT_PLACEHOLDER_COMMAND',
);

export const PlaceholderPlugin = {
    name: 'placeholder',
    init: (sdk: EditorSDK) => {
        if (!sdk.hasNodes([PlaceholderNode])) {
            throw new Error('PlaceholderPlugin: PlaceholderNode not registered on editor');
        }

        sdk.registerCommand(
            INSERT_PLACEHOLDER_COMMAND,
            (name: string) => {
                // Sanitize the placeholder name before inserting
                const sanitized = sanitizePlaceholderName(name);
                if (!sanitized) {
                    console.warn(`Invalid placeholder name: ${name}. Only alphanumeric characters and underscores are allowed.`);
                    return false;
                }

                sdk.update(() => {
                    const node = $createPlaceholderNode(sanitized);
                    $insertNodes([node]);
                });
                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    },
};
