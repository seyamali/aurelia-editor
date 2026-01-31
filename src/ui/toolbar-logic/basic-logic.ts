import { AureliaEditor } from '../../core/engine';
import { HISTORY_COMMANDS } from '../../plugins/essentials/history';
import { REMOVE_FORMATTING_COMMAND } from '../../plugins/essentials/clipboard';
import { FORMAT_COMMANDS } from '../../plugins/formatting/basic-styles';
import { LIST_COMMANDS, toggleList } from '../../plugins/layout/lists';
import { insertHorizontalRule, setBlockType, toggleBlockQuote } from '../../plugins/layout/headings';

export function setupBasicLogic(editor: AureliaEditor, internalEditor: any) {
    // Essentials
    document.getElementById('undo-btn')?.addEventListener('click', () => editor.execute(HISTORY_COMMANDS.UNDO.command));
    document.getElementById('redo-btn')?.addEventListener('click', () => editor.execute(HISTORY_COMMANDS.REDO.command));
    document.getElementById('clear-btn')?.addEventListener('click', () => editor.execute(REMOVE_FORMATTING_COMMAND));

    // Inline Formatting
    document.getElementById('bold-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.BOLD.command, FORMAT_COMMANDS.BOLD.payload));
    document.getElementById('italic-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.ITALIC.command, FORMAT_COMMANDS.ITALIC.payload));
    document.getElementById('underline-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.UNDERLINE.command, FORMAT_COMMANDS.UNDERLINE.payload));
    document.getElementById('strike-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.STRIKETHROUGH.command, FORMAT_COMMANDS.STRIKETHROUGH.payload));
    document.getElementById('sub-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.SUBSCRIPT.command, FORMAT_COMMANDS.SUBSCRIPT.payload));
    document.getElementById('sup-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.SUPERSCRIPT.command, FORMAT_COMMANDS.SUPERSCRIPT.payload));
    document.getElementById('code-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.CODE.command, FORMAT_COMMANDS.CODE.payload));

    // Blocks
    document.getElementById('block-type-select')?.addEventListener('change', (e) => {
        const type = (e.target as HTMLSelectElement).value as any;
        setBlockType(internalEditor, type);
    });
    document.getElementById('hr-btn')?.addEventListener('click', () => insertHorizontalRule(internalEditor));
    document.getElementById('quote-btn')?.addEventListener('click', () => toggleBlockQuote(internalEditor));

    // Lists & Indent
    document.getElementById('bullet-btn')?.addEventListener('click', () => toggleList(internalEditor, 'bullet'));
    document.getElementById('number-btn')?.addEventListener('click', () => toggleList(internalEditor, 'number'));
    document.getElementById('indent-btn')?.addEventListener('click', () => editor.execute(LIST_COMMANDS.INDENT.command));
    document.getElementById('outdent-btn')?.addEventListener('click', () => editor.execute(LIST_COMMANDS.OUTDENT.command));
}
