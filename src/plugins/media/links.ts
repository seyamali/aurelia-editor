import { TOGGLE_LINK_COMMAND, registerAutoLink, toggleLink } from '@lexical/link';
import { COMMAND_PRIORITY_EDITOR } from 'lexical';
import type { EditorPlugin } from '../../core/registry';

// Standard URL Matcher for Auto-detection
const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const LinksPlugin: EditorPlugin = {
    name: 'links',
    init: (editor) => {
        // Fix: Explicitly provide 'matchers' and an empty 'changeHandlers'
        registerAutoLink(editor, {
            matchers: [
                (text: string) => {
                    const match = URL_MATCHER.exec(text);
                    if (match) {
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
            // This was the missing property causing the error
            changeHandlers: [],
        });

        // Register the command listener for TOGGLE_LINK_COMMAND
        editor.registerCommand(
            TOGGLE_LINK_COMMAND,
            (payload: any) => {
                if (payload === null) {
                    toggleLink(null);
                    return true;
                } else if (typeof payload === 'string') {
                    toggleLink(payload);
                    return true;
                } else {
                    const { url, target, rel, title } = payload;
                    toggleLink(url, { target, rel, title });
                    return true;
                }
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