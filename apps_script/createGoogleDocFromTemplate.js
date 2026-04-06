/**
 * ════════════════════════════════════════════════════════════════════════════
 *  POST  JSON  {
 *    actionType : "Create" | "Update",   // required
 *    title?     : "Document title",      // optional
 *    content?   : "Markdown body",       // optional
 *    docUrl?    : "https://docs.google…" // required only for Update
 *    tempType?  : "" // optional, defaults to "s"
 *  }
 *  (GET without params still returns a demo document as before)
 * ════════════════════════════════════════════════════════════════════════════
 *  Replace DEST_FOLDER_ID with the folder you want finished docs to live in.
 *  If you use a template, set TEMPLATE_ID.  Otherwise leave TEMPLATE_ID = ''.
 * ────────────────────────────────────────────────────────────────────────────
 */

const DEST_FOLDER_ID = '1s95vSkKErtrnUTmTb_mRx8ST9aQEo5xe';
const LANDSCAPE_TEMPLATE = '11PCpGjCpxShWUtEUcAWkH7hzmXNCTkRWGAigjNxVE3U';
const PORTRAIT_TEMPLATE = '1g9E2dL1xXhaTx3wtyEGci-bUx9TpN3hvflP2WE_lRfw';
const ALT_TEMPLATE_ID = '1l2yZ8uv3Eqq_RkjDAErb0bb-FNWAncmj_MP1019lmyE'

