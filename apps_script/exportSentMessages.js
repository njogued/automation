/**
 * Export only the messages YOU sent in 2025 into a single "Messages" sheet,
 * and also write a JSON file with the same data (JSON keeps full bodies).
 * Filters out one-recipient emails to edward@storiedinc.com or njogued@gmail.com.
 */
function exportSentMessages2025() {
  const me = "email@example.com";
  const query = "in:sent after:2025/01/01 before:2026/01/01";

  const rows = []; // for the Messages sheet (body truncated for safety)
  const jsonPayload = []; // full data for JSON (body not truncated)
  const batchSize = 500;
  let start = 0;

  while (true) {
    const threads = GmailApp.search(query, start, batchSize);
    if (!threads.length) break;

    for (const thread of threads) {
      const messages = thread.getMessages();
      for (const m of messages) {
        // Only messages you sent in 2025
        const from = m.getFrom() || "";
        const isFromMe = from.toLowerCase().includes(me.toLowerCase());
        if (!isFromMe) continue;

        const d = m.getDate();
        const in2025 =
          d >= new Date("2025-01-01T00:00:00Z") &&
          d < new Date("2026-01-01T00:00:00Z");
        if (!in2025) continue;

        // Gather recipients
        const to = m.getTo() || "";
        const cc = m.getCc() || "";
        const bcc = m.getBcc ? m.getBcc() || "" : "";

        // Exclusion: messages with exactly one recipient and it is either of these addresses
        const allRecipients = [
          ...safeSplitAddresses_(to),
          ...safeSplitAddresses_(cc),
          ...safeSplitAddresses_(bcc),
        ].map((addr) => addr.toLowerCase());

        const uniqueRecipients = Array.from(new Set(allRecipients));
        const isSingleRecipient = uniqueRecipients.length === 1;
        const single = uniqueRecipients[0] || "";
        const skipSingleSelfOrNjogu =
          isSingleRecipient &&
          (single === "edward@storiedinc.com" ||
            single === "njogued@gmail.com");

        if (skipSingleSelfOrNjogu) continue;

        const fullBody = m.getPlainBody() || "";
        const row = {
          subject: m.getSubject() || "",
          from: from,
          to: to,
          cc: cc,
          bcc: bcc,
          date_iso: toIso_(d),
          body_full: truncateForSheet_(fullBody), // safe for Sheets
        };

        rows.push(row);

        // JSON keeps the full body (no truncation)
        jsonPayload.push({
          subject: row.subject,
          from: row.from,
          to: row.to,
          cc: row.cc,
          bcc: row.bcc,
          date_iso: row.date_iso,
          body_full: fullBody,
        });
      }
    }

    start += threads.length;
    if (threads.length < batchSize) break;
  }

  // Sort newest first
  rows.sort((a, b) => (b.date_iso || "").localeCompare(a.date_iso || ""));

  // Write a single sheet named "Messages"
  const ss = SpreadsheetApp.create("Sent Messages 2025");
  writeMessagesSheetOnly_(ss, rows);

  // Write JSON to Drive with full bodies
  const jsonFile = DriveApp.createFile(
    "sent_messages_2025.json",
    JSON.stringify(jsonPayload, null, 2),
    MimeType.PLAIN_TEXT
  );

  Logger.log("Done.");
  Logger.log("Sheet: %s", ss.getUrl());
  Logger.log("JSON:  %s", jsonFile.getUrl());
}

/** Write only the Messages sheet with the requested headers. */
function writeMessagesSheetOnly_(ss, rows) {
  const headers = [
    "subject",
    "from",
    "to",
    "cc",
    "bcc",
    "date_iso",
    "body_full",
  ];
  const sh = ss.getActiveSheet();
  sh.setName("Messages");
  sh.clear();
  sh.appendRow(headers);

  if (rows.length) {
    const values = rows.map((r) => headers.map((h) => r[h] ?? ""));
    sh.getRange(2, 1, values.length, headers.length).setValues(values);
    sh.autoResizeColumns(1, headers.length);
  }
}

/** Split address lists on comma or semicolon and strip display names to bare emails when possible. */
function safeSplitAddresses_(v) {
  if (!v) return [];
  return v
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(extractEmailOnly_);
}

/** Extract just the email if in "Name <email@x.com>" form, otherwise return the token. */
function extractEmailOnly_(s) {
  const m = s.match(/<([^>]+)>/);
  return m && m[1] ? m[1].trim() : s;
}

/** ISO formatter. */
function toIso_(d) {
  if (!d) return "";
  return Utilities.formatDate(
    d,
    Session.getScriptTimeZone() || "UTC",
    "yyyy-MM-dd'T'HH:mm:ssXXX"
  );
}

/**
 * Sheets has a ~50k character hard cap per cell. Keep a safe cushion.
 * If you prefer a different cap, adjust limit.
 */
function truncateForSheet_(str, limit = 48000) {
  if (!str) return "";
  if (str.length <= limit) return str;
  return str.slice(0, limit) + "\n[truncated for sheet due to cell size limit]";
}
