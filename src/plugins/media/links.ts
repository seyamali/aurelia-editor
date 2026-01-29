import { TOGGLE_LINK_COMMAND, registerAutoLink, toggleLink } from '@lexical/link';
import { COMMAND_PRIORITY_EDITOR, $getSelection, $isRangeSelection, $isNodeSelection } from 'lexical';
import { ImageNode, $isImageNode } from './image-node';
import { EditorSDK } from '../../core/sdk';
import type { EditorPlugin } from '../../core/registry';

// Standard URL Matcher for Auto-detection
const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const LinksPlugin: EditorPlugin = {
    name: 'links',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();
        // Fix: Explicitly provide 'matchers' and an empty 'changeHandlers'
        registerAutoLink(editor, {
            matchers: [
                (text: string) => {
                    const match = URL_MATCHER.exec(text);
                    if (match) {
                        // Optimization: If the match is preceded by a Zero-Width Space (\u200B),
                        // it means the user has explicitly unlinked this URL. 
                        // We should not auto-link it again.
                        if (match.index > 0 && text[match.index - 1] === '\u200B') {
                            return null;
                        }

                        return {
                            index: match.index,
                            length: match[0].length,
                            text: match[0],
                            url: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
                        };
                    }
                    return null;
                },
            ],
            changeHandlers: [],
        });

        // Register the command listener for TOGGLE_LINK_COMMAND
        sdk.registerCommand(
            TOGGLE_LINK_COMMAND,
            (payload: any) => {
                const selection = $getSelection();

                if (payload === null) {
                    // Unlink logic
                    if ($isNodeSelection(selection)) {
                        const nodes = selection.getNodes();
                        if (nodes.length === 1 && $isImageNode(nodes[0])) {
                            editor.update(() => (nodes[0] as ImageNode).setLinkUrl(''));
                            return true;
                        }
                    }
                    if ($isRangeSelection(selection)) {
                        toggleLink(null);
                        return true;
                    }
                    return false;
                }

                // Payload exists (URL provided)
                if ($isNodeSelection(selection)) {
                    const nodes = selection.getNodes();
                    if (nodes.length === 1 && $isImageNode(nodes[0])) {
                        const url = typeof payload === 'string' ? payload : payload.url;
                        editor.update(() => (nodes[0] as ImageNode).setLinkUrl(url));
                        return true;
                    }
                }

                if ($isRangeSelection(selection)) {
                    if (typeof payload === 'string') {
                        toggleLink(payload);
                    } else {
                        const { url, target, rel, title } = payload;
                        toggleLink(url, { target, rel, title });
                    }
                    return true;
                }

                return false;
            },
            COMMAND_PRIORITY_EDITOR,
        );

        console.log("Link & Auto-link support initialized");
    }
};

export const insertLink = (editor: any) => {
    const url = window.prompt("Enter URL:", "https://");
    if (url) {
        editor.getInternalEditor().dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
};