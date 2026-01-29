export const MODALS_HTML = `
      <!-- Find & Replace Dialog -->
      <!-- Find & Replace Dialog -->
      <div id="find-replace-dialog" class="find-replace-dialog hidden">
          <div class="fr-header">
              <span>Find & Replace</span>
              <button id="close-find-btn" class="fr-close-btn">&times;</button>
          </div>
          <div class="fr-body">
              <div class="fr-input-group">
                  <input type="text" id="find-input" placeholder="Find..." />
                  <div class="fr-nav-buttons">
                      <button id="find-prev-btn" title="Previous Match">↑</button>
                      <button id="find-next-btn" title="Next Match">↓</button>
                  </div>
              </div>
              <input type="text" id="replace-input" placeholder="Replace with..." />
              
              <div class="fr-options">
                  <label title="Case Sensitive"><input type="checkbox" id="fr-opt-case" /> aA</label>
                  <label title="Whole Word"><input type="checkbox" id="fr-opt-whole" /> [ ]</label>
                  <label title="Regular Expression"><input type="checkbox" id="fr-opt-regex" /> .*</label>
              </div>

              <div class="fr-actions">
                  <button id="replace-btn" class="btn-secondary-sm">Replace</button>
                  <button id="replace-all-btn" class="btn-secondary-sm">Replace All</button>
              </div>
              <div class="fr-info" id="fr-info-text"></div>
          </div>
      </div>
      
      <!-- Emoji Dialog -->
      <div id="emoji-dialog" class="emoji-picker hidden">
          <div class="emoji-header">
              <span>Pick an Emoji</span>
              <button id="close-emoji-btn">&times;</button>
          </div>
          <div class="emoji-search-area">
              <input type="text" id="emoji-search-input" placeholder="Search emojis..." />
          </div>
          <div class="emoji-tabs">
             <button class="emoji-tab active" data-category="all">All</button>
             <button class="emoji-tab" data-category="smileys">😀</button>
             <button class="emoji-tab" data-category="nature">🌲</button>
             <button class="emoji-tab" data-category="objects">💡</button>
             <button class="emoji-tab" data-category="symbols">❤️</button>
             <button class="emoji-tab" data-category="math">Math</button>
          </div>
          <div id="emoji-grid" class="emoji-grid"></div>
      </div>
      
      <!-- New Revision History is handled via sidebar injected into body -->

      <!-- Toolbar Settings Modal -->
      <div id="toolbar-settings-modal" class="modal hidden">
          <div class="modal-content">
              <h3>Customize Toolbar</h3>
              <p>Show/Hide toolbar items:</p>
              <div id="toolbar-items-list" class="settings-grid"></div>
              <div class="modal-footer">
                  <button id="save-toolbar-settings" class="btn-primary">Save Changes</button>
                  <button id="reset-toolbar-settings" class="btn-secondary">Reset to Default</button>
                  <button id="close-toolbar-settings" class="btn-ghost" style="margin-top: 10px;">Cancel</button>
              </div>
          </div>
      </div>
      <!-- Link Popover -->
      <div id="link-popover" class="link-popover hidden">
          <div class="link-popover-main">
              <input type="text" id="link-url-input" placeholder="Paste or type a link..." />
              <button id="link-apply-btn" class="btn-primary-sm">Apply</button>
              <span class="divider-v"></span>
              <button id="link-open-btn" class="btn-icon-sm" title="Open Link">↗️</button>
              <button id="link-remove-btn" class="btn-icon-sm" title="Remove Link">🗑️</button>
          </div>
          <div class="link-popover-footer">
            <label><input type="checkbox" id="link-target-checkbox" /> Open in new tab</label>
          </div>
      </div>
      
      <!-- Table of Contents Configuration Modal -->
      <div id="toc-config-modal" class="modal hidden">
          <div class="modal-content">
              <div class="modal-header">
                  <h3>📑 Insert Table of Contents</h3>
                  <button id="close-toc-config-btn" class="modal-close-btn">&times;</button>
              </div>
              <div class="modal-body">
                  <div class="toc-config-group">
                      <label>Heading Levels to Include:</label>
                      <div class="toc-level-inputs">
                          <label>
                              From Level:
                              <select id="toc-min-level">
                                  <option value="1">H1</option>
                                  <option value="2">H2</option>
                                  <option value="3">H3</option>
                                  <option value="4">H4</option>
                                  <option value="5">H5</option>
                                  <option value="6">H6</option>
                              </select>
                          </label>
                          <label>
                              To Level:
                              <select id="toc-max-level">
                                  <option value="1">H1</option>
                                  <option value="2">H2</option>
                                  <option value="3" selected>H3</option>
                                  <option value="4">H4</option>
                                  <option value="5">H5</option>
                                  <option value="6" selected>H6</option>
                              </select>
                          </label>
                      </div>
                  </div>
                  
                  <div class="toc-config-group">
                      <label>List Style:</label>
                      <select id="toc-style">
                          <option value="nested">Nested List (Recommended)</option>
                          <option value="unordered">Unordered List</option>
                          <option value="ordered">Ordered List</option>
                      </select>
                  </div>
                  
                  <div class="toc-config-group">
                      <label>
                          <input type="checkbox" id="toc-numbered" />
                          Numbered Headings (e.g., 1.1, 1.2, 2.1)
                      </label>
                  </div>
                  
                  <div class="toc-config-group">
                      <label>
                          <input type="checkbox" id="toc-collapsible" />
                          Collapsible Sections
                      </label>
                  </div>

                  <div class="toc-config-group">
                      <label>Theme Preference:</label>
                      <select id="toc-theme">
                          <option value="auto">Auto (System Default)</option>
                          <option value="light">Light Mode</option>
                          <option value="dark">Dark Mode</option>
                      </select>
                  </div>
              </div>
              <div class="modal-footer">
                  <button id="toc-insert-btn" class="btn-primary">Insert TOC</button>
                  <button id="toc-cancel-btn" class="btn-secondary">Cancel</button>
              </div>
          </div>
      </div>

      <!-- Generic Alert/Info Modal -->
      <div id="universal-alert-modal" class="modal hidden">
          <div class="modal-content">
              <div class="modal-header">
                  <h3 id="ua-title">Notification</h3>
                  <button id="close-ua-btn" class="modal-close-btn">&times;</button>
              </div>
              <div class="modal-body">
                  <p id="ua-message"></p>
              </div>
              <div class="modal-footer">
                  <button id="ua-ok-btn" class="btn-primary">OK</button>
              </div>
          </div>
      </div>

      <!-- Generic Prompt/Input Modal -->
      <div id="universal-prompt-modal" class="modal hidden">
          <div class="modal-content">
              <div class="modal-header">
                  <h3 id="up-title">Input Required</h3>
                  <button id="close-up-btn" class="modal-close-btn">&times;</button>
              </div>
              <div class="modal-body">
                  <p id="up-message" style="margin-bottom: 12px;"></p>
                  <input type="text" id="up-input" style="width: 100%;" />
              </div>
              <div class="modal-footer">
                  <button id="up-cancel-btn" class="btn-secondary">Cancel</button>
                  <button id="up-submit-btn" class="btn-primary">Submit</button>
              </div>
          </div>
      </div>

      <!-- Toast Notification Container -->
      <div id="toast-container" class="toast-container"></div>
`;
