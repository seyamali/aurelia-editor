
import { type LexicalEditor, $getNodeByKey } from 'lexical';
import { $isImageNode } from './image-node';
import { $isYouTubeNode } from '../advanced/youtube-node';

/**
 * Universal Resizer for Images and YouTube Embeds.
 * Handles dragging resizer handles to update node dimensions.
 */
export function setupImageResizer(editor: LexicalEditor) {
    if ((editor as any)._resizerSetup) return;
    (editor as any)._resizerSetup = true;

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let aspectRatio = 1;
    let activeNodeKey: string | null = null;
    let activeDirection: string | null = null;

    const onMouseDown = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const handle = target.closest('.resizer-handle');

        if (handle) {
            console.log('Resizer mousedown detected on handle', handle);
            e.preventDefault();
            e.stopPropagation();

            const wrapper = handle.closest('.image-wrapper, .media-wrapper, .youtube-wrapper, [data-node-key]') as HTMLElement;
            if (!wrapper) {
                console.warn('Resizer: No wrapper found for handle');
                return;
            }

            const mediaEl = wrapper.querySelector('img, iframe') as HTMLElement;
            if (!mediaEl) {
                console.warn('Resizer: No img or iframe found inside wrapper');
                return;
            }

            const nodeKey = wrapper.getAttribute('data-node-key');
            if (!nodeKey) {
                console.warn('Resizer: No data-node-key found on wrapper');
                return;
            }

            activeNodeKey = nodeKey;
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;

            startWidth = mediaEl.offsetWidth;
            startHeight = mediaEl.offsetHeight;
            aspectRatio = startWidth / startHeight || 1;

            const classes = Array.from(handle.classList);
            const dirClass = classes.find(c => c.startsWith('handle-'));
            activeDirection = dirClass ? dirClass.replace('handle-', '') : 'se';

            console.log('Resizing started', { activeNodeKey, startWidth, startHeight });

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            wrapper.classList.add('resizing');
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!isResizing || !activeNodeKey) return;

        const diffX = e.clientX - startX;
        const diffY = e.clientY - startY;

        const multX = activeDirection?.includes('w') ? -1 : 1;
        const multY = activeDirection?.includes('n') ? -1 : 1;

        const changeX = diffX * multX;
        const changeY = diffY * multY;

        let nextWidth, nextHeight;

        // Pick dominant change for aspect ratio lock
        if (Math.abs(changeX) > Math.abs(changeY * aspectRatio)) {
            nextWidth = Math.max(50, startWidth + changeX);
            nextHeight = nextWidth / aspectRatio;
        } else {
            nextHeight = Math.max(50 / aspectRatio, startHeight + changeY);
            nextWidth = nextHeight * aspectRatio;
        }

        const wrapper = document.querySelector(`[data-node-key="${activeNodeKey}"]`) as HTMLElement;
        const mediaEl = wrapper?.querySelector('img, iframe') as HTMLElement;

        if (mediaEl) {
            const roundedWidth = Math.round(nextWidth);
            const roundedHeight = Math.round(nextHeight);
            mediaEl.style.width = `${roundedWidth}px`;
            mediaEl.style.height = `${roundedHeight}px`;

            // Sync popover inputs if they exist (for images)
            const wInput = document.getElementById('img-width-input') as HTMLInputElement;
            const hInput = document.getElementById('img-height-input') as HTMLInputElement;
            if (wInput) wInput.value = roundedWidth.toString();
            if (hInput) hInput.value = roundedHeight.toString();
        }
    };

    const onMouseUp = () => {
        if (!isResizing || !activeNodeKey) return;

        const key = activeNodeKey;
        const wrapper = document.querySelector(`[data-node-key="${key}"]`) as HTMLElement;
        const mediaEl = wrapper?.querySelector('img, iframe') as HTMLElement;

        if (mediaEl) {
            const finalWidth = Math.round(mediaEl.offsetWidth);
            const finalHeight = Math.round(mediaEl.offsetHeight);

            editor.update(() => {
                const node = $getNodeByKey(key);
                if ($isImageNode(node)) {
                    node.setWidthAndHeight(finalWidth, finalHeight);
                } else if ($isYouTubeNode(node)) {
                    node.setWidthAndHeight(finalWidth, finalHeight);
                }
            });
        }

        if (wrapper) wrapper.classList.remove('resizing');

        isResizing = false;
        activeNodeKey = null;
        activeDirection = null;

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };

    return editor.registerRootListener((rootElement) => {
        if (rootElement) {
            rootElement.addEventListener('mousedown', onMouseDown);
            return () => rootElement.removeEventListener('mousedown', onMouseDown);
        }
    });
}
