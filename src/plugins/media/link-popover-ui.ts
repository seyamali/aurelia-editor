import { $getSelection, $isRangeSelection, $isNodeSelection, type LexicalEditor, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW, createCommand, type LexicalCommand } from 'lexical';
import { TOGGLE_LINK_COMMAND, LinkNode } from '@lexical/link';
import { $getNearestNodeOfType } from '@lexical/utils';
import { ImageNode, $isImageNode } from './image-node';

export const SHOW_LINK_POPOVER_COMMAND: LexicalCommand<void> = createCommand('SHOW_LINK_POPOVER_COMMAND');

export function setupLinkPopover(editor: LexicalEditor) {
    const popover = document.getElementById('link-popover')!;
    const urlInput = document.getElementById('link-url-input') as HTMLInputElement;
    const applyBtn = document.getElementById('link-apply-btn')!;
    const openBtn = document.getElementById('link-open-btn')!;
    const removeBtn = document.getElementById('link-remove-btn')!;
    const targetCheckbox = document.getElementById('link-target-checkbox') as HTMLInputElement;

    const updatePopoverPosition = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        const editorContainer = document.getElementById('editor-wrapper')!;
        const containerRect = editorContainer.getBoundingClientRect();
        const popoverRect = popover.getBoundingClientRect();

        let top = rect.bottom - containerRect.top + 10;
        let left = rect.left - containerRect.left + (rect.width / 2) - (popoverRect.width / 2);

        // If rect is 0 (e.g. node selection), fallback to .image-wrapper.selected
        if (rect.width === 0 && rect.height === 0) {
            const activeElement = document.querySelector('.image-wrapper.selected');
            if (activeElement) {
                const imgRect = activeElement.getBoundingClientRect();
                top = imgRect.bottom - containerRect.top + 10;
                left = imgRect.left - containerRect.left + (imgRect.width / 2) - (popoverRect.width / 2);
            }
        }

        if (left < 10) left = 10;
        if (left + popoverRect.width > containerRect.width - 10) {
            left = containerRect.width - popoverRect.width - 10;
        }

        if (top + popoverRect.height > containerRect.height - 10) {
            const selectionTop = (rect.width === 0 && rect.height === 0)
                ? (document.querySelector('.image-wrapper.selected')?.getBoundingClientRect().top || rect.top)
                : rect.top;
            top = selectionTop - containerRect.top - popoverRect.height - 10;
        }

        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    };

    const showPopover = (url: string = '', isNewTab: boolean = false) => {
        urlInput.value = url;
        targetCheckbox.checked = isNewTab;
        popover.classList.remove('hidden');
        requestAnimationFrame(() => {
            updatePopoverPosition();
            urlInput.focus();
        });
    };

    const hidePopover = () => {
        popover.classList.add('hidden');
    };

    editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                let isInLink = false;

                if ($isRangeSelection(selection)) {
                    const node = selection.anchor.getNode();
                    const linkNode = $getNearestNodeOfType(node, LinkNode);
                    if (linkNode) isInLink = true;
                } else if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && $isImageNode(nodes[0]) && (nodes[0] as any).__linkUrl) {
                        isInLink = true;
                    }
                }

                if (!isInLink && !popover.classList.contains('hidden')) {
                    if (document.activeElement !== urlInput && !popover.contains(document.activeElement)) {
                        hidePopover();
                    }
                }
            });
            return false;
        },
        COMMAND_PRIORITY_LOW
    );

    editor.registerRootListener((rootElement) => {
        if (!rootElement) return;
        rootElement.addEventListener('click', () => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const node = selection.anchor.getNode();
                    const linkNode = $getNearestNodeOfType(node, LinkNode);
                    if (linkNode) {
                        showPopover(linkNode.getURL(), linkNode.getTarget() === '_blank');
                    }
                } else if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && $isImageNode(nodes[0])) {
                        const imageNode = nodes[0] as ImageNode;
                        if (imageNode.__linkUrl) {
                            showPopover(imageNode.__linkUrl, true);
                        }
                    }
                }
            });
        });
    });

    applyBtn.addEventListener('click', () => {
        const url = urlInput.value;
        const target = targetCheckbox.checked ? '_blank' : '_self';
        editor.update(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
                const nodes = selection.getNodes();
                if (nodes.length === 1 && $isImageNode(nodes[0])) {
                    (nodes[0] as ImageNode).setLinkUrl(url || '');
                    return;
                }
            }
            if (url) {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, { url, target });
            } else {
                editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            }
        });
        hidePopover();
    });

    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyBtn.click();
        else if (e.key === 'Escape') hidePopover();
    });

    removeBtn.addEventListener('click', () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isNodeSelection(selection)) {
                const nodes = selection.getNodes();
                if (nodes.length === 1 && $isImageNode(nodes[0])) {
                    (nodes[0] as ImageNode).setLinkUrl('');
                    return;
                }
            }
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        });
        hidePopover();
    });

    openBtn.addEventListener('click', () => {
        let url = urlInput.value.trim();
        if (url) {
            if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
            window.open(url, '_blank');
        }
    });

    editor.registerCommand(
        SHOW_LINK_POPOVER_COMMAND,
        () => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && $isImageNode(nodes[0])) {
                        const imageNode = nodes[0] as ImageNode;
                        showPopover(imageNode.__linkUrl || '', true);
                        return;
                    }
                }
                if ($isRangeSelection(selection)) {
                    const node = selection.anchor.getNode();
                    const linkNode = $getNearestNodeOfType(node, LinkNode);
                    if (linkNode) {
                        showPopover(linkNode.getURL(), linkNode.getTarget() === '_blank');
                    } else {
                        showPopover('', false);
                    }
                }
            });
            return true;
        },
        COMMAND_PRIORITY_LOW
    );

    document.addEventListener('mousedown', (e) => {
        const target = e.target as HTMLElement;
        const isToolbarBtn = target.closest('.toolbar-btn[data-item-id="insert-link"], .toolbar-btn#link-btn');
        if (!popover.contains(target) && !isToolbarBtn) {
            hidePopover();
        }
    });
}
