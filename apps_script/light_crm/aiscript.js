// Strict JSON schema: ONLY what you asked for.
const ANALYSIS_SCHEMA = {
  name: "lead_notes_and_actions",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      contacts: {
        type: "object",
        additionalProperties: {
          type: "object",
          additionalProperties: false,
          properties: {
            lead_notes: { type: "array", items: { type: "string" } }
          },
          required: ["lead_notes"]
        }
      },
      top_actions: {
        type: "array",
        maxItems: 5,
        items: { type: "string" }
      }
    },
    required: ["contacts", "top_actions"]
  }
};

function analyzeContactsWithAI() {
  const { apiKey = '' } = getUserSettings();
  const { aiModel = '' } = getUserSettings();
  if (!apiKey) return [];
  // 1) Load your JSON
  const contacts = buildContactEmailsJson();
  // Logger.log(contacts);
  if (Object.keys(contacts).length === 0) {
    Logger.log("No contacts to update")
    return {};
  }
  // 2) Build the prompt with explicit output schema instructions
  const system = "You are a precise AI assistant. Return only valid JSON. No prose.";
  const userPrompt = {
    instruction: "Given per-contact email 'from' (last incoming) and 'to' (recent sent), do the following for each contact: " +
      "1) identify any mentioned lead preferences or notes perhaps on what their work entails; " +
      "2) propose the top next steps (a maximum of 5 but can be fewer) across the leads provided. IMPORTANT: Make sure to mention the specific lead that each of the proposed top next steps pertains to, so that one can understand the lead that the next step applies to. For example: 'Set up a call next week to discuss the proposal (John Smith)' OR 'Follow up with Michael Goodson in November to check if he has raised funding and is ready to kick off our contract'; " +
      "Return valid JSON only, using key-value pairs separated by colon (:)",
    inputs: contacts,
    output_schema: {
      contacts: {
        CONTACT_ID: {
          leads_notes: ["string"],
        }
      }, top_actions: ["string"]
    },
    constraints: [
      "Return JSON only",
      "Be concise and actionable"
    ]
  };

  const url = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: aiModel,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(userPrompt) }
    ],
    temperature: 0.2,
    response_format: { type: "json_schema", json_schema: ANALYSIS_SCHEMA }
  };

  const resp = UrlFetchApp.fetch(url, {
    method: "post",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const txt = resp.getContentText();
  // Logger.log(txt);
  const data = JSON.parse(txt);

  // 3) Extract final JSON content
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content) throw new Error("No content returned from model");
  const result = JSON.parse(content);
  updateAIResult(result);
  return result.top_actions || [];
}

function updateAIResult(result) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_CONTACTS);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2) return;
  const header = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());

  const idx = (name) => {
    const i = header.findIndex(h => h.toLowerCase() === String(name).toLowerCase());
    if (i === -1) throw new Error(`Column "${name}" not found in ${SHEET_CONTACTS}.`);
    return i;
  };

  const iId = idx(CONTACT_HEADERS.ID);
  const iAI = idx(CONTACT_HEADERS.AI_NOTES)

  const idVals = sh.getRange(2, iId + 1, lastRow - 1, 1).getValues().map(r => String(r[0] || '').trim());
  const aiRange = sh.getRange(2, iAI + 1, lastRow - 1, 1);
  const aiVals = aiRange.getValues().map(r => String(r[0] || '').trim());

  const contacts = (result && result.contacts) ? result.contacts : {};
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

  let changed = 0;
  for (let r = 0; r < idVals.length; r++) {
    const cid = idVals[r];
    if (!cid) continue;

    const entry = contacts[cid];
    if (!entry || !Array.isArray(entry.leads_notes)) continue;

    // Normalize notes; skip if empty after trimming.
    const notes = entry.leads_notes.map(s => String(s || '').trim()).filter(Boolean);
    if (notes.length === 0) continue; // explicit: skip empty entries

    const noteBody = notes.join(' | ');
    const existing = aiVals[r];

    // Idempotence: do not append if identical text already exists.
    if (existing && existing.indexOf(noteBody) !== -1) continue;

    const stamped = `[AI ${stamp}] ${noteBody}`;
    aiVals[r] = existing ? (existing + '\n\n' + stamped) : stamped;
    changed++;
  }

  if (changed > 0) {
    // Write back ONLY the AI Notes column.
    aiRange.setValues(aiVals.map(v => [v]));
  }
}

function buildContactEmailsJson() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_CONTACTS);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return {};

  const header = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const idx = (name) => {
    const i = header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    if (i === -1) throw new Error(`Column "${name}" not found in "${CONFIG.SHEET_NAME}".`);
    return i;
  };

  const iId = idx(CONTACT_HEADERS.ID);
  const iFrom = idx(CONTACT_HEADERS.LAST_INCOMING);
  const iTo = idx(CONTACT_HEADERS.RECENT_EMAIL);
  const iLastCt = idx(CONTACT_HEADERS.LAST_CONTACTED)
  const today = new Date();

  const data = sh.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const out = {};
  for (const row of data) {
    const lastCt = new Date(row[iLastCt]);
    if (
      lastCt.getFullYear() === today.getFullYear() &&
      lastCt.getMonth() === today.getMonth() &&
      lastCt.getDate() === today.getDate()
    ) {
      const cid = String(row[iId] ?? '').trim();
      if (!cid) continue; // skip rows without Contact ID
      const fromTxt = String(row[iFrom] ?? '').trim();
      const toTxt = String(row[iTo] ?? '').trim();
      out[cid] = { from: fromTxt, to: toTxt };
    }
    // const cid = String(row[iId] ?? '').trim();
    // if (!cid) continue; // skip rows without Contact ID
    // const fromTxt = String(row[iFrom] ?? '').trim();
    // const toTxt = String(row[iTo] ?? '').trim();
    // out[cid] = { from: fromTxt, to: toTxt };
  }
  // Logger.log(out);
  return out;
}

function retryJsonFix_(apiKey, schema, badContent) {
  const repairPayload = {
    model: CFG.AI_MODEL,
    messages: [
      { role: "system", content: "Your previous output was invalid. Reformat EXACTLY to the provided JSON schema. No prose." },
      { role: "user", content: JSON.stringify({ schema_hint: schema, invalid_output: String(badContent).slice(0, 12000) }) }
    ],
    temperature: 0,
    response_format: { type: "json_schema", json_schema: schema }
  };
  const resp = callOpenAI_(apiKey, repairPayload);
  const fixed = resp?.choices?.[0]?.message?.content;
  return JSON.parse(fixed);
}