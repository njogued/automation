/**
 * ════════════════════════════════════════════════════════════════════════════
 *  POST  JSON  {
 *    actionType : "Create" | "Update",   // required
 *    title?     : "Document title",      // optional
 *    content?   : "Markdown body",       // optional
 *    docUrl?    : "https://docs.google…" // required only for Update
 *  }
 *  (GET without params still returns a demo document as before)
 * ════════════════════════════════════════════════════════════════════════════
 *  Replace DEST_FOLDER_ID with the folder you want finished docs to live in.
 *  If you use a template, set TEMPLATE_ID.  Otherwise leave TEMPLATE_ID = ''.
 * ────────────────────────────────────────────────────────────────────────────
 */

const DEST_FOLDER_ID = "[YOUR DESTINATION FOLDER ID]";
const TEMPLATE_ID = "[YOUR TEMPLATE ID]"; // optional

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
    "|------|-----------|---------------------|-------------| \n" +
    "| *VP of Product* | Precise Achiever | Detail-oriented, logical | Embrace ambiguity and people needs |\n" +
    "| **Director of Design** | Quiet Maximizer | Supportive, facilitative | Find voice, welcome spotlight |\n" +
    "| __Head of Data__ | Natural Promoter | Visionary, energetic | Operationalize, structure thinking |\n\n" +
    "*Note:* Table alignment and styling may vary slightly when rendered.";
  const md = e?.parameter?.content || demoMD;
  const title = e?.parameter?.title || "Script Generated Document";
  return handleCreate(title, md);
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  POST – unified create / update                                           */
function doPost(e) {
  /* 1. Parse JSON -------------------------------------------------------- */
  let req = {};
  try {
    req = JSON.parse(e?.postData?.contents || "{}");
  } catch (_) {
    return out({ error: "Body must be valid JSON" });
  }

  const action = (req.actionType || "").toLowerCase();
  const title = req.title || "";
  const content = req.content || "";
  const url = req.docUrl || "";

  /* 2. Validate ---------------------------------------------------------- */
  if (!["create", "update"].includes(action)) {
    return out({ error: 'actionType must be "Create" or "Update"' });
  }
  if (action === "create" && !content && !title) {
    return out({ error: "Create requires at least content or title" });
  }
  if (action === "update") {
    if (!url) return out({ error: "docUrl is required for Update" });
    if (!content && !title)
      return out({ error: "Update needs content or title" });
  }

  /* 3. Route ------------------------------------------------------------- */
  try {
    return action === "create"
      ? handleCreate(title, content)
      : handleUpdate(url, title, content);
  } catch (err) {
    return out({ error: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CREATE                                                                  */
function handleCreate(docTitle, md) {
  const title = docTitle || "GPT Generated Document";

  const copy = DriveApp.getFileById(TEMPLATE_ID).makeCopy(title);
  const folder = DriveApp.getFolderById(DEST_FOLDER_ID);
  const file = DriveApp.getFileById(copy.getId());
  file.moveTo(folder);
  const doc = DocumentApp.openById(copy.getId());
  if (md) {
    const body = doc.getBody();
    body.clear();
    body
      .appendParagraph(docTitle)
      .setHeading(DocumentApp.ParagraphHeading.TITLE);
    markdownToDoc(body, md);
  }
  Logger.log(doc.getUrl());

  return out({ status: "created", docUrl: doc.getUrl() });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  UPDATE                                                                  */
function handleUpdate(docUrl, newTitle, md) {
  const id = extractId(docUrl);
  const doc = DocumentApp.openById(id);

  if (newTitle) doc.setName(newTitle);
  if (md) {
    const body = doc.getBody();
    const updateTitle = newTitle || getBodyTitle(doc) || doc.getName();
    body.clear();
    if (updateTitle && updateTitle != "") {
      body
        .appendParagraph(updateTitle)
        .setHeading(DocumentApp.ParagraphHeading.TITLE);
    }
    markdownToDoc(body, md);
  }
  return out({ status: "updated", docUrl: doc.getUrl() });
}

function getBodyTitle(doc) {
  const paras = doc.getBody().getParagraphs();
  for (let i = 0; i < paras.length; i++) {
    if (paras[i].getHeading() === DocumentApp.ParagraphHeading.TITLE) {
      return paras[i].getText();
    }
  }
  return "";
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  HELPERS                                                                 */
function extractId(url) {
  const q = url.match(/[?&]id=([-\w]{25,})/);
  if (q) return q[1];
  const p = url.match(/\/d\/([-\w]{25,})/);
  if (p) return p[1];
  throw new Error("No file ID found in docUrl");
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  markdownToDoc, styleHeaderRow, markdownMultiFormat – unchanged          */
/*    (copy them verbatim from your existing file; heading-to-paragraph rule) */
/* ─────────────────────────────────────────────────────────────────────────── */

function markdownToDoc(body, markdown) {
  const lines = markdown.split("\n");
  const MD_SEPARATOR = /^\|\s*(:?-+:?\s*\|)+\s*$/;
  let inTable = false;
  let tableRows = [];

  for (let line of lines) {
    line = line.trim();
    /* ───────────────────────── 1. TABLE HANDLING ─────────────────────── */
    if (line.startsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      if (MD_SEPARATOR.test(line)) continue;
      if (line.indexOf(":----") < 0) {
        tableRows.push(
          line
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );
      }
    } else if (inTable) {
      inTable = false;
      const table = body.appendTable(tableRows);
      styleAllCells(table);
    }
    /* ───────────────────────── 2. HEADINGS ───────────────────────────── */
    if (line.startsWith("#") && !inTable) {
      for (let i = 6; i > 0; i--) {
        const hashes = "#".repeat(i);
        if (line.startsWith(hashes)) {
          const text = line.substring(i).trim();
          const p = body.appendParagraph(text);
          markdownMultiFormat(p);
          p.setHeading(
            {
              1: DocumentApp.ParagraphHeading.HEADING1,
              2: DocumentApp.ParagraphHeading.HEADING2,
              3: DocumentApp.ParagraphHeading.HEADING3,
              4: DocumentApp.ParagraphHeading.HEADING4,
              5: DocumentApp.ParagraphHeading.HEADING5,
              6: DocumentApp.ParagraphHeading.HEADING6,
            }[i]
          );
          break;
        }
      }
      /* ───────────────────────── 3. BULLETED LISTS ─────────────────────── */
    } else if (/^(\s*)[\*\-\+]\s+/m.test(line) && !inTable) {
      // Find the bullet point marker and extract the content with proper indentation detection
      const match = line.match(/^(\s*)([\*\-\+])\s+(.*)/);
      if (match) {
        const [, indentation, bulletType, listItemText] = match;
        // Create the list item with the extracted text
        const li = body
          .appendListItem(listItemText)
          .setGlyphType(DocumentApp.GlyphType.BULLET);
        // Handle indentation if needed (for nested lists)
        if (indentation.length > 0) {
          // Calculate the nesting level based on indentation
          const nestingLevel = Math.floor(indentation.length / 2); // Assuming 2 spaces per level
          if (nestingLevel > 0) {
            li.setNestingLevel(nestingLevel);
          }
        }
        // Apply formatting to the text content
        markdownMultiFormat(li);
      }
      /* ───────────────────────── 4. REGULAR PARAGRAPHS ─────────────────── */
    } else if (line !== "" && !inTable) {
      const p = body.appendParagraph(line);
      markdownMultiFormat(p);

      /* ───────────────────────── 5. BLANK LINE ─────────────────────────── */
    } else if (line === "" && !inTable) {
      body.appendParagraph("");
    }
  }

  // If the markdown ends with a table, flush it here
  if (inTable) {
    const table = body.appendTable(tableRows);
    styleAllCells(table);
  }
  return;
}

/**
 * Styles the first row as a header
 * …and runs markdownMultiFormat on *every* cell so **bold** / *italic* render.
 */
function styleAllCells(table) {
  const HEADER_BG = "#082B99";
  const HEADER_TEXT = "#FFFFFF";

  for (let r = 0; r < table.getNumRows(); r++) {
    const row = table.getRow(r);

    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);

      /* ── Header row (r === 0) ────────────────────────────────────── */
      if (r === 0) {
        cell
          .setBackgroundColor(HEADER_BG)
          .setVerticalAlignment(DocumentApp.VerticalAlignment.MIDDLE);

        const para = cell.getChild(0).asParagraph();
        markdownMultiFormat(para);
        para
          .setFontFamily("Raleway;500")
          .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
          .setAttributes({
            [DocumentApp.Attribute.FOREGROUND_COLOR]: HEADER_TEXT,
            [DocumentApp.Attribute.FONT_SIZE]: 12,
            [DocumentApp.Attribute.BOLD]: true,
          });
      } else {

      /* ── Body rows ───────────────────────────────────────────────── */
        const para = cell.getChild(0).asParagraph();
        markdownMultiFormat(para); // still apply inline formatting
      }
    }
  }
}

/**
 * Formats **bold**, *italic* (or _italic_), and ***bold-italic*** inside a
 * DocumentApp Text element.  Relies on two heavier/slanted font families
 * for visual punch without resorting to numeric weights.
 */
/**
 * Handles **bold**, *italic*, and the four Markdown bold-italic forms:
 *   ***text***   ___text___   **_text_**   _**text**_
 *
 * Relies only on DocumentApp; no Docs API needed.
 */
function markdownMultiFormat(el) {
  if (!el) return;

  const BOLD_FONT = "Raleway";
  const ITALIC_FONT = "Raleway";

  const src = el.getText();
  const txt = el.editAsText();

  // ─── Replace this eight-branch regex ──────────────────────────────
  // const re = /(\*\*\*[^*]+?\*\*\*)|(___[^_]+?___)|(\*\*_[^_]+?_\*\*)|(_\*\*[^*]+?\*\*_)|(\*\*(?!_)[^*]+?\*\*)|(__(?!_)[^_]+?__)|(\*(?!\*)([^*]+?)\*)|(_(?!_)([^_]+?)_)/g;

  // ─── With this named-capture version ───────────────────────────────
  const re =
    /(?<boldItalicStar>\*\*\*[^*]+?\*\*\*)|(?<boldItalicUnder>___[^_]+?___)|(?<boldItalicMix1>\*\*_+?[^_]+?_+?\*\*)|(?<boldItalicMix2>_\*\*[^*]+?\*\*_)|(?<boldStar>\*\*(?!\*)[^*]+?\*\*)|(?<boldUnder>__(?!_)[^_]+?__)|(?<italicStar>\*(?!\*)([^*]+?)\*)|(?<italicUnder>_(?!_)([^_]+?)_)/g;

  let plain = "";
  let runs = [];
  let i = 0,
    m;

  while ((m = re.exec(src)) !== null) {
    // 1) copy everything up to the markdown delimiter
    plain += src.slice(i, m.index);

    const full = m[0];

    // 2) strip _any_ leading/trailing 1–3 * or _ from the matched chunk
    const inner = full.replace(/^(?:\*{1,3}|_{1,3})|(?:\*{1,3}|_{1,3})$/g, "");

    const start = plain.length;
    plain += inner;
    const end = plain.length - 1;

    // 3) decide type by seeing which named‐group is defined
    const g = m.groups;
    let type;
    if (
      g.boldItalicStar ||
      g.boldItalicUnder ||
      g.boldItalicMix1 ||
      g.boldItalicMix2
    ) {
      type = "boldItalic";
    } else if (g.boldStar || g.boldUnder) {
      type = "bold";
    } else {
      type = "italic";
    }

    runs.push({ start, end, type });
    i = m.index + full.length;
  }

  // 4) append the trailing text
  plain += src.slice(i);

  // 5) overwrite and reapply all formatting runs
  txt.setText(plain);
  runs.forEach(({ start, end, type }) => {
    if (type === "bold") {
      txt.setBold(start, end, true).setFontFamily(start, end, BOLD_FONT);
    } else if (type === "italic") {
      txt.setItalic(start, end, true);
    } else {
      // boldItalic
      txt
        .setBold(start, end, true)
        .setItalic(start, end, true)
        .setFontFamily(start, end, BOLD_FONT)
        .replaceText(/\b_+|_+\b/g, "");
    }
  });
}
