import { EditorSDK } from '../core/sdk';
import { createCommand, type LexicalCommand, COMMAND_PRIORITY_EDITOR } from 'lexical';
import { DialogSystem } from '../shared/dialog-system';

export const HELLO_WORLD_COMMAND: LexicalCommand<string> = createCommand('HELLO_WORLD_COMMAND');

/**
 * A Demo Plugin to showcase the new Editor SDK.
 * It adds a button to the toolbar and registers a custom command.
 */
export const HelloWorldPlugin = {
    name: 'hello-world',
    init: (sdk: EditorSDK) => {
        // 1. Register a custom command
        sdk.registerCommand(
            HELLO_WORLD_COMMAND,
            (name: string) => {
                const message = `Hello, ${name || 'World'}! This message comes from a custom SDK plugin.`;
                DialogSystem.alert(message, "Hello World");
                sdk.announce(message); // Accessibility announcement
                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        // 2. Add a custom toolbar button via SDK
        sdk.addToolbarButton({
            id: 'hello-world-btn',
            label: 'Hello',
            icon: '👋',
            tooltip: 'Say Hello (SDK Demo)',
            onClick: () => {
                sdk.dispatchCommand(HELLO_WORLD_COMMAND, 'User');
            }
        });

        console.log("HelloWorld Plugin (SDK Demo) initialized.");
    }
};
