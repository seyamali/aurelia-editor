import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';

export const SourceViewPlugin = {
    // Storage for the page template (head, doctype) to ensure    // State for Source Fidelity
    _fullDocTemplate: null as { head: string; docType: string } | null,
    _originalHtml: null as string | null,
    _isDirty: false,
    _listener: null as (() => void) | null,

    /**
     * Get HTML from Editor with literal fidelity.
     */
    getHtml: (editor: any): string => {
        // Same-to-Same Fidelity check:
        // If the user hasn't touched the editor, return the EXACT source they pasted.
        if (!SourceViewPlugin._isDirty && SourceViewPlugin._originalHtml) {
            return SourceViewPlugin._originalHtml;
        }

        let html = '';
        editor.getInternalEditor().update(() => {
            html = $generateHtmlFromNodes(editor.getInternalEditor());
        });

        // Aggressive Clean - This is the Same-to-Same engine
        html = SourceViewPlugin.cleanHtml(html);

        // 3. Re-wrap in the original document structure if it was a full page
        if (SourceViewPlugin._fullDocTemplate) {
            const { docType, head } = SourceViewPlugin._fullDocTemplate;
            return `${docType}\n<html>\n<head>\n${head}\n</head>\n<body>\n${html}\n</body>\n</html>`;
        }

        return html;
    },

    /**
     * Professional HTML Beautifier
     * Adds line breaks and indentation to a dense HTML string.
     */
    beautifyHTML: (html: string): string => {
        let formatted = '';
        let indent = '';
        const tab = '    '; // 4 spaces

        // Tag families that should NEVER be split across lines internally
        const protectedTags = /^(title|h1|h2|h3|h4|h5|h6|a|span|b|strong|i|em|u|button|label|logo)/i;

        // Split by tags
        const nodes = html.split(/(<[^>!]+>)/g);

        nodes.forEach(node => {
            if (node.match(/^<\/\w/)) { // Closing tag
                const tagName = node.match(/^<\/(\w+)/)?.[1] || '';
                if (!protectedTags.test(tagName)) {
                    indent = indent.substring(tab.length);
                    formatted += '\n' + indent + node;
                } else {
                    formatted += node;
                }
            } else if (node.match(/^<\w[^>]*[^\/]>$/)) { // Opening tag
                const tagName = node.match(/^<(\w+)/)?.[1] || '';
                const isProtected = protectedTags.test(tagName);

                if (!isProtected) {
                    formatted += '\n' + indent + node;
                    if (!/^(br|hr|img|input|meta|link)/i.test(tagName)) {
                        indent += tab;
                    }
                } else {
                    // Start on new line but don't indent children
                    formatted += '\n' + indent + node;
                }
            } else if (node.match(/^<\w[^>]*\/>$/)) { // Self-closing
                formatted += '\n' + indent + node;
            } else { // Text content
                const text = node.trim();
                if (text) {
                    formatted += text;
                }
            }
        });

        return formatted.trim().replace(/\n\s*\n/g, '\n'); // Remove double newlines
    },

    /**
     * Professional CSS Sandboxer
     * Prefixes all selectors with .editor-container to ensure scoped styling and high specificity.
     * Uses a robust balanced-brace parser to correctly handle nested rules (@keyframes, @media).
     */
    proxyCSS: (css: string): string => {
        // Remove comments
        css = css.replace(/\/\*[\s\S]*?\*\//g, '');

        const prefix = '.editor-container[data-source-fidelity="true"]';

        const parseBlocks = (content: string, isNested = false): string => {
            let output = '';
            let cursor = 0;

            while (cursor < content.length) {
                const nextOpen = content.indexOf('{', cursor);
                if (nextOpen === -1) {
                    output += content.substring(cursor);
                    break;
                }

                // Found a block. Extract selectors.
                const selectors = content.substring(cursor, nextOpen);

                // Find matching closing brace
                let nesting = 1;
                let j = nextOpen + 1;
                for (; j < content.length; j++) {
                    if (content[j] === '{') nesting++;
                    else if (content[j] === '}') {
                        nesting--;
                        if (nesting === 0) break;
                    }
                }

                const blockContent = content.substring(nextOpen + 1, j);
                const trimmedSelectors = selectors.trim();

                if (trimmedSelectors.startsWith('@')) {
                    // At-rules
                    if (trimmedSelectors.toLowerCase().startsWith('@media')) {
                        // Recursively proxy media queries
                        output += trimmedSelectors + ' {' + parseBlocks(blockContent, true) + '}';
                    } else {
                        // Keyframes and others: keep as is but preserve internal structure
                        output += trimmedSelectors + ' {' + blockContent + '}';
                    }
                } else if (trimmedSelectors) {
                    // Standard selectors: apply prefix
                    const prefixed = trimmedSelectors.split(',').map(sel => {
                        const s = sel.trim();
                        if (!s) return sel;
                        if (/^(body|html|:root)$/i.test(s)) return prefix;
                        if (s === '*') return `${prefix} *`;
                        if (s.startsWith('.editor-container')) return s;
                        return `${prefix} ${s}`;
                    }).join(', ');
                    output += prefixed + ' {' + (isNested ? parseBlocks(blockContent, true) : blockContent) + '}';
                }

                cursor = j + 1;
            }
            return output;
        };

        return parseBlocks(css);
    },

    /**
     * Replaces the editor content and injects styles into the document head for "Same-to-Same" design.
     */
    setHtml: (editor: any, html: string) => {
        // Cache original source
        SourceViewPlugin._originalHtml = html;
        SourceViewPlugin._isDirty = false;

        // Cleanup old listener if exists
        if (SourceViewPlugin._listener) {
            SourceViewPlugin._listener();
            SourceViewPlugin._listener = null;
        }

        // Register new dirty check listener
        setTimeout(() => {
            SourceViewPlugin._listener = editor.getInternalEditor().registerUpdateListener(({ dirtyElements, dirtyLeaves, tags }: any) => {
                if (tags.has('history-merge') || tags.has('paste') || tags.has('user-interaction')) {
                    SourceViewPlugin._isDirty = true;
                } else if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
                    SourceViewPlugin._isDirty = true;
                }
            });
        }, 200);

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 1. Clean up previous global styles injected by the editor
        document.querySelectorAll('[data-editor-asset="true"]').forEach(el => el.remove());

        // 2. Detect and Inject Assets (Style/Link tags) into the real Document Head
        const assets = doc.querySelectorAll('style, link[rel="stylesheet"], script');
        assets.forEach(asset => {
            let node: HTMLElement;
            if (asset.tagName === 'STYLE') {
                node = document.createElement('style');
                node.innerHTML = SourceViewPlugin.proxyCSS(asset.innerHTML);
            } else if (asset.tagName === 'SCRIPT') {
                node = document.createElement('script');
                if ((asset as HTMLScriptElement).src) {
                    (node as HTMLScriptElement).src = (asset as HTMLScriptElement).src;
                } else {
                    node.innerHTML = asset.innerHTML;
                }
            } else {
                node = asset.cloneNode(true) as HTMLElement;
            }
            node.setAttribute('data-editor-asset', 'true');
            document.head.appendChild(node);
        });

        const hasHtmlTag = html.toLowerCase().includes('<html');
        const editorElement = editor.getInternalEditor().getRootElement();

        if (hasHtmlTag) {
            SourceViewPlugin._fullDocTemplate = {
                docType: html.match(/^<!DOCTYPE [^>]+>/i)?.[0] || '<!DOCTYPE html>',
                head: doc.head.innerHTML
            };

            // Mirror all body classes and inline styles to the editor root
            if (editorElement) {
                const bodyClasses = Array.from(doc.body.classList);
                editorElement.className = `editor-container ${bodyClasses.join(' ')}`;
                editorElement.setAttribute('data-source-fidelity', 'true');
                if (doc.body.getAttribute('style')) {
                    editorElement.setAttribute('style', doc.body.getAttribute('style') || '');
                }
                // CRITICAL FIX: Unlock properties so the proxied CSS can take over.
                editorElement.style.removeProperty('background-color');
                editorElement.style.removeProperty('color');
            }
        } else {
            SourceViewPlugin._fullDocTemplate = null;
            if (editorElement) {
                editorElement.className = 'editor-container';
                editorElement.setAttribute('data-source-fidelity', 'true');
                editorElement.style.backgroundColor = '';
                editorElement.style.color = '';
            }
        }

        editor.getInternalEditor().update(() => {
            // Convert both head (metadata/styles) and body (content) tags to nodes
            // RawHtmlNode and StyleNode will capture the structural pieces.
            const headNodes = $generateNodesFromDOM(editor.getInternalEditor(), doc.head);
            const bodyNodes = $generateNodesFromDOM(editor.getInternalEditor(), doc.body);

            const root = $getRoot();
            root.clear();
            root.append(...headNodes, ...bodyNodes);
        });
    },

    /**
     * Pure HTML post-processor to remove ALL Lexical pollution.
     * This is the "Same-to-Same" guardian.
     */
    cleanHtml: (html: string): string => {
        // 1. Remove ALL internal data attributes injected by Lexical or our custom nodes
        html = html.replace(/\s+data-[a-zA-Z0-9-]+="[^"]*"/g, '');
        html = html.replace(/\s+contenteditable="[^"]*"/g, '');
        html = html.replace(/\s+dir="auto"/g, '');

        // 2. Remove Lexical's "white-space: pre-wrap" spans and styling
        // Use a robust regex to handle variations in quotes and spacing
        html = html.replace(/<span\s+style=["']white-space:\s*pre-wrap;?["']>(.*?)<\/span>/gi, '$1');
        html = html.replace(/\s+style=["']white-space:\s*pre-wrap;?["']/gi, '');

        // 3. Remove Theme Classes and EMPTY classes (Fixes p class="")
        html = html.replace(/\s+class="editor-[^"]+"/g, '');
        html = html.replace(/\s+class=""/g, '');

        // 4. Restore boolean attributes (required="" -> required)
        html = html.replace(/ (required|checked|disabled|readonly|multiple|selected)=""/g, ' $1');

        // 5. Normalization Fix: Remove extra paragraphs that wrap structural elements
        const structureTags = 'div|header|footer|nav|main|section|article|aside|form|ul|ol|li';
        const regOpen = new RegExp(`<p><(${structureTags})`, 'gi');
        const regClose = new RegExp(`</(${structureTags})></p>`, 'gi');
        html = html.replace(regOpen, '<$1');
        html = html.replace(regClose, '</$1>');

        // Extra fix for nested paragraphs after structure tags
        html = html.replace(new RegExp(`(<(?:${structureTags})[^>]*>)<p>`, 'gi'), '$1');
        html = html.replace(new RegExp(`</p>(</(?:${structureTags})>)`, 'gi'), '$1');

        // 6. Final cleanup: Remove empty styles and empty spans
        html = html.replace(/ style=""/g, '');
        html = html.replace(/<span><\/span>/g, '');

        // 7. Fix internal encoding (e.g. &amp; in URLs) - Restore raw & for fidelity
        html = html.replace(/&amp;/g, '&');

        // 8. Fix Newline artifacts in Title/Header tags (from beautifier)
        html = html.replace(/<(title|h1|h2|h3|h4|h5|h6)>\s*(.*?)\s*<\/\1>/gi, '<$1>$2</$1>');

        return html;
    },

    /**
     * Permissive sanitizer to keep layout and attributes intact.
     */
    sanitizeHTML: (html: string): string => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const sanitizeNode = (node: Node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.tagName === 'SCRIPT') {
                    // We now have RawHtmlNode to handle scripts, so we can keep them in the DOM tree
                    // but they are sanitized by RawHtmlNode's own display:none logic.
                    // However, we MUST ensure they don't execute twice if injected multiple times.
                    // For now, we keep them so $generateNodesFromDOM can see them.
                }
                // Keep all attributes except event handlers
                Array.from(el.attributes).forEach(attr => {
                    if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name);
                });
                el.childNodes.forEach(child => sanitizeNode(child));
            }
        };
        doc.body.childNodes.forEach(child => sanitizeNode(child));
        return doc.body.innerHTML;
    }
};