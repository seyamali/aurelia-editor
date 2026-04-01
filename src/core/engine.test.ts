import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    initializeDefaultEditorSetup,
    getHtmlMock,
    setHtmlMock
} = vi.hoisted(() => ({
    initializeDefaultEditorSetup: vi.fn(async () => {}),
    getHtmlMock: vi.fn(() => '<p>mock html</p>'),
    setHtmlMock: vi.fn()
}));

vi.mock('./default-setup', () => ({
    initializeDefaultEditorSetup
}));

vi.mock('../plugins/advanced/source-view', () => ({
    SourceViewPlugin: {
        getHtml: getHtmlMock,
        setHtml: setHtmlMock
    }
}));

import { AureliaEditor } from './engine';

describe('AureliaEditor public API', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="host"></div>';
        initializeDefaultEditorSetup.mockClear();
        getHtmlMock.mockClear();
        getHtmlMock.mockReturnValue('<p>mock html</p>');
        setHtmlMock.mockClear();
    });

    it('injects the editor layout and runs the default setup', async () => {
        const container = document.getElementById('host');

        expect(container).not.toBeNull();

        const editor = await AureliaEditor.create(container as HTMLElement);

        expect(container?.querySelector('#editor-canvas')).not.toBeNull();
        expect(initializeDefaultEditorSetup).toHaveBeenCalledTimes(1);
        expect(initializeDefaultEditorSetup).toHaveBeenCalledWith(
            editor,
            editor.getInternalEditor()
        );
    });

    it('delegates getHtml() to the source view plugin', async () => {
        const editor = new AureliaEditor(document.createElement('div'));

        const html = await editor.getHtml();

        expect(html).toBe('<p>mock html</p>');
        expect(getHtmlMock).toHaveBeenCalledTimes(1);
        expect(getHtmlMock).toHaveBeenCalledWith(editor);
    });

    it('delegates setHtml() to the source view plugin', async () => {
        const editor = new AureliaEditor(document.createElement('div'));

        await editor.setHtml('<p>hello</p>');

        expect(setHtmlMock).toHaveBeenCalledTimes(1);
        expect(setHtmlMock).toHaveBeenCalledWith(editor, '<p>hello</p>');
    });
});