/* ─────────────────────────────────────────────────────────────────────────── */
/*  GET – quick demo document                                                */
function doGet(e) {
  const demoMD =
    "# **Heading** Level 1 (H1)\n" +
    "## Heading Level 2 (H2)\n" +
    "### Heading *Level 3* (H3)\n" +
    "This paragraph has **bold** and *italic* text for format checks.\n\n" +

    "* Bullet one\n" +
    "* Bullet two with **bold** word\n\n" +

    "| Role | __Archetype__ | **Communication Style** | *Growth Edge* | \n" +
    "| ------ |----------------------|---------------------|-------------| \n" +
    "| *VP of Product* | Precise Achiever | Detail-oriented, logical | Embrace ambiguity and people needs |\n" +
    "| **Director of Design** | Quiet Maximizer | Supportive, facilitative | Find voice, welcome spotlight |\n" +
    "| __Head of Data__ | Natural Promoter | Visionary, energetic | Operationalize, structure thinking |\n\n" +

    "*Note:* Table alignment and styling may vary slightly when rendered.";

  const md     = e?.parameter?.content || demoMD;
  const title  = e?.parameter?.title   || 'Script Generated Document';
  return handleCreate(title, md, "s_portrait");
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  POST – unified create / update                                           */
function doPost(e) {
  /* 1. Parse JSON -------------------------------------------------------- */
  let req = {};
  try { req = JSON.parse(e?.postData?.contents || '{}'); }
  catch (_) { return out({ error: 'Body must be valid JSON' }); }

  const action  = (req.actionType || '').toLowerCase();
  const title   = req.title   || '';
  const content = req.content || '';
  const url     = req.docUrl  || '';
  const template = req.tempType || 's'

  /* 2. Validate ---------------------------------------------------------- */
  if (!['create', 'update'].includes(action)) {
    return out({ error: 'actionType must be "Create" or "Update"' });
  }
  if (action === 'create' && !content && !title) {
    return out({ error: 'Create requires at least content or title' });
  }
  if (action === 'update') {
    if (!url)                     return out({ error: 'docUrl is required for Update' });
    if (!content && !title)       return out({ error: 'Update needs content or title' });
  }

  /* 3. Route ------------------------------------------------------------- */
  try {
    return (action === 'create')
           ? handleCreate(title, content, template)
           : handleUpdate(url, title, content);
  } catch (err) {
    return out({ error: err.message, stack: err.stack });
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CREATE                                                                  */
function handleCreate(docTitle, md, template) {
  try {
    const title = docTitle || 'GPT Generated Document';
    let templateId;

    // Case-insensitive template matching with validation
    const normalizedTemplate = (template || '').toLowerCase();
    // Explicit routing based on your new naming convention
    if (normalizedTemplate.includes("veridical") || normalizedTemplate.includes("vvc")) {
      templateId = VVC_TEMPLATE_ID;
    } else if (normalizedTemplate === "s_portrait") {
      templateId = s_PORTRAIT_TEMPLATE;
    } else {
      // Defaults to the landscape version if "s_landscape" is passed, 
      // or as a fallback if the AI hallucinates a different name.
      templateId = s_TEMPLATE_ID; 
    }

    // Validate template ID exists
    if (!templateId || templateId.trim() === '') {
      throw new Error('Template ID is not configured');
    }

    // Validate folder ID exists
    if (!DEST_FOLDER_ID || DEST_FOLDER_ID.trim() === '') {
      throw new Error('Destination folder ID is not configured');
    }

    // Create copy with error handling
    let copy;
    try {
      copy = DriveApp.getFileById(templateId).makeCopy(title);
    } catch (err) {
      throw new Error(`Failed to access template: ${err.message}`);
    }

    // Move to folder with error handling
    let folder;
    try {
      folder = DriveApp.getFolderById(DEST_FOLDER_ID);
    } catch (err) {
      throw new Error(`Failed to access destination folder: ${err.message}`);
    }

    const file = DriveApp.getFileById(copy.getId());
    file.moveTo(folder);

    const doc = DocumentApp.openById(copy.getId());

    // Only process markdown if provided and non-empty
    if (md && md.trim() !== '') {
      const body = doc.getBody();
      body.clear();
      if (docTitle && docTitle.trim() !== '') {
        body.appendParagraph(docTitle).setHeading(DocumentApp.ParagraphHeading.TITLE);
      }
      markdownToDoc(body, md);
    }

    Logger.log(doc.getUrl());
    return out({ status: 'created', docUrl: doc.getUrl() });

  } catch (err) {
    throw new Error(`Create failed: ${err.message}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  UPDATE                                                                  */
function handleUpdate(docUrl, newTitle, md) {
  try {
    const id = extractId(docUrl);
    let doc;

    try {
      doc = DocumentApp.openById(id);
    } catch (err) {
      throw new Error(`Failed to open document: ${err.message}`);
    }

    if (newTitle && newTitle.trim() !== '') {
      doc.setName(newTitle);
    }

    if (md && md.trim() !== '') {
      const body = doc.getBody();
      const updateTitle = newTitle || getBodyTitle(doc) || doc.getName();
      body.clear();
      if (updateTitle && updateTitle.trim() !== '') {
        body.appendParagraph(updateTitle)
            .setHeading(DocumentApp.ParagraphHeading.TITLE);
      }
      markdownToDoc(body, md);
    }

    return out({ status: 'updated', docUrl: doc.getUrl() });

  } catch (err) {
    throw new Error(`Update failed: ${err.message}`);
  }
}

function getBodyTitle(doc) {
  try {
    const paras = doc.getBody().getParagraphs();
    for (let i = 0; i < paras.length; i++) {
      if (paras[i].getHeading() === DocumentApp.ParagraphHeading.TITLE) {
        const text = paras[i].getText();
        return text ? text.trim() : '';
      }
    }
    return '';
  } catch (err) {
    Logger.log(`Error getting body title: ${err.message}`);
    return '';
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                 */
function extractId(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Invalid or empty docUrl provided');
  }

  // Try query parameter format first: ?id=...
  const q = url.match(/[?&]id=([-\w]{25,})/);
  if (q) return q[1];

  // Try path format: /d/...
  const p = url.match(/\/d\/([-\w]{25,})/);
  if (p) return p[1];

  // Try direct ID (if someone just passes the ID)
  if (/^[-\w]{25,}$/.test(url.trim())) {
    return url.trim();
  }

  throw new Error('No valid file ID found in docUrl. Expected format: https://docs.google.com/document/d/{ID} or ?id={ID}');
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  markdownToDoc, styleAllCells, markdownMultiFormat                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function markdownToDoc(body, markdown) {
  if (!markdown || markdown.trim() === '') {
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PREPROCESSING
  // ═══════════════════════════════════════════════════════════════════════

  // 1. Normalize line endings to \n
  markdown = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove markdown escape characters (backslashes before special chars)
  markdown = markdown.replace(/\\([\\`*_{}\[\]()#+\-.!|>])/g, '$1');

  // 3. Remove backslashes before spaces
  markdown = markdown.replace(/\\(?=\s)/g, '');

  // 4. Remove blank lines between bullet points/list items
  // This collapses multiple newlines between list items into single newlines
  markdown = markdown.replace(/(^\s*(?:[*+-]|\d+[.)])\s.*)\n(?:[ \t]*\n)+(?=^\s*(?:[*+-]|\d+[.)])\s)/gm, '$1\n');

  const lines = markdown.split('\n');
  const MD_SEPARATOR = /^\|\s*(:?-+:?\s*\|?)+\s*$/;
  const DASH_LINE = /^-{3,}$/;  // Line with 3 or more dashes
  let inTable   = false;
  let tableRows = [];
  let lineNumber = 0;

  try {
    for (let line of lines) {
      lineNumber++;
      line = line.trim();

      // Skip lines that are just a series of dashes (horizontal rules)
      if (DASH_LINE.test(line)) {
        continue;
      }

    /* ───────────────────────── 1. TABLE HANDLING ─────────────────────── */
    if (line.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }

      // Parse cells - handle both with and without trailing pipe
      const cleanLine = line.replace(/^\|/, '').replace(/\|$/, '');
      const cells = cleanLine.split('|').map(c => c.trim());

      // Skip separator rows (containing only dashes, colons, and optional spaces)
      const isSeparatorRow = cells.length > 0 && cells.every(c => /^:?-{1,}:?$/.test(c));
      if (isSeparatorRow) continue;

      // Skip empty rows
      if (cells.length === 0 || cells.every(c => c === '')) continue;

      tableRows.push(cells);

    } else if (inTable) {
      // End of table - flush it
      inTable = false;
      if (tableRows.length > 0) {
        const table = body.appendTable(tableRows);
        styleAllCells(table);
      }
      tableRows = [];
    }

    /* ───────────────────────── 2. HEADINGS ───────────────────────────── */
    if (line.startsWith('#') && !inTable) {
      for (let i = 6; i > 0; i--) {
        const hashes = '#'.repeat(i);
        if (line.startsWith(hashes + ' ')) {
          const text = line.substring(i).trim();
          if (text === '') continue; // Skip empty headings

          const p = body.appendParagraph(text);
          markdownMultiFormat(p);
          p.setHeading(
            {
              1: DocumentApp.ParagraphHeading.HEADING1,
              2: DocumentApp.ParagraphHeading.HEADING2,
              3: DocumentApp.ParagraphHeading.HEADING3,
              4: DocumentApp.ParagraphHeading.HEADING4,
              5: DocumentApp.ParagraphHeading.HEADING5,
              6: DocumentApp.ParagraphHeading.HEADING6
            }[i]
          );
          break;
        }
      }

    /* ───────────────────────── 3. BULLETED LISTS ─────────────────────── */
    } else if (/^(\s*)[\*\-\+]\s+/m.test(line) && !inTable) {
      const match = line.match(/^(\s*)([\*\-\+])\s+(.*)/);
      if (match) {
        const [, indentation, bulletType, listItemText] = match;

        // Skip empty list items
        if (listItemText.trim() === '') continue;

        const li = body.appendListItem(listItemText).setGlyphType(DocumentApp.GlyphType.BULLET);

        // Handle indentation - support both 2 and 4 space indentation
        if (indentation.length > 0) {
          // Calculate nesting level (support 2 or 4 spaces per level)
          const nestingLevel = Math.min(
            Math.floor(indentation.length / 2),
            8 // Google Docs max nesting level
          );
          if (nestingLevel > 0) {
            li.setNestingLevel(nestingLevel);
          }
        }

        markdownMultiFormat(li);
      }

    /* ───────────────────────── 4. REGULAR PARAGRAPHS ─────────────────── */
    } else if (line !== '' && !inTable) {
      try {
        const p = body.appendParagraph(line);
        markdownMultiFormat(p);
      } catch (err) {
        Logger.log(`Error formatting paragraph at line ${lineNumber}: ${err.message}`);
        // Fallback: add plain text without formatting
        body.appendParagraph(line);
      }

    /* ───────────────────────── 5. BLANK LINE ─────────────────────────── */
    } else if (line === '' && !inTable) {
      body.appendParagraph('');
    }
  }

    // If the markdown ends with a table, flush it here
    if (inTable && tableRows.length > 0) {
      const table = body.appendTable(tableRows);
      styleAllCells(table);
    }

  } catch (err) {
    Logger.log(`Error parsing markdown at line ${lineNumber}: ${err.message}`);
    Logger.log(`Problematic line: ${lines[lineNumber - 1]}`);
    // Continue processing - partial content is better than nothing
  }
}


/**
 * Styles the first row as a header and applies markdownMultiFormat to all cells
 */
function styleAllCells(table) {
  if (!table || table.getNumRows() === 0) return;

  const HEADER_BG   = '#082B99';
  const HEADER_TEXT = '#FFFFFF';

  for (let r = 0; r < table.getNumRows(); r++) {
    const row = table.getRow(r);

    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);

      /* ── Header row (r === 0) ────────────────────────────────────── */
      if (r === 0) {
        cell.setBackgroundColor(HEADER_BG)
            .setVerticalAlignment(DocumentApp.VerticalAlignment.MIDDLE);

        if (cell.getNumChildren() > 0) {
          const para = cell.getChild(0).asParagraph();
          markdownMultiFormat(para);
          para.setFontFamily('Raleway')
              .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
              .setAttributes({
                [DocumentApp.Attribute.FOREGROUND_COLOR]: HEADER_TEXT,
                [DocumentApp.Attribute.FONT_SIZE]      : 12,
                [DocumentApp.Attribute.BOLD]           : true
              });
        }
      }

      /* ── Body rows ───────────────────────────────────────────────── */
      else {
        if (cell.getNumChildren() > 0) {
          const para = cell.getChild(0).asParagraph();
          markdownMultiFormat(para);
        }
      }
    }
  }
}


