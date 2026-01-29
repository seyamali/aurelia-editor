import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_LOW,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
} from 'lexical';

import { SlashMenuUI, type SlashCommand } from './slash-menu-ui';
import { EditorSDK } from '../../core/sdk';

// Command Implementations
import { setBlockType, insertHorizontalRule } from '../layout/headings';
import { LIST_COMMANDS } from '../layout/lists';
import { insertImage } from '../media/images';
import { insertTable } from '../layout/tables';
import { INSERT_CODE_BLOCK_COMMAND } from '../advanced/code-blocks';
import { MediaEmbedPlugin } from '../advanced/media-embed';
import { INSERT_PLACEHOLDER_COMMAND, showPlaceholderInsertPanel } from '../advanced/placeholder';

const SLASH_COMMANDS: SlashCommand[] = [
    {
        label: 'Paragraph',
        icon: '¶',
        description: 'Plain text paragraph',
        execute: (editor) => setBlockType(editor, 'paragraph')
    },
    {
        label: 'Heading 1',
        icon: 'H1',
        description: 'Large heading',
        execute: (editor) => setBlockType(editor, 'h1')
    },
    {
        label: 'Heading 2',
        icon: 'H2',
        description: 'Medium heading',
        execute: (editor) => setBlockType(editor, 'h2')
    },
    {
        label: 'Heading 3',
        icon: 'H3',
        description: 'Small heading',
        execute: (editor) => setBlockType(editor, 'h3')
    },
    {
        label: 'Quote',
        icon: '"',
        description: 'Block quote',
        execute: (editor) => setBlockType(editor, 'quote')
    },
    {
        label: 'Bullet List',
        icon: '•',
        description: 'Bulleted list',
        execute: (editor) => editor.dispatchCommand(LIST_COMMANDS.BULLET.command, undefined)
    },
    {
        label: 'Numbered List',
        icon: '1.',
        description: 'Numbered list',
        execute: (editor) => editor.dispatchCommand(LIST_COMMANDS.NUMBER.command, undefined)
    },
    {
        label: 'Divider',
        icon: '—',
        description: 'Horizontal divider',
        execute: (editor) => insertHorizontalRule(editor)
    },
    {
        label: 'Code Block',
        icon: '{}',
        description: 'Code block with syntax highlighting',
        execute: (editor) => editor.dispatchCommand(INSERT_CODE_BLOCK_COMMAND, undefined)
    },
    {
        label: 'Image',
        icon: '🖼️',
        description: 'Insert an image',
        execute: (editor) => insertImage(editor)
    },
    {
        label: 'Table',
        icon: '📊',
        description: 'Insert a table',
        execute: (editor) => insertTable(editor)
    },
    {
        label: 'YouTube',
        icon: '📹',
        description: 'Embed a YouTube video',
        execute: (editor) => MediaEmbedPlugin.insertYouTube(editor)
    },
    {
        label: 'Placeholder',
        icon: '🏷️',
        description: 'Insert a merge field placeholder',
        execute: (editor) => showPlaceholderInsertPanel(editor)
    }
];

export const SlashCommandPlugin = {
    name: 'slash-commands',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();
        const menuUI = new SlashMenuUI(editor, SLASH_COMMANDS);

        // Define a way to track the slash trigger
        let matchOffset = -1;
        let matchNodeKey: string | null = null;

        // Listen to updates to detect '/'
        sdk.registerUpdateListener(({ editorState }: any) => {
            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                    menuUI.hide();
                    return;
                }

                const node = selection.anchor.getNode();
                const offset = selection.anchor.offset;
                const text = node.getTextContent();

                // Check if we are typing a slash command
                // Pattern: Starts with '/' or space + '/'
                // We want to capture text AFTER the slash as the query

                const lastSlash = text.lastIndexOf('/', offset - 1);

                if (lastSlash !== -1) {
                    // Make sure it's either the start of the node OR preceded by space
                    const isStart = lastSlash === 0;
                    const precededBySpace = lastSlash > 0 && text[lastSlash - 1] === ' ';

                    if (isStart || precededBySpace) {
                        const query = text.substring(lastSlash + 1, offset);
                        // Do not allow spaces in query for now (simplifies things)
                        if (!query.includes(' ')) {
                            matchOffset = lastSlash;
                            matchNodeKey = node.getKey();

                            // Calculate position for menu
                            const domElement = sdk.getElementByKey(node.getKey());
                            if (domElement) {
                                // Fallback positioning using window selection (simplest for now)
                                const nativeSelection = window.getSelection();
                                if (nativeSelection && nativeSelection.rangeCount > 0) {
                                    const rect = nativeSelection.getRangeAt(0).getBoundingClientRect();
                                    menuUI.show(rect, query);
                                    return;
                                }
                            }
                        }
                    }
                }

                menuUI.hide();
            });
        });

        // Intercept Keys
        sdk.registerCommand(
            KEY_ARROW_UP_COMMAND,
            (payload) => {
                if (menuUI.isVisible) {
                    menuUI.moveUp();
                    payload.preventDefault();
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        sdk.registerCommand(
            KEY_ARROW_DOWN_COMMAND,
            (payload) => {
                if (menuUI.isVisible) {
                    menuUI.moveDown();
                    payload.preventDefault();
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        sdk.registerCommand(
            KEY_ENTER_COMMAND,
            (payload) => {
                if (menuUI.isVisible) {
                    const action = menuUI.selectAction();
                    if (action) {
                        // Store the action to execute after deletion
                        const actionToExecute = action;
                        const nodeKeyToMatch = matchNodeKey;
                        const offsetToMatch = matchOffset;
                        
                        // Delete the slash command text first
                        sdk.update(() => {
                            const selection = $getSelection();
                            if ($isRangeSelection(selection) && nodeKeyToMatch) {
                                const anchor = selection.anchor;
                                if (anchor.key === nodeKeyToMatch) {
                                    // Remove from matchOffset to current anchor offset
                                    const deleteSize = anchor.offset - offsetToMatch;
                                    if (deleteSize > 0) {
                                        selection.anchor.offset = offsetToMatch;
                                        selection.focus.offset = offsetToMatch + deleteSize;
                                        selection.removeText();
                                    }
                                }
                            }
                        });

                        // Execute action after deletion (most actions handle their own updates)
                        // This ensures proper undo/redo behavior
                        actionToExecute.execute(editor);
                        
                        menuUI.hide();
                        matchOffset = -1;
                        matchNodeKey = null;
                        payload?.preventDefault();
                        return true;
                    }
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );

        sdk.registerCommand(
            KEY_ESCAPE_COMMAND,
            () => {
                if (menuUI.isVisible) {
                    menuUI.hide();
                    return true;
                }
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }
};
