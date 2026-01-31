import { AureliaEditor } from '../core/engine';
import { setupBasicLogic } from './toolbar-logic/basic-logic';
import { setupAdvancedLogic } from './toolbar-logic/advanced-logic';
import { setupDocumentLogic } from './toolbar-logic/document-logic';
import { setupToolbarState } from './toolbar-logic/state-logic';
import { setupLinkPopover } from '../plugins/media/link-popover-ui';
import { setupCodeBlockPopover } from './code-block-popover-ui';

/**
 * Initializes all toolbar button event listeners and dynamic state updates.
 * Logic is modularized into the ./toolbar-logic/ directory.
 */
export function setupToolbar(editor: AureliaEditor, internalEditor: any) {
    // 1. Basic Formatting (Bold, Lists, Blocks, etc.)
    setupBasicLogic(editor, internalEditor);

    // 2. Advanced Features (Media, Tables, Source View, etc.)
    setupAdvancedLogic(editor, internalEditor);

    // 3. Document Actions (Export, Imports, Outlines, etc.)
    setupDocumentLogic(editor, internalEditor);

    // 4. UI State (Dynamic button highlighting based on selection)
    setupToolbarState(internalEditor);

    // 5. Link Popover
    setupLinkPopover(internalEditor);

    // 6. Code Block Popover
    setupCodeBlockPopover(internalEditor);
}
