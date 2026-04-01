import '../style.css';
import { AureliaEditor } from '../core/engine';
import { DialogSystem } from '../shared/dialog-system';

const appElement = document.querySelector<HTMLDivElement>('#app');

if (appElement) {
    // Route the demo's console warnings and errors through the in-app toast UI.
    DialogSystem.initConsoleProxy();

    AureliaEditor.create(appElement);
}
