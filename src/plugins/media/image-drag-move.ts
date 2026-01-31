import { $getNodeByKey, $getRoot, $getNearestNodeFromDOMNode, type LexicalEditor } from 'lexical';
import { $isImageNode } from './image-node';

export function setupImageDragToMove(editor: LexicalEditor) {
    let draggedNodeKey: string | null = null;
    let placeholder: HTMLElement | null = null;

    // Use registerRootListener to handle all events via delegation
    return editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
            // No specific cleanup needed for DOM events as they are attached to the element being removed
        }

        if (!rootElement) return;

        // 1. Handle Drag Start (Delegation)
        rootElement.addEventListener('dragstart', (e: DragEvent) => {
            const target = e.target as HTMLElement;
            // Check if we are dragging an image wrapper
            const wrapper = target.closest('.image-wrapper') as HTMLElement;

            if (!wrapper || wrapper.getAttribute('draggable') !== 'true') return;

            const nodeKey = wrapper.getAttribute('data-node-key');
            if (!nodeKey) return;

            draggedNodeKey = nodeKey;

            // Set drag image data
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', nodeKey);
                // Optional: set a custom drag image if needed, but browser default is usually fine
            }

            // Add dragging class for visual feedback
            // We use setTimeout to ensure the browser captures the element appearance BEFORE we dim it
            setTimeout(() => {
                wrapper.classList.add('dragging');
            }, 0);

            // Create placeholder
            placeholder = document.createElement('div');
            placeholder.className = 'image-drop-placeholder';
            placeholder.innerHTML = '📍 Drop image here';
            placeholder.style.cssText = `
                border: 2px dashed #667eea;
                background: #eef2ff;
                padding: 40px;
                text-align: center;
                border-radius: 12px;
                margin: 16px 0;
                color: #667eea;
                font-weight: 500;
            `;
        });

        // 2. Handle Drag End (Delegation)
        rootElement.addEventListener('dragend', (e: DragEvent) => {
            const target = e.target as HTMLElement;
            const wrapper = target.closest('.image-wrapper') as HTMLElement;

            if (wrapper) {
                wrapper.classList.remove('dragging');
            }

            draggedNodeKey = null;

            // Remove placeholder
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            placeholder = null;
        });

        // 3. Handle Drag Over (Placement)
        rootElement.addEventListener('dragover', (e: DragEvent) => {
            if (!draggedNodeKey) return;

            e.preventDefault(); // Necessary to allow dropping
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
            }

            // Show placeholder near drop location
            const target = e.target as HTMLElement;

            // Try to find a valid drop target (paragraph or another image)
            const paragraph = target.closest('p');
            const wrapper = target.closest('.image-wrapper');

            let anchorElement: HTMLElement | null = null;
            if (paragraph) {
                anchorElement = paragraph as HTMLElement;
            } else if (wrapper) {
                anchorElement = wrapper as HTMLElement;
            }

            if (anchorElement && placeholder && !anchorElement.contains(placeholder)) {
                // Ignore if we are hovering over the placeholder itself
                if (target === placeholder || placeholder.contains(target)) return;

                // Avoid blinking: don't move if we are already in the right spot
                // But simplified: just calculate where it should be
                const rect = anchorElement.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;

                // If dragging over the dragged image itself, hide placeholder or be careful
                // But dragging class makes it pointer-events:none usually, or distinct opacity

                if (e.clientY < midpoint) {
                    if (placeholder.nextElementSibling !== anchorElement) {
                        anchorElement.parentNode?.insertBefore(placeholder, anchorElement);
                    }
                } else {
                    if (placeholder.previousElementSibling !== anchorElement) {
                        anchorElement.parentNode?.insertBefore(placeholder, anchorElement.nextSibling);
                    }
                }
            }
        });

        // 4. Handle Drop (Commit)
        rootElement.addEventListener('drop', (e: DragEvent) => {
            if (!draggedNodeKey) return;

            e.preventDefault();
            e.stopPropagation();

            // cleanup UI
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            // Remove dragging class from all wrappers (just to be safe)
            const wrappers = rootElement.querySelectorAll('.image-wrapper.dragging');
            wrappers.forEach(w => w.classList.remove('dragging'));

            // Find drop target logic
            const target = e.target as HTMLElement;

            editor.update(() => {
                const draggedNode = $getNodeByKey(draggedNodeKey!);
                if (!draggedNode || !$isImageNode(draggedNode)) return;

                draggedNode.remove();

                // Advanced drop logic using Lexical's DOM utilities
                // We basically want to drop where the placeholder WAS, or closest valid node

                // Because we removed the placeholder, we recalculate based on mouse position
                let targetNode = null;
                let insertBefore = false;

                const targetParagraph = target.closest('p');
                const targetWrapper = target.closest('.image-wrapper');

                if (targetParagraph) {
                    const node = $getNearestNodeFromDOMNode(targetParagraph);
                    if (node) {
                        targetNode = node;
                        const rect = targetParagraph.getBoundingClientRect();
                        insertBefore = e.clientY < (rect.top + rect.height / 2);
                    }
                } else if (targetWrapper) {
                    const nodeKey = targetWrapper.getAttribute('data-node-key');
                    if (nodeKey) {
                        const node = $getNodeByKey(nodeKey);
                        if (node && $isImageNode(node)) {
                            targetNode = node;
                            const rect = targetWrapper.getBoundingClientRect();
                            insertBefore = e.clientY < (rect.top + rect.height / 2);
                        }
                    }
                }

                if (targetNode) {
                    if (insertBefore) {
                        targetNode.insertBefore(draggedNode);
                    } else {
                        targetNode.insertAfter(draggedNode);
                    }
                } else {
                    $getRoot().append(draggedNode);
                }
            });

            draggedNodeKey = null;
            placeholder = null;
        });

        // 5. Prevent dropping ONTO images (nested)
        // This is handled by the drop handler above, but we can ensure no default browser behavior
    });
}
