import {
    $applyNodeReplacement,
} from 'lexical';
import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedElementNode,
    Spread,
} from 'lexical';
import { CodeNode } from '@lexical/code';

export type SerializedCodeBlockNode = Spread<
    {
        language: string | null;
        showLineNumbers: boolean;
    },
    SerializedElementNode
>;

/**
 * Enhanced CodeBlockNode with language support, line numbers, and copy functionality
 */
export class CodeBlockNode extends CodeNode {
    __language: string | null;
    __showLineNumbers: boolean;

    constructor(language?: string | null, showLineNumbers?: boolean, key?: NodeKey) {
        super(language, key);
        this.__language = language || null;
        this.__showLineNumbers = showLineNumbers ?? false;
    }

    static getType(): string {
        return 'code-block';
    }

    static clone(node: CodeBlockNode): CodeBlockNode {
        return new CodeBlockNode(node.__language, node.__showLineNumbers, node.__key);
    }

    static importJSON(serializedNode: SerializedCodeBlockNode): CodeBlockNode {
        const node = $createCodeBlockNode(
            serializedNode.language,
            serializedNode.showLineNumbers
        );
        node.setFormat(serializedNode.format);
        node.setIndent(serializedNode.indent);
        node.setDirection(serializedNode.direction);
        return node;
    }

    exportJSON(): SerializedCodeBlockNode {
        return {
            ...super.exportJSON(),
            language: this.__language,
            showLineNumbers: this.__showLineNumbers,
            type: 'code-block',
            version: 1,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const element = document.createElement('code');
        element.className = 'code-block-wrapper';
        element.setAttribute('spellcheck', 'false');

        if (this.__language) {
            element.classList.add(`language-${this.__language}`);
            element.setAttribute('data-language', this.__language);
        }

        if (this.__showLineNumbers) {
            element.classList.add('with-line-numbers');
        }

        this._ensureDecorations(element);

        return element;
    }

    updateDOM(prevNode: CodeBlockNode, dom: HTMLElement): boolean {
        const prevLanguage = prevNode.__language;
        const currentLanguage = this.__language;

        if (prevLanguage !== currentLanguage) {
            if (prevLanguage) {
                dom.classList.remove(`language-${prevLanguage}`);
            }
            if (currentLanguage) {
                dom.classList.add(`language-${currentLanguage}`);
                dom.setAttribute('data-language', currentLanguage);
            } else {
                dom.removeAttribute('data-language');
            }
        }

        const prevShowLineNumbers = prevNode.__showLineNumbers;
        const currentShowLineNumbers = this.__showLineNumbers;

        if (prevShowLineNumbers !== currentShowLineNumbers) {
            if (currentShowLineNumbers) {
                dom.classList.add('with-line-numbers');
            } else {
                dom.classList.remove('with-line-numbers');
            }
        }

        // Always ensure decorations are present and updated
        this._ensureDecorations(dom);

        return false;
    }

    private _ensureDecorations(dom: HTMLElement) {
        // 1. Copy Button
        const copyBtn = dom.querySelector('.code-copy-btn') as HTMLElement;
        if (!copyBtn) {
            const btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.innerHTML = '📋 Copy';
            btn.setAttribute('contenteditable', 'false');
            btn.setAttribute('data-lexical-decorator', 'true');
            btn.style.userSelect = 'none';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.copyCode(dom);
            });
            dom.appendChild(btn);
        }

        // 2. Language Badge
        let badge = dom.querySelector('.code-language-badge') as HTMLElement;
        if (this.__language) {
            if (!badge) {
                const b = document.createElement('span');
                b.className = 'code-language-badge';
                b.setAttribute('contenteditable', 'false');
                b.setAttribute('data-lexical-decorator', 'true');
                b.style.userSelect = 'none';
                dom.appendChild(b);
                badge = b;
            }
            badge.textContent = this.__language;
        } else if (badge) {
            badge.remove();
        }
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement('pre');
        const code = document.createElement('code');

        if (this.__language) {
            code.className = `language-${this.__language}`;
        }

        element.appendChild(code);
        return { element };
    }

    static importDOM(): DOMConversionMap | null {
        return {
            pre: (_node: Node) => ({
                conversion: convertPreElement,
                priority: 1,
            }),
            div: (node: Node) => {
                const div = node as HTMLElement;
                if (div.classList.contains('code-block-wrapper')) {
                    return {
                        conversion: convertCodeBlockWrapper,
                        priority: 2,
                    };
                }
                return null;
            },
        };
    }

    getLanguage(): string | null {
        return this.__language;
    }

    setLanguage(language: string | null): this {
        const writable = this.getWritable();
        writable.__language = language;
        return this;
    }

    getShowLineNumbers(): boolean {
        return this.__showLineNumbers;
    }

    setShowLineNumbers(show: boolean): void {
        const writable = this.getWritable();
        writable.__showLineNumbers = show;
    }

    canInsertTab(): boolean {
        return true;
    }

    canIndent(): false {
        return false;
    }

    collapseAtStart(): boolean {
        return true;
    }

    private copyCode(codeElement: HTMLElement): void {
        // Clone and clean the element to get only the code text
        const clone = codeElement.cloneNode(true) as HTMLElement;
        const decorations = clone.querySelectorAll('.code-copy-btn, .code-language-badge');
        decorations.forEach(el => el.remove());

        const text = clone.textContent || '';

        navigator.clipboard.writeText(text).then(() => {
            const btn = codeElement.querySelector('.code-copy-btn');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✓ Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            }
        }).catch((err) => {
            console.error('Failed to copy code:', err);
        });
    }
}

function convertPreElement(domNode: Node): DOMConversionOutput | null {
    const pre = domNode as HTMLPreElement;
    const code = pre.querySelector('code');

    let language: string | null = null;

    if (code) {
        const classList = Array.from(code.classList);
        const langClass = classList.find(cls => cls.startsWith('language-'));
        if (langClass) {
            language = langClass.replace('language-', '');
        }
    }

    return {
        node: $createCodeBlockNode(language),
    };
}

function convertCodeBlockWrapper(domNode: Node): DOMConversionOutput | null {
    const wrapper = domNode as HTMLElement;
    const code = wrapper.querySelector('code');

    let language: string | null = null;

    if (code) {
        language = code.getAttribute('data-language');
    }

    return {
        node: $createCodeBlockNode(language),
    };
}

export function $createCodeBlockNode(
    language?: string | null,
    showLineNumbers?: boolean
): CodeBlockNode {
    return $applyNodeReplacement(new CodeBlockNode(language, showLineNumbers));
}

export function $isCodeBlockNode(
    node: LexicalNode | null | undefined
): node is CodeBlockNode {
    return node instanceof CodeBlockNode;
}
