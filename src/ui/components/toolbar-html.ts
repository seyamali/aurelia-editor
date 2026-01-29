export const TOOLBAR_HTML = `
      <div id="toolbar" class="toolbar" role="toolbar" aria-label="Editor toolbar">
        <button id="undo-btn" data-i18n="undo" data-i18n-icon="↶" aria-label="Undo">↶ Undo</button>
        <button id="redo-btn" data-i18n="redo" data-i18n-icon="↷" aria-label="Redo">↷ Redo</button>
        <span class="divider"></span>
        <button id="cut-btn" title="Cut (Ctrl+X)">✂️ Cut</button>
        <button id="copy-btn" title="Copy (Ctrl+C)">📋 Copy</button>
        <button id="paste-btn" title="Paste (Ctrl+V)">📥 Paste</button>
        <button id="paste-plain-btn" title="Paste as Plain Text (Ctrl+Shift+V)">📄 Paste Plain</button>
        <span class="divider"></span>
        <button id="clear-btn" data-i18n="clearFormatting" aria-label="Clear formatting">Clear Format</button>
        <button id="format-painter-btn" aria-label="Format Painter">🖌️ Painter</button>
        <button id="find-btn" title="Find & Replace (Ctrl+F)">🔍 Find</button>
        
        <span class="divider"></span>

        <button id="bold-btn" data-i18n="bold" aria-label="Bold text"><b>B</b></button>
        <button id="italic-btn" data-i18n="italic" aria-label="Italic text"><i>I</i></button>
        <button id="underline-btn" data-i18n="underline" aria-label="Underline text"><u>U</u></button>
        <button id="strike-btn" data-i18n="strikethrough" aria-label="Strikethrough text"><s>S</s></button>
        <button id="sub-btn" aria-label="Subscript">X<sub>2</sub></button>
        <button id="sup-btn" aria-label="Superscript">X<sup>2</sup></button>
        <button id="code-btn" aria-label="Inline Code"><code>&lt;/&gt;</code></button>
        
        <span class="divider"></span>

        <select id="block-type-select" class="toolbar-select" aria-label="Block style">
          <option value="paragraph" data-i18n="paragraph">Paragraph</option>
          <option value="h1" data-i18n="h1">Heading 1</option>
          <option value="h2" data-i18n="h2">Heading 2</option>
          <option value="h3" data-i18n="h3">Heading 3</option>
          <option value="h4" data-i18n="h4">Heading 4</option>
          <option value="h5" data-i18n="h5">Heading 5</option>
          <option value="h6" data-i18n="h6">Heading 6</option>
          <option value="quote" data-i18n="quote">Block Quote</option>
        </select>
        <button id="hr-btn" title="Horizontal Line">—</button>
        <button id="quote-btn" title="Block Quote" aria-label="Block Quote">“</button>
        
        <button id="bullet-btn" title="Bulleted List" aria-label="Bulleted List">• List</button>
        <button id="number-btn" title="Numbered List" aria-label="Numbered List">1. List</button>
        <button id="outdent-btn" title="Decrease Indent" aria-label="Decrease Indent">← Indent</button>
        <button id="indent-btn" title="Increase Indent" aria-label="Increase Indent">Indent →</button>
        
        <span class="divider"></span>

        <button id="link-btn" data-i18n="link" data-i18n-icon="🔗">🔗 Link</button>
        <button id="image-btn" data-i18n="image" data-i18n-icon="🖼️" title="Insert Image (Upload, URL, Paste, or Drag & Drop)">🖼️ Image</button>
        <button id="emoji-btn" data-i18n="emoji" data-i18n-icon="😀" title="Insert Emoji">😀 Emoji</button>
        <button id="table-btn" data-i18n="table" data-i18n-icon="📅">📅 Table</button>
        
        <button id="video-btn" data-i18n="youtube" data-i18n-icon="📹">📹 Video</button>
        <button id="html-snippet-btn" data-i18n="htmlSnippet" data-i18n-icon="&lt;/&gt;">&lt;/&gt; Snippet</button>
        <button id="code-block-btn" data-i18n="codeBlock" data-i18n-icon="{}">{} Code Block</button>
        
        <span class="divider"></span>
<button id="insert-placeholder-btn" title="Insert Placeholder" data-i18n="placeholders">🏷️ Field</button>
        
        <span class="divider"></span>
        
        <button id="export-pdf-btn" data-i18n="pdf" data-i18n-icon="📄">📄 PDF</button>
        <button id="export-word-btn" data-i18n="word" data-i18n-icon="📝">📝 Word</button>
        <button id="import-word-btn" data-i18n="importWord" data-i18n-icon="📥">📥 Import Word</button>
        
        <span class="divider"></span>
        <button id="page-break-btn" data-i18n="pageBreak" data-i18n-icon="📄">📄 Break</button>
        <button id="footnote-btn" data-i18n="footnote" data-i18n-icon="¹">¹ Footnote</button>
        <button id="toc-btn" data-i18n="toc" data-i18n-icon="📑">📑 TOC</button>
        <button id="outline-toggle-btn" data-i18n="outline" data-i18n-icon="📑">📑 Outline Sidebar</button>
        <button id="minimap-toggle-btn" title="Toggle Minimap">🗺️ Minimap</button>
        
        <span class="divider"></span>
        <button id="uppercase-btn" title="Uppercase">ABC</button>
        <button id="lowercase-btn" title="Lowercase">abc</button>
        <button id="titlecase-btn" title="Title Case">Abc</button>

        <span class="divider"></span>
        <button id="source-toggle-btn">HTML Source</button>
        
        <span class="divider"></span>
        <select id="language-select" class="toolbar-select">
            <option value="en">🇺🇸 English</option>
            <option value="ar">🇸🇦 العربية (Arabic)</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
        </select>

        <button id="toolbar-settings-btn" title="Toolbar Settings">⚙️</button>

        <button id="track-changes-btn" class="off" data-i18n="trackChanges" data-i18n-icon="👁️">👁️ Track Changes: OFF</button>
        <button id="zen-mode-btn" title="Zen Mode" data-i18n="zenMode">🧘 Zen</button>
        <div id="autosave-status"></div>
      </div>
`;
