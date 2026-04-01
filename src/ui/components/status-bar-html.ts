export const STATUS_BAR_HTML = `
      <div class="editor-status-bar">
          <div class="status-left">
              <span id="word-count">0 words</span>
              <span class="status-sep">|</span>
              <span id="char-count">0 characters</span>
          </div>
          <div class="status-right">
              <button id="presence-btn" class="presence-btn" title="Live collaborator presence">
                  <span class="presence-dot"></span>
                  <span id="presence-count">1 online</span>
              </button>
              <span id="autosave-status" class="autosave-status"></span>
              <span id="reading-time">1 min read</span>
          </div>
      </div>
`;
