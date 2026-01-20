import './style.css';
import { MyUniversalEditor } from './core/engine';
// Import our plugins
import { BasicStylesPlugin, FORMAT_COMMANDS } from './plugins/formatting/basic-styles';
import { HistoryPlugin, HISTORY_COMMANDS } from './plugins/essentials/history';
import { ClipboardPlugin, REMOVE_FORMATTING_COMMAND } from './plugins/essentials/clipboard';
import { LIST_COMMANDS, ListsPlugin } from './plugins/layout/lists';
import { HeadingsPlugin, insertHorizontalRule, setBlockType } from './plugins/layout/headings';
import { insertLink, LinksPlugin } from './plugins/media/links';
import { ImagesPlugin, insertImage } from './plugins/media/images';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (appElement) {
  appElement.innerHTML = `
        <div class="editor-wrapper">
            <div id="toolbar" class="toolbar">
                <button id="undo-btn">↶ Undo</button>
                <button id="redo-btn">↷ Redo</button>
                <button id="bold-btn"><b>B</b></button>
                <button id="clear-btn">Clear Format</button>
                <button id="bullet-btn">Bulleted List</button>
<button id="number-btn">Numbered List</button>
<button id="h1-btn">H1</button>
<button id="h2-btn">H2</button>
<button id="p-btn">P</button>
<button id="italic-btn"><i>I</i></button>
<button id="underline-btn"><u>U</u></button>
<button id="strike-btn"><s>S</s></button>
<button id="sub-btn">x<sub>2</sub></button>
<button id="sup-btn">x<sup>2</sup></button>
<button id="code-btn"><code>&lt;/&gt;</code></button>
<button id="hr-btn">Divider</button>
<button id="indent-btn">Indent ⇢</button>
<button id="link-btn">🔗 Link</button>
<button id="outdent-btn">⇠ Outdent</button>
<button id="image-btn">🖼️ Image</button>

            </div>
            <div id="editor-canvas" class="editor-container"></div>
        </div>
    `;

  const canvas = document.querySelector<HTMLDivElement>('#editor-canvas');
  if (canvas) {
    // 1. Initialize Engine
    const editor = new MyUniversalEditor(canvas);

    // 2. Load Plugins (The CKEditor way)
    editor.use(BasicStylesPlugin);
    editor.use(HistoryPlugin);
    editor.use(ClipboardPlugin);
    editor.use(ListsPlugin);
    editor.use(HeadingsPlugin);
    editor.use(LinksPlugin);
    editor.use(ImagesPlugin);


    // 3. Connect UI to Commands
    document.getElementById('undo-btn')?.addEventListener('click', () => editor.execute(HISTORY_COMMANDS.UNDO.command));
    document.getElementById('redo-btn')?.addEventListener('click', () => editor.execute(HISTORY_COMMANDS.REDO.command));
    document.getElementById('bold-btn')?.addEventListener('click', () => editor.execute(FORMAT_COMMANDS.BOLD.command, FORMAT_COMMANDS.BOLD.payload));
    document.getElementById('clear-btn')?.addEventListener('click', () => {
      editor.execute(REMOVE_FORMATTING_COMMAND, undefined);
    });
    document.getElementById('bullet-btn')?.addEventListener('click', () =>
      editor.execute(LIST_COMMANDS.BULLET.command)
    );
    document.getElementById('number-btn')?.addEventListener('click', () =>
      editor.execute(LIST_COMMANDS.NUMBER.command)
    );
    document.getElementById('h1-btn')?.addEventListener('click', () => setBlockType(editor, 'h1'));
    document.getElementById('h2-btn')?.addEventListener('click', () => setBlockType(editor, 'h2'));
    document.getElementById('p-btn')?.addEventListener('click', () => setBlockType(editor, 'paragraph'));
    document.getElementById('bold-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.BOLD.command, FORMAT_COMMANDS.BOLD.payload));

    document.getElementById('italic-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.ITALIC.command, FORMAT_COMMANDS.ITALIC.payload));

    document.getElementById('underline-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.UNDERLINE.command, FORMAT_COMMANDS.UNDERLINE.payload));

    document.getElementById('strike-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.STRIKETHROUGH.command, FORMAT_COMMANDS.STRIKETHROUGH.payload));
    document.getElementById('sub-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.SUBSCRIPT.command, FORMAT_COMMANDS.SUBSCRIPT.payload));

    document.getElementById('sup-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.SUPERSCRIPT.command, FORMAT_COMMANDS.SUPERSCRIPT.payload));
    document.getElementById('code-btn')?.addEventListener('click', () =>
      editor.execute(FORMAT_COMMANDS.CODE.command, FORMAT_COMMANDS.CODE.payload));

    document.getElementById('hr-btn')?.addEventListener('click', () => {
      insertHorizontalRule(editor.getInternalEditor());
    });
    document.getElementById('indent-btn')?.addEventListener('click', () =>
      editor.execute(LIST_COMMANDS.INDENT.command)
    );

    document.getElementById('outdent-btn')?.addEventListener('click', () =>
      editor.execute(LIST_COMMANDS.OUTDENT.command)
    );
    document.getElementById('link-btn')?.addEventListener('click', () => {
      insertLink(editor);
    });
    document.getElementById('image-btn')?.addEventListener('click', () => {
      insertImage(editor);
    });
  }
}