/**
 * Handles **bold**, *italic*, and the four Markdown bold-italic forms:
 *   ***text***   ___text___   **_text_**   _**text**_
 */
function markdownMultiFormat(el) {
  if (!el) return;

  const BOLD_FONT   = 'Raleway';
  const ITALIC_FONT = 'Raleway';

  let src;
  try {
    src = el.getText();
  } catch (err) {
    Logger.log(`Error getting text: ${err.message}`);
    return;
  }

  if (!src || src.trim() === '') return;

  const txt = el.editAsText();

  // Named-capture regex for markdown formatting
  // Match pairs of delimiters, avoiding unmatched underscores/asterisks
  const re = /(?<boldItalicStar>\*\*\*[^*\n]+?\*\*\*)|(?<boldItalicUnder>___[^_\n]+?___)|(?<boldItalicMix1>\*\*_[^_\n]+?_\*\*)|(?<boldItalicMix2>_\*\*[^*\n]+?\*\*_)|(?<boldStar>\*\*(?!\*)[^*\n]+?\*\*)|(?<boldUnder>__(?!_)[^_\n]+?__)|(?<italicStar>\*(?!\*)[^*\n]+?\*)|(?<italicUnder>_(?!_)[^_\n]+?_)/g;

  let plain = '';
  let runs  = [];
  let i     = 0, m;

  // Prevent infinite loops with a safety counter
  let matchCount = 0;
  const MAX_MATCHES = 1000;

  while ((m = re.exec(src)) !== null && matchCount < MAX_MATCHES) {
    matchCount++;

    // Copy everything up to the markdown delimiter
    plain += src.slice(i, m.index);

    const full = m[0];

    // Strip any leading/trailing 1-3 * or _ from the matched chunk
    const inner = full.replace(/^(?:\*{1,3}|_{1,3})|(?:\*{1,3}|_{1,3})$/g, '');

    const start = plain.length;
    plain += inner;
    const end   = plain.length - 1;

    // Decide type by seeing which named-group is defined
    const g = m.groups;
    let type;
    if (
      g.boldItalicStar  ||
      g.boldItalicUnder ||
      g.boldItalicMix1  ||
      g.boldItalicMix2
    ) {
      type = 'boldItalic';
    } else if (g.boldStar || g.boldUnder) {
      type = 'bold';
    } else {
      type = 'italic';
    }

    runs.push({ start, end, type });
    i = m.index + full.length;
  }

  // Append the trailing text
  plain += src.slice(i);

  // Overwrite and reapply all formatting runs
  try {
    txt.setText(plain);
    runs.forEach(({ start, end, type }) => {
      // Validate indices
      if (start < 0 || end >= plain.length || start > end) return;

      if (type === 'bold') {
        txt.setBold(start, end, true)
           .setFontFamily(start, end, BOLD_FONT);
      } else if (type === 'italic') {
        txt.setItalic(start, end, true);
      } else {
        // boldItalic
        txt.setBold(start, end, true)
           .setItalic(start, end, true)
           .setFontFamily(start, end, BOLD_FONT);
      }
    });
  } catch (err) {
    Logger.log(`Error applying formatting: ${err.message}`);
  }
}