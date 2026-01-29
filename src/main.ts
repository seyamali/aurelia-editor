import './style.css';
import './spare.css';
import { initSpareLogic } from './spare';
import { MyUniversalEditor } from './core/engine';
import { EDITOR_LAYOUT_HTML } from './ui/layout';
import { setupToolbarState } from './ui/toolbar-logic/state-logic';
import { setupLinkPopover } from './plugins/media/link-popover-ui';
import { setupCodeBlockPopover } from './ui/code-block-popover-ui';

// --- PLUGINS ---
import { BasicStylesPlugin } from './plugins/formatting/basic-styles';
import { HistoryPlugin } from './plugins/essentials/history';
import { ClipboardPlugin } from './plugins/essentials/clipboard';
import { ListsPlugin } from './plugins/layout/lists';
import { HeadingsPlugin } from './plugins/layout/headings';
import { LinksPlugin } from './plugins/media/links';
import { ImagesPlugin } from './plugins/media/images';
import { EmbedPlugin } from './plugins/media/embed-plugin';
import { TablesPlugin } from './plugins/layout/tables';
import { IndentPlugin } from './plugins/layout/indent';
import { CodeBlockPlugin } from './plugins/advanced/code-blocks';
import { TrackChangesPlugin } from './plugins/collaboration/track-changes';
import { AutosavePlugin, hasAutosavedState, loadAutosavedState } from './plugins/productivity/autosave';
import { MarkdownPlugin } from './plugins/advanced/markdown';
import { FormatPainterPlugin } from './plugins/productivity/format-painter';
import { PlaceholderPlugin } from './plugins/advanced/placeholder';
import { SlashCommandPlugin } from './plugins/productivity/slash-commands';
import { PageBreakPlugin } from './plugins/page-layout/page-break';
import { FootnotePlugin } from './plugins/advanced/footnote-plugin';
import { TableOfContentsPlugin } from './plugins/page-layout/toc-plugin';
import { MinimapPlugin } from './plugins/productivity/minimap';
import { HelloWorldPlugin } from './plugins/custom-plugin-demo';
import { ProductivityPlugin } from './plugins/productivity/productivity-pack';
import { RevisionHistoryPlugin } from './plugins/advanced/revision-history';
import { ToolbarSystem } from './plugins/configuration/toolbar-system';
import { setupToolbarSettingsUI } from './plugins/configuration/toolbar-ui';
import { I18nManager } from './plugins/configuration/i18n';
import { AccessibilityManager } from './plugins/configuration/accessibility';
import { UploadManager } from './plugins/upload/upload-manager';
import { Base64UploadAdapter, CKBoxUploadAdapter, CustomUploadAdapter } from './plugins/upload/adapters';

// --- UI SETUP IMPORTS ---
import { setupRevisionHistoryUI } from './ui/revision-history-ui';
import { setupFindReplaceUI } from './plugins/productivity/find-replace-ui';
import { EmojiPlugin } from './plugins/productivity/emoji';
import { setupEmojiUI } from './plugins/productivity/emoji-ui';
import { setupTablePopover } from './ui/table-popover-ui';
import { setupTableGridPicker } from './ui/table-grid-picker';
import { setupTrackChangesUI } from './ui/track-changes-ui';
import { DocumentOutlinePlugin } from './plugins/productivity/document-outline';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (appElement) {
  initSpareLogic();
  appElement.innerHTML = EDITOR_LAYOUT_HTML;

  const canvas = document.querySelector<HTMLDivElement>('#editor-canvas');
  if (canvas) {
    const editor = new MyUniversalEditor(canvas);

    // 1. Load Plugins
    editor.use(BasicStylesPlugin);
    editor.use(HistoryPlugin);
    editor.use(ClipboardPlugin);
    editor.use(ListsPlugin);
    editor.use(HeadingsPlugin);
    editor.use(LinksPlugin);
    editor.use(ImagesPlugin);
    editor.use(new EmbedPlugin());
    editor.use(TablesPlugin);
    editor.use(IndentPlugin);
    editor.use(CodeBlockPlugin);
    editor.use(TrackChangesPlugin);
    editor.use(AutosavePlugin);
    editor.use(MarkdownPlugin);
    editor.use(FormatPainterPlugin);
    editor.use(EmojiPlugin);
    editor.use(PlaceholderPlugin);
    editor.use(SlashCommandPlugin);
    editor.use(PageBreakPlugin);
    editor.use(DocumentOutlinePlugin);
    editor.use(FootnotePlugin);
    editor.use(TableOfContentsPlugin);
    editor.use(MinimapPlugin);
    editor.use(HelloWorldPlugin);
    editor.use(ProductivityPlugin);
    editor.use(RevisionHistoryPlugin);

    const internalEditor = editor.getInternalEditor();

    // 2. Setup UI Handlers
    // Legacy state and popovers that don't depend on static toolbar buttons
    setupToolbarState(internalEditor);
    setupLinkPopover(internalEditor);
    setupCodeBlockPopover(internalEditor);

    // Other UI components
    setupRevisionHistoryUI(internalEditor);
    setupFindReplaceUI(internalEditor);
    setupEmojiUI(internalEditor);
    setupTablePopover(internalEditor);
    setupTableGridPicker(internalEditor); // Configures picker markup
    setupTrackChangesUI(internalEditor);
    setupToolbarSettingsUI(); // Settings modal

    // Initialize the New Toolbar System (Delegation + Customization)
    ToolbarSystem.init(editor, internalEditor);

    // Core Managers
    I18nManager.init();
    AccessibilityManager.init();

    // 3. Initialize File Management
    UploadManager.register(Base64UploadAdapter);
    UploadManager.register(CKBoxUploadAdapter);
    UploadManager.register(CustomUploadAdapter);
    UploadManager.setAdapter('base64');

    // 4. Autosave Logic (Restore Check)
    if (hasAutosavedState()) {
      setTimeout(() => {
        if (confirm("An unsaved draft was found. Do you want to restore it?")) {
          loadAutosavedState(internalEditor);
        }
      }, 500);
    }
  }
}