import type { LexicalEditor } from 'lexical';
import { AureliaEditor } from './engine';
import { ClipboardPlugin } from '../plugins/essentials/clipboard';
import { HeadingsPlugin } from '../plugins/layout/headings';
import { ImagesPlugin } from '../plugins/media/images';
import { CodeBlockPlugin } from '../plugins/advanced/code-blocks';
import { CommentsPlugin } from '../plugins/collaboration/comments';
import { TrackChangesPlugin } from '../plugins/collaboration/track-changes';
import { FormatPainterPlugin } from '../plugins/productivity/format-painter';
import { TablesPlugin } from '../plugins/layout/tables';
import { PlaceholderPlugin } from '../plugins/advanced/placeholder';
import { PageBreakPlugin } from '../plugins/page-layout/page-break';
import { DocumentOutlinePlugin } from '../plugins/productivity/document-outline';
import { FootnotePlugin } from '../plugins/advanced/footnote-plugin';
import { TableOfContentsPlugin } from '../plugins/page-layout/toc-plugin';
import { MinimapPlugin } from '../plugins/productivity/minimap';
import { ToolbarSystem } from '../plugins/configuration/toolbar-system';
import { I18nManager } from '../plugins/configuration/i18n';
import { AccessibilityManager } from '../plugins/configuration/accessibility';
import { UploadManager } from '../plugins/upload/upload-manager';
import { DialogSystem } from '../shared/dialog-system';
import { setupTableGridPicker } from '../ui/table-grid-picker';
import { setupCommentsUI } from '../ui/comments-ui';
import { setupDocumentStatsUI } from '../ui/document-stats-ui';
import { setupCommandPaletteUI } from '../ui/command-palette-ui';
import { setupPresenceUI } from '../ui/presence-ui';
import { setupExportPresetsUI } from '../ui/export-presets-ui';
import { setupImageToolsUI } from '../ui/image-tools-ui';
import { setupCmsPageSettingsUI } from '../ui/cms-page-settings-ui';
import { setupSeoAuditUI } from '../ui/seo-audit-ui';
import { setupTypographyUI } from '../ui/text-style-ui';
import { setupPublishWorkflowUI } from '../ui/publish-workflow-ui';
import { setupContentWorkspaceUI } from '../ui/content-workspace-ui';
import { TemplateBlocksPlugin } from '../plugins/advanced/template-blocks';
import { setupToolbarState } from '../ui/toolbar-logic/state-logic';
import { setupLinkPopover } from '../plugins/media/link-popover-ui';
import { Base64UploadAdapter, CKBoxUploadAdapter, CustomUploadAdapter } from '../plugins/upload/adapters';

export async function initializeDefaultEditorSetup(
    editor: AureliaEditor,
    internalEditor: LexicalEditor
): Promise<void> {
    const [
        { BasicStylesPlugin },
        { HistoryPlugin },
        { ListsPlugin },
        { LinksPlugin },
        { EmbedPlugin },
        { IndentPlugin },
        { AutosavePlugin, hasAutosavedState, loadAutosavedState },
        { MarkdownPlugin },
        { EmojiPlugin },
        { SlashCommandPlugin },
        { ProductivityPlugin },
        { RevisionHistoryPlugin },
        { TableResizerPlugin },
        { setupToolbarSettingsUI },
        { setupCodeBlockPopover },
        { setupTablePopover },
        { setupRevisionHistoryUI },
        { setupFindReplaceUI },
        { setupEmojiUI },
        { setupTrackChangesUI }
    ] = await Promise.all([
        import('../plugins/formatting/basic-styles'),
        import('../plugins/essentials/history'),
        import('../plugins/layout/lists'),
        import('../plugins/media/links'),
        import('../plugins/media/embed-plugin'),
        import('../plugins/layout/indent'),
        import('../plugins/productivity/autosave'),
        import('../plugins/advanced/markdown'),
        import('../plugins/productivity/emoji'),
        import('../plugins/productivity/slash-commands'),
        import('../plugins/productivity/productivity-pack'),
        import('../plugins/advanced/revision-history'),
        import('../plugins/layout/table-resizer'),
        import('../plugins/configuration/toolbar-ui'),
        import('../ui/code-block-popover-ui'),
        import('../ui/table-popover-ui'),
        import('../ui/revision-history-ui'),
        import('../plugins/productivity/find-replace-ui'),
        import('../plugins/productivity/emoji-ui'),
        import('../ui/track-changes-ui')
    ]);

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
    editor.use(CommentsPlugin);
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
    editor.use(TemplateBlocksPlugin);
    editor.use(ProductivityPlugin);
    editor.use(RevisionHistoryPlugin);
    editor.use(TableResizerPlugin);

    setupToolbarState(internalEditor);
    setupLinkPopover(internalEditor);
    setupCodeBlockPopover(internalEditor);
    setupTablePopover(internalEditor);
    setupRevisionHistoryUI(internalEditor);
    setupFindReplaceUI(internalEditor);
    setupEmojiUI(internalEditor);
    setupTableGridPicker(internalEditor);
    setupCommentsUI(internalEditor);
    setupDocumentStatsUI(internalEditor);
    setupCommandPaletteUI(editor);
    setupPresenceUI(editor);
    setupCmsPageSettingsUI();
    setupSeoAuditUI(internalEditor);
    setupTypographyUI(internalEditor);
    setupPublishWorkflowUI(internalEditor);
    setupContentWorkspaceUI(internalEditor);
    setupExportPresetsUI(editor);
    setupImageToolsUI(internalEditor);
    setupTrackChangesUI(internalEditor);
    setupToolbarSettingsUI();

    ToolbarSystem.init(editor, internalEditor);
    I18nManager.init();
    AccessibilityManager.init();

    UploadManager.register(Base64UploadAdapter);
    UploadManager.register(CKBoxUploadAdapter);
    UploadManager.register(CustomUploadAdapter);
    UploadManager.setAdapter('base64');

    if (hasAutosavedState()) {
        setTimeout(async () => {
            const shouldRestore = await DialogSystem.confirm(
                'An unsaved draft was found. Do you want to restore it?',
                'Autosave Detected'
            );

            if (shouldRestore) {
                loadAutosavedState(internalEditor);
            }
        }, 500);
    }
}
