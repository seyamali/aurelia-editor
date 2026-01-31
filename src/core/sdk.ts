import type { LexicalEditor, LexicalCommand, CommandListenerPriority } from 'lexical';
import { I18nManager } from '../plugins/configuration/i18n';
import { AccessibilityManager } from '../plugins/configuration/accessibility';

/**
 * The EditorSDK provides a stable, simplified interface for plugin developers
 * to interact with the AureliaEditor without needing deep knowledge of Lexical internals.
 */
export class EditorSDK {
    private editor: LexicalEditor;

    constructor(editor: LexicalEditor) {
        this.editor = editor;
    }

    /**
     * Get the underlying Lexical editor instance.
     */
    getLexicalEditor(): LexicalEditor {
        return this.editor;
    }

    /**
     * Dispatch a command to the editor.
     */
    dispatchCommand<T>(command: LexicalCommand<T>, payload: T): void {
        this.editor.dispatchCommand(command, payload);
    }

    /**
     * Register a command with the editor.
     */
    registerCommand<P>(
        command: LexicalCommand<P>,
        handler: (payload: P) => boolean,
        priority: CommandListenerPriority
    ): () => void {
        return this.editor.registerCommand(command, handler, priority);
    }

    /**
     * Register an update listener.
     */
    registerUpdateListener(listener: any): () => void {
        return this.editor.registerUpdateListener(listener);
    }

    /**
     * Run an update on the editor state.
     */
    update(updateFn: () => void): void {
        this.editor.update(updateFn);
    }

    /**
     * Get the editor root element.
     */
    getRootElement(): HTMLElement | null {
        return this.editor.getRootElement();
    }

    /**
     * Check if nodes are registered.
     */
    hasNodes(nodes: Array<any>): boolean {
        return this.editor.hasNodes(nodes);
    }

    /**
     * Get a node element by its key.
     */
    getElementByKey(key: string): HTMLElement | null {
        return this.editor.getElementByKey(key);
    }

    /**
     * Announce a message to screen readers (Accessibility).
     */
    announce(message: string): void {
        AccessibilityManager.announce(message);
    }

    /**
     * Register a new button on the toolbar programmatically.
     * @param buttonConfig Configuration for the new button.
     */
    addToolbarButton(config: {
        id: string;
        label: string;
        icon?: string;
        onClick: () => void;
        tooltip?: string;
        i18nKey?: string;
    }): void {
        const toolbar = document.getElementById('toolbar');
        if (!toolbar) return;

        const btn = document.createElement('button');
        btn.id = config.id;
        btn.innerHTML = (config.icon ? `${config.icon} ` : '') + config.label;
        if (config.tooltip) btn.title = config.tooltip;
        if (config.i18nKey) {
            btn.setAttribute('data-i18n', config.i18nKey);
            if (config.icon) btn.setAttribute('data-i18n-icon', config.icon);
        }

        btn.addEventListener('click', config.onClick);

        // Append before the track changes button or settings button if they exist
        const trackBtn = document.getElementById('track-changes-btn');
        if (trackBtn) {
            toolbar.insertBefore(btn, trackBtn);
        } else {
            toolbar.appendChild(btn);
        }

        // Apply translations if any
        I18nManager.applyLanguage(I18nManager.getLanguage());
    }
}
