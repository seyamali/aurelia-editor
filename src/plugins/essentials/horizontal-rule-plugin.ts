import { EditorSDK } from '../../core/sdk';
import type { EditorPlugin } from '../../core/registry';
import { $createHorizontalRuleNode, INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { COMMAND_PRIORITY_EDITOR, $getSelection } from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';

export const HorizontalRulePlugin: EditorPlugin = {
    name: 'HorizontalRulePlugin',
    init: (sdk: EditorSDK) => {
        const editor = sdk.getLexicalEditor();

        editor.registerCommand(
            INSERT_HORIZONTAL_RULE_COMMAND,
            () => {
                const selection = editor.getEditorState().read(() => {
                    return $getSelection();
                });

                if (!selection) return false;

                editor.update(() => {
                    const hrNode = $createHorizontalRuleNode();
                    $insertNodeToNearestRoot(hrNode);
                });

                return true;
            },
            COMMAND_PRIORITY_EDITOR,
        );
    }
};
