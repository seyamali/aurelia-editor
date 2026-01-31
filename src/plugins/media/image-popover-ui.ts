import { $getSelection, $isNodeSelection, $getNodeByKey, $createNodeSelection, $setSelection, type LexicalEditor, SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW, KEY_DELETE_COMMAND, KEY_BACKSPACE_COMMAND } from 'lexical';
import { ImageNode, $isImageNode } from './image-node';

export function setupImagePopover(editor: LexicalEditor) {
    // 1. Create or Update the Popover Element
    let popover = document.getElementById('image-popover');
    const popoverHTML = `
            <div class="popover-row">
                <button id="img-align-left" title="Align Left">⬅️ Left</button>
                <button id="img-align-center" title="Align Center">⬛ Center</button>
                <button id="img-align-right" title="Align Right">➡️ Right</button>
                <button id="img-align-full" title="Full Width">↔️ Full</button>
            </div>
            <div class="popover-divider"></div>
            <div class="popover-row">
                <button id="img-toggle-caption" title="Toggle Caption" style="padding: 4px 8px">📝 Caption</button>
                <div class="input-group" style="display: flex; align-items: center; gap: 4px; font-size: 12px; margin-left: 8px">
                    <span>W:</span>
                    <input type="number" id="img-width-input" placeholder="Width" style="width: 50px; padding: 4px" />
                </div>
                <div class="input-group" style="display: flex; align-items: center; gap: 4px; font-size: 12px; margin-left: 4px">
                    <span>H:</span>
                    <input type="number" id="img-height-input" placeholder="Height" style="width: 50px; padding: 4px" />
                </div>
                <span style="flex-grow: 1"></span>
                <button id="img-link-btn" title="Add Link" style="padding: 4px 8px">🔗 Link</button>
                <button id="img-unlink-btn" title="Remove Link" class="danger hidden" style="padding: 4px 8px">🔗 Unlink</button>
            </div>
            <div class="popover-row">
                <input type="text" id="img-alt-input" placeholder="Alt text..." style="width: 100%; margin-top: 4px" />
            </div>
        `;

    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'image-popover';
        popover.className = 'image-popover hidden';
        popover.innerHTML = popoverHTML;
        document.getElementById('editor-wrapper')?.appendChild(popover);
    } else {
        // Force update HTML to ensure new inputs are there
        popover.innerHTML = popoverHTML;
    }

    const altInput = () => document.getElementById('img-alt-input') as HTMLInputElement;
    const linkBtn = () => document.getElementById('img-link-btn') as HTMLButtonElement;
    const unlinkBtn = () => document.getElementById('img-unlink-btn') as HTMLButtonElement;
    const widthInput = () => document.getElementById('img-width-input') as HTMLInputElement;
    const heightInput = () => document.getElementById('img-height-input') as HTMLInputElement;
    const captionBtn = () => document.getElementById('img-toggle-caption') as HTMLButtonElement;

    const bindPopoverListeners = () => {
        // Alignment Buttons
        ['left', 'center', 'right', 'full'].forEach(align => {
            document.getElementById(`img-align-${align}`)?.addEventListener('click', () => {
                if (!currentImageNodeKey) return;
                editor.update(() => {
                    const node = $getNodeByKey(currentImageNodeKey!);
                    if ($isImageNode(node)) node.setAlignment(align as any);
                });
            });
        });

        // Alt Text
        altInput()?.addEventListener('input', (e) => {
            if (!currentImageNodeKey) return;
            const text = (e.target as HTMLInputElement).value;
            editor.update(() => {
                const node = $getNodeByKey(currentImageNodeKey!);
                if ($isImageNode(node)) node.setAltText(text);
            });
        });

        // Link Button - Opens the Link Popover for this image
        linkBtn()?.addEventListener('click', () => {
            // We just need to trigger the command. The command handler checks for selected image node.
            // Since the image *is* selected when the popover is open, this should work.
            // We might need to ensure the selection is correct? It should be.
            import('./link-popover-ui').then(({ SHOW_LINK_POPOVER_COMMAND }) => {
                editor.dispatchCommand(SHOW_LINK_POPOVER_COMMAND, undefined);
                hidePopover(); // Hide image popover so link popover can be seen/used without clutter
            });
        });

        // Unlink
        unlinkBtn()?.addEventListener('click', () => {
            if (!currentImageNodeKey) return;
            editor.update(() => {
                const node = $getNodeByKey(currentImageNodeKey!);
                if ($isImageNode(node)) node.setLinkUrl('');
            });
            // Re-show logic to update buttons
            const node = $getNodeByKey(currentImageNodeKey!) as ImageNode | null;
            if (node) {
                linkBtn()?.classList.remove('hidden');
                unlinkBtn()?.classList.add('hidden');
            }
        });

        // Caption Toggle
        captionBtn()?.addEventListener('click', () => {
            if (!currentImageNodeKey) return;
            editor.update(() => {
                const node = $getNodeByKey(currentImageNodeKey!);
                if ($isImageNode(node)) {
                    const show = !node.__showCaption;
                    node.setShowCaption(show);
                    captionBtn()?.classList.toggle('active', show);
                }
            });
        });

        // Width/Height
        const onDimChange = () => {
            if (!currentImageNodeKey) return;
            const w = parseInt(widthInput()?.value || '0');
            const h = parseInt(heightInput()?.value || '0');
            if (isNaN(w) || isNaN(h)) return;
            editor.update(() => {
                const node = $getNodeByKey(currentImageNodeKey!);
                if ($isImageNode(node)) node.setWidthAndHeight(w, h);
            });
        };
        widthInput()?.addEventListener('change', onDimChange);
        heightInput()?.addEventListener('change', onDimChange);
    };

    if (!popover) {
        popover = document.createElement('div');
        popover.id = 'image-popover';
        popover.className = 'image-popover hidden';
        popover.innerHTML = popoverHTML;
        document.getElementById('editor-wrapper')?.appendChild(popover);
    } else {
        popover.innerHTML = popoverHTML;
    }

    // Bind listeners after ensuring HTML is set
    bindPopoverListeners();

    // Helper to position the popover
    const updatePopoverPosition = (target: HTMLElement) => {
        const wrapper = document.getElementById('editor-wrapper');
        if (!wrapper) return;
        const wrapperRect = wrapper.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const popoverRect = popover!.getBoundingClientRect();

        // Default to showing BELOW the image
        let top = targetRect.bottom - wrapperRect.top + 10;
        let left = targetRect.left - wrapperRect.left + (targetRect.width / 2) - (popoverRect.width / 2);

        // Boundary checks
        if (left < 10) left = 10;
        if (left + popoverRect.width > wrapperRect.width - 10) {
            left = wrapperRect.width - popoverRect.width - 10;
        }

        // If not enough space below, show ABOVE
        if (top + popoverRect.height > wrapperRect.height - 10) {
            top = targetRect.top - wrapperRect.top - popoverRect.height - 10;
        }

        popover!.style.top = `${top}px`;
        popover!.style.left = `${left}px`;
    };

    let currentImageNodeKey: string | null = null;

    const showPopover = (target: HTMLElement, node: ImageNode) => {
        currentImageNodeKey = node.getKey();
        const alt = altInput();
        if (alt) alt.value = node.__altText;

        // Show unlink vs link button
        const unlink = unlinkBtn();
        const link = linkBtn();
        if (unlink && link) {
            if (node.__linkUrl) {
                unlink.classList.remove('hidden');
                link.classList.add('hidden');
            } else {
                unlink.classList.add('hidden');
                link.classList.remove('hidden');
            }
        }

        popover!.classList.remove('hidden');
        requestAnimationFrame(() => updatePopoverPosition(target));

        // Highlighting active alignment and caption
        ['left', 'center', 'right', 'full'].forEach(align => {
            document.getElementById(`img-align-${align}`)?.classList.toggle('active', node.__alignment === align);
        });

        const wIn = widthInput();
        const hIn = heightInput();

        if (wIn && hIn) {
            // If inherit, we might want to show the current computed size or just 0
            const img = target.querySelector('img');
            wIn.value = (node.__width === 'inherit' && img) ? img.offsetWidth.toString() : node.__width.toString();
            hIn.value = (node.__height === 'inherit' && img) ? img.offsetHeight.toString() : node.__height.toString();
        }

        captionBtn()?.classList.toggle('active', node.__showCaption);
    };

    const hidePopover = () => {
        currentImageNodeKey = null;
        popover?.classList.add('hidden');
    };

    // 2. Handle Interactions via Delegation (Single Click Selects, Double Click Shows Popover)
    editor.registerRootListener((rootElement, _prevRootElement) => {
        if (!rootElement) return;

        // Click -> Selection & Custom Double Click Logic
        let lastClickTime = 0;
        let lastClickTarget: HTMLElement | null = null;

        rootElement.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const wrapper = target.closest('.image-wrapper') as HTMLElement;

            // If clicked outside, hide popover (unless clicking IN the popover)
            if (!wrapper && !popover?.contains(target)) {
                hidePopover();
                // If clicking the editor root directly, ensure it's focused so user can type
                if (target === rootElement) {
                    rootElement.focus();
                }
            }

            if (wrapper) {
                const nodeKey = wrapper.getAttribute('data-node-key');

                if (nodeKey) {
                    editor.update(() => {
                        const nodeSelection = $createNodeSelection();
                        nodeSelection.add(nodeKey);
                        $setSelection(nodeSelection);
                    });

                    // Proactive show: If it's already selected, show popover on click
                    editor.getEditorState().read(() => {
                        const node = $getNodeByKey(nodeKey);
                        if (node && $isImageNode(node)) {
                            showPopover(wrapper, node);
                        }
                    });
                }

                // Double Click Detection (preserved for compatibility, but single click now works too)
                const currentTime = new Date().getTime();
                const isSameTarget = lastClickTarget === wrapper;
                const isQuickEnough = (currentTime - lastClickTime) < 300;

                if (isSameTarget && isQuickEnough) {
                    lastClickTime = 0;
                    lastClickTarget = null;
                } else {
                    lastClickTime = currentTime;
                    lastClickTarget = wrapper;
                }
            } else {
                lastClickTime = 0;
                lastClickTarget = null;
            }
        });

        // 4. Handle Paste Logic for selected ImageNode
        rootElement.addEventListener('paste', (e: ClipboardEvent) => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();
                if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && $isImageNode(nodes[0])) {
                        const pastedText = e.clipboardData?.getData('text');
                        if (pastedText && /^(https?:\/\/|www\.)/i.test(pastedText.trim())) {
                            e.preventDefault();
                            e.stopPropagation();
                            editor.update(() => {
                                const node = nodes[0] as ImageNode;
                                let url = pastedText.trim();
                                if (url.startsWith('www.')) url = 'http://' + url;
                                node.setLinkUrl(url);
                            });
                        }
                    }
                }
            });
        });
    });

    // 3. Handle Selection Changes (Just to hide popover when deselecting)
    editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
            editor.getEditorState().read(() => {
                const selection = $getSelection();

                // If no selection or selection is not the current image, might need to hide
                if (!currentImageNodeKey) return;

                // Check if current image is still selected
                let isCurrentNodeSelected = false;
                if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && nodes[0].getKey() === currentImageNodeKey) {
                        isCurrentNodeSelected = true;
                    }
                }

                // If selection moved away from the image, hide the popover
                if (!isCurrentNodeSelected && document.activeElement !== altInput()) {
                    if (!popover?.contains(document.activeElement)) {
                        // Keep open only if focused inside
                    }
                }
            });
            return false;
        },
        COMMAND_PRIORITY_LOW
    );

    // Update visual selection state on DOM wrapper
    editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
            const selection = $getSelection();
            const root = editor.getRootElement();
            if (!root) return;

            // Clear all selected classes from both possible targets
            root.querySelectorAll('.image-wrapper.selected, .image-node-container.selected').forEach(el => {
                el.classList.remove('selected');
                el.removeAttribute('data-selected');
            });

            if ($isNodeSelection(selection)) {
                const nodes = selection.getNodes();
                nodes.forEach(node => {
                    if ($isImageNode(node)) {
                        const el = editor.getElementByKey(node.getKey());
                        if (el) {
                            // Add to the container (span)
                            el.classList.add('selected');
                            el.setAttribute('data-selected', 'true');

                            // Also try to add to the wrapper (div) for best CSS matching
                            const wrapper = el.querySelector('.image-wrapper');
                            if (wrapper) {
                                wrapper.classList.add('selected');
                                wrapper.setAttribute('data-selected', 'true');
                            }
                            console.log('Image node selected visually', node.getKey());
                        }
                    } else {
                        // Clear if not an image node (safeguard)
                        const el = editor.getElementByKey(node.getKey());
                        if (el) {
                            el.classList.remove('selected');
                            el.removeAttribute('data-selected');
                        }
                    }
                });
            }
        });
    });

    // Keyboard deletion support
    const displayDelete = (command: any) => {
        return editor.registerCommand(
            command,
            () => {
                const selection = $getSelection();
                if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && $isImageNode(nodes[0])) {
                        nodes[0].remove();
                        hidePopover();
                        return true;
                    }
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }
    displayDelete(KEY_DELETE_COMMAND);
    displayDelete(KEY_BACKSPACE_COMMAND);
}
