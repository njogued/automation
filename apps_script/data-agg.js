/**
 * ════════════════════════════════════════════════════════════════════════════════
 * APPMAGIC DATA AGGREGATION PIPELINE - YEAR SPLIT EDITION (2024 vs 2025)
 * ════════════════════════════════════════════════════════════════════════════════
 * * LOGIC:
 * 1. CSV PROCESSING: Converts raw CSVs into "Month_YYYY-MM" cache spreadsheets.
 * 2. AGGREGATION: Combines cache sheets into two final destinations:
 * - 2024 (and older) -> Primary Spreadsheet
 * - 2025 (and newer) -> Secondary Spreadsheet
 * * MAIN FUNCTIONS:
 * - fullAggregation()                  → Step 1: Process CSVs to Cache
 * - startAggregation()                 → Step 2: Start combining data (Resets progress)
 * - continueAggregation()              → Step 3: Resume if timed out
 * - runFullAggregationWithAutoResume() → Run Step 3 repeatedly automatically
 * - resetAggregation()                 → Wipes final data sheets to start over
 */

// ════════════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════════
const CONFIG = {
  // ========== GOOGLE DRIVE & SHEETS ==========
  ROOT_FOLDER_ID: "1Hbr0tAE5iekr4AwXXliqxxZNLR5U_w10",
  // 2024 DATA (Primary)
  TARGET_SS_ID: "192xNbih1c4zCO4fXiS0UL9J0LcmbkeyeJuO6hGj26aI",
  // 2025 DATA (Secondary)
  OVERFLOW_SS_ID: "11o4alHk_ykWzAh0U3I1EF9SgwPHDlEGUelNraItFtD0",
  CACHE_FOLDER_NAME: "AppMagic Monthly Cache",
  // ========== OUTPUT SHEETS ==========
  FINAL_SHEET: "CombinedData",
  TRACKING_SHEET: "Processing Log",
  PROGRESS_SHEET: "Aggregation Progress",
  MONTHLY_SHEET_PREFIX: "Month_",
  // ========== DATA FILTERING ==========
  PROCESS_TYPES: ["top grossing"], // ['top free', 'top grossing'] or ['all']
  // ========== PERFORMANCE ==========
  BATCH_SIZE: 10000, // CSV processing batch size
  AGG_BATCH_SIZE: 5000, // Aggregation batch size
  LOG_INTERVAL: 1000,
  ENABLE_VERBOSE_LOGS: true,
  MAX_EXECUTION_TIME: 250000, // ~4 mins (safe buffer before 6 min limit)
  MAX_AUTO_RESUME_ITERATIONS: 20,
  // ========== DEDUPLICATION ==========
  ENABLE_DEDUPLICATION: true,
  DEDUP_KEY_COLUMNS: [0, 1, 3], // Month, Country, Application Name
};

// ════════════════════════════════════════════════════════════════════════════════
// 📋 DATA SCHEMA
// ════════════════════════════════════════════════════════════════════════════════
const SCHEMA = {
  HEADERS: [
    "Month",
    "Country",
    "Type",
    "Application Name",
    "Publisher",
    "Revenue",
    "tagsGames",
    "Freecash Revenue",
    "Rank",
  ],
  COL_MONTH: 0,
  COL_COUNTRY: 1,
  COL_APP_NAME: 3,
};

// ════════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN AGGREGATION FUNCTIONS (YEAR SPLIT LOGIC)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * 1. Start new aggregation
 * Initializes both spreadsheets and queues up all monthly cache files.
 */
function startAggregation() {
  const startTime = Date.now();
  log_("\n" + "═".repeat(80));
  log_("    STARTING AGGREGATION (YEAR SPLIT: 2024 vs 2025)");
  log_("═".repeat(80) + "\n");
  try {
    const targetSS = SpreadsheetApp.openById(CONFIG.TARGET_SS_ID); // 2024
    const overflowSS = SpreadsheetApp.openById(CONFIG.OVERFLOW_SS_ID); // 2025
    const cacheFolder = getOrCreateCacheFolder_();

    const cacheFiles = getMonthlyCache_Files(cacheFolder);
    log_(`✓ Found ${cacheFiles.length} monthly cache spreadsheets\n`);

    if (cacheFiles.length === 0) {
      log_("⚠️  No monthly cache sheets found! Run fullAggregation() first.");
      return;
    }

    // --- Initialize 2024 Sheet ---
    const sheet2024 = getOrCreateSheet_(targetSS, CONFIG.FINAL_SHEET, [
      SCHEMA.HEADERS,
    ]);
    if (sheet2024.getLastRow() <= 1) clearBelowHeader_(sheet2024);
    log_("✓ 2024 Sheet initialized");

    // --- Initialize 2025 Sheet ---
    const sheet2025 = getOrCreateSheet_(overflowSS, CONFIG.FINAL_SHEET, [
      SCHEMA.HEADERS,
    ]);
    if (sheet2025.getLastRow() <= 1) clearBelowHeader_(sheet2025);
    log_("✓ 2025 Sheet initialized");

    // --- Initialize Progress Tracking ---
    const progressSheet = getOrCreateSheet_(targetSS, CONFIG.PROGRESS_SHEET, [
      [
        "Cache File ID",
        "Cache File Name",
        "Month Key",
        "Total Rows",
        "Rows Processed",
        "Last Row Index",
        "Status",
        "Target Destination",
        "Last Updated",
      ],
    ]);
    clearBelowHeader_(progressSheet);

    const progressData = [];
    for (const file of cacheFiles) {
      try {
        const monthKey = extractMonthKeyFromFileName_(file.getName());
        // sample output -> "2025-05"

        // Determine Year Destination immediately
        // Logic: If year is 2025, goes to Secondary. Else (2024, 2023...) goes to Primary.
        const year = parseInt(monthKey.split("-")[0]);
        const destination = year === 2025 ? "2025_Secondary" : "2024_Primary";

        progressData.push([
          file.getId(),
          file.getName(),
          monthKey,
          0, // Placeholder for Total Rows (we lazy load this to speed up init)
          0,
          1,
          "pending",
          destination,
          new Date(),
        ]);
      } catch (e) {
        log_(`  ❌ Error reading ${file.getName()}: ${e.message}`);
      }
    }

    if (progressData.length > 0) {
      progressSheet
        .getRange(2, 1, progressData.length, 9)
        .setValues(progressData);
      SpreadsheetApp.flush(); // Ensure data is written
    }

    log_(`\n✓ Queued ${progressData.length} files for processing.`);
    log_("═".repeat(80));

    // Start processing immediately
    continueAggregation();
  } catch (e) {
    log_(`\n❌ ERROR: ${e.message}\nStack: ${e.stack}`);
  }
}

/**
 * 2. Continue aggregation
 * Resumes from the Progress Sheet. Uses Year logic to route data.
 */
function continueAggregation() {
  const startTime = Date.now();
  const targetSS = SpreadsheetApp.openById(CONFIG.TARGET_SS_ID); // 2024
  const overflowSS = SpreadsheetApp.openById(CONFIG.OVERFLOW_SS_ID); // 2025
  const progressSheet = targetSS.getSheetByName(CONFIG.PROGRESS_SHEET);
  if (!progressSheet) {
    log_("❌ No progress sheet found. Please run startAggregation() first.");
    return;
  }
  const lastRow = progressSheet.getLastRow();
  if (lastRow <= 1) {
    log_("✓ No pending files found in progress sheet.");
    return;
  }
  const progressData = progressSheet.getRange(2, 1, lastRow - 1, 9).getValues();
  // Get Data Sheets
  const sheet2024 = targetSS.getSheetByName(CONFIG.FINAL_SHEET);
  const sheet2025 = overflowSS.getSheetByName(CONFIG.FINAL_SHEET);
  let allComplete = true;
  for (let i = 0; i < progressData.length; i++) {
    const row = progressData[i];
    const [
      fileId,
      fileName,
      monthKey,
      totalRowsDisplay,
      rowsProcessed,
      lastRowIndex,
      status,
      destination,
    ] = row;

    if (status === "completed") continue;

    if (Date.now() - startTime > CONFIG.MAX_EXECUTION_TIME) {
      log_("\n⏰ Time limit reached. Pausing for next execution...");
      allComplete = false;
      break;
    }

    log_(`\nProcessing: ${fileName} -> [${destination}]`);

    // Select Target Sheet
    let targetSheet = destination === "2025_Secondary" ? sheet2025 : sheet2024;

    try {
      const cacheSS = SpreadsheetApp.openById(fileId);
      const cacheSheet = cacheSS.getSheets()[0];
      const cacheTotalRows = cacheSheet.getLastRow();

      // Update total rows in log if not set
      if (totalRowsDisplay == 0) {
        progressSheet.getRange(i + 2, 4).setValue(cacheTotalRows - 1);
      }

      let currentReadRow = parseInt(lastRowIndex) || 1;
      let currentProcessed = parseInt(rowsProcessed) || 0;

      // Batch Processing Loop
      while (currentReadRow < cacheTotalRows) {
        if (Date.now() - startTime > CONFIG.MAX_EXECUTION_TIME) {
          log_("  ⏰ Timeout during file processing. Saving state...");
          allComplete = false;
          break;
        }

        const rowsRemaining = cacheTotalRows - currentReadRow;
        const batchSize = Math.min(CONFIG.AGG_BATCH_SIZE, rowsRemaining);

        // Read Batch
        const values = cacheSheet
          .getRange(currentReadRow + 1, 1, batchSize, SCHEMA.HEADERS.length)
          .getValues();

        if (values.length > 0) {
          const destLastRow = targetSheet.getLastRow();
          targetSheet
            .getRange(destLastRow + 1, 1, values.length, SCHEMA.HEADERS.length)
            .setValues(values);

          currentReadRow += batchSize;
          currentProcessed += values.length;

          // Update Progress
          progressSheet.getRange(i + 2, 5).setValue(currentProcessed);
          progressSheet.getRange(i + 2, 6).setValue(currentReadRow);
          progressSheet.getRange(i + 2, 7).setValue("in_progress");
          progressSheet.getRange(i + 2, 9).setValue(new Date());
          SpreadsheetApp.flush();

          log_(
            `  ✓ Wrote ${
              values.length
            } rows to ${destination} (${currentProcessed}/${
              cacheTotalRows - 1
            })`
          );
        }
      }

      if (currentReadRow >= cacheTotalRows) {
        progressSheet.getRange(i + 2, 7).setValue("completed");
        progressSheet.getRange(i + 2, 9).setValue(new Date());
        log_(`  ✅ File Complete: ${fileName}`);
      } else {
        allComplete = false;
        break;
      }
    } catch (e) {
      log_(`  ❌ Error on ${fileName}: ${e.message}`);
      progressSheet.getRange(i + 2, 7).setValue("error");
    }
  }
  log_("\n" + "═".repeat(80));
  if (allComplete) {
    log_("🎉 AGGREGATION COMPLETE!");
    log_("2024 Data -> Primary Spreadsheet");
    log_("2025 Data -> Secondary Spreadsheet");
  } else {
    log_("⏸️  PAUSED. Run continueAggregation() again to resume.");
  }
}

/**
 * 3. Auto-Resume Wrapper
 */
function runFullAggregationWithAutoResume() {
  let iteration = 0;
  while (iteration < CONFIG.MAX_AUTO_RESUME_ITERATIONS) {
    iteration++;
    log_(
      `\n🔄 Auto-Resume Iteration ${iteration}/${CONFIG.MAX_AUTO_RESUME_ITERATIONS}`
    );

    // Check if done
    const progressSS = SpreadsheetApp.openById(CONFIG.TARGET_SS_ID);
    const sheet = progressSS.getSheetByName(CONFIG.PROGRESS_SHEET);

    let isPending = false;
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 7, sheet.getLastRow() - 1, 1).getValues(); // Status column
      isPending = data.some((r) => r[0] !== "completed" && r[0] !== "error");
    }

    if (!isPending && iteration > 1) {
      log_("✓ All tasks marked completed.");
      break;
    }

    continueAggregation();

    if (isPending) Utilities.sleep(2000);
  }
}

/**
 * 4. RESET FUNCTION (Fixed - No UI)
 */
function resetAggregation() {
  log_("\n⚠️  RESETTING AGGREGATION DESTINATIONS...\n");
  // 1. Clear 2024 (Primary)
  try {
    const ss2024 = SpreadsheetApp.openById(CONFIG.TARGET_SS_ID);
    const sheet24 = ss2024.getSheetByName(CONFIG.FINAL_SHEET);
    if (sheet24) {
      sheet24.clear();
      sheet24.appendRow(SCHEMA.HEADERS);
      sheet24.setFrozenRows(1);
      log_("✓ Cleared 2024 Primary Sheet.");
    }

    const progSheet = ss2024.getSheetByName(CONFIG.PROGRESS_SHEET);
    if (progSheet) {
      progSheet.clear();
      log_("✓ Cleared Progress Log.");
    }
  } catch (e) {
    log_(`❌ Error clearing 2024: ${e.message}`);
  }

  // 2. Clear 2025 (Secondary)
  try {
    const ss2025 = SpreadsheetApp.openById(CONFIG.OVERFLOW_SS_ID);
    const sheet25 = ss2025.getSheetByName(CONFIG.FINAL_SHEET);
    if (sheet25) {
      sheet25.clear();
      sheet25.appendRow(SCHEMA.HEADERS);
      sheet25.setFrozenRows(1);
      log_("✓ Cleared 2025 Secondary Sheet.");
    }
  } catch (e) {
    log_(`❌ Error clearing 2025: ${e.message}`);
  }
  log_("\n✅ Reset Complete. Run startAggregation() to begin fresh.");
}

// ════════════════════════════════════════════════════════════════════════════════
// 📂 CSV PROCESSING (Step 1)
// ════════════════════════════════════════════════════════════════════════════════
/**
 * Full CSV processing: Convert CSV files to monthly cache spreadsheets
 */
function fullAggregation() {
  const totalStart = Date.now();
  log_("\n" + "═".repeat(80));
  log_("    APPMAGIC CSV PROCESSOR");
  log_("═".repeat(80) + "\n");
  try {
    const targetSS = SpreadsheetApp.openById(CONFIG.TARGET_SS_ID);
    const cacheFolder = getOrCreateCacheFolder_();
    const trackSheet = getOrCreateSheet_(targetSS, CONFIG.TRACKING_SHEET, [
      [
        "File Name",
        "Month Key",
        "Country",
        "Type",
        "Rows Processed",
        "Cache Sheet Name",
        "Cache Sheet ID",
        "Cache Sheet URL",
        "Date Processed",
      ],
    ]);

    log_("🔍 Scanning for CSV files...\n");
    const csvFiles = findAllCsvFiles_(
      DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID)
    );
    log_(`✓ Found ${csvFiles.length} CSV files\n`);

    const processedFiles = loadProcessedFiles_(trackSheet);

    for (let i = 0; i < csvFiles.length; i++) {
      const file = csvFiles[i];
      const fileName = file.getName();

      log_(`\n[${i + 1}/${csvFiles.length}] Processing: ${fileName}`);

      if (processedFiles.has(fileName)) {
        log_("  ⏭️  SKIP: Already processed");
        continue;
      }

      try {
        const csvText = file.getBlob().getDataAsString();
        const result = processCsvFile_(file, csvText, cacheFolder);

        if (result.rows > 0) {
          trackSheet.appendRow([
            fileName,
            result.monthKey,
            result.country,
            result.type,
            result.rows,
            result.cacheSheetName,
            result.cacheSheetId,
            result.cacheSheetUrl,
            new Date(),
          ]);

          log_(
            `  ✅ Success: ${result.rows.toLocaleString()} rows → ${
              result.cacheSheetName
            }`
          );
        } else {
          log_("  ⚠️  No data extracted (check TYPE filter)");
        }
      } catch (e) {
        log_(`  ❌ ERROR: ${e.message}`);
        log_(`     Stack: ${e.stack}`);
      }
    }

    const totalElapsed = (Date.now() - totalStart) / 1000;
    log_("\n" + "═".repeat(80));
    log_(`    CSV PROCESSING COMPLETE (${totalElapsed.toFixed(1)}s)`);
    log_("═".repeat(80) + "\n");
  } catch (e) {
    log_(`\n❌ FATAL ERROR: ${e.message}`);
    throw e;
  }
}

function processCsvFile_(file, csvText, cacheFolder) {
  // 1. Parse Rows
  const rows = parseCsvText_(csvText);
  logVerbose_(`  Parsed ${rows.length} raw rows`);
  // 2. Extract Metadata (Month & Country)
  const meta = extractMetaFromCsv_(rows);
  if (!meta) {
    throw new Error("Could not extract DATE and GEOGRAPHY from CSV");
  }
  logVerbose_(`  Metadata: ${meta.monthKey}, ${meta.country}`);
  // 3. Find Headers
  const headerIdx = findHeaderIndex_(rows);
  if (headerIdx < 0) {
    throw new Error('Could not find header row (looking for "top" and "type")');
  }
  const headerRow = rows[headerIdx];
  const colMap = buildColumnMap_(headerRow);
  // 4. Validate Columns
  const requiredCols = ["type", "application_name", "publisher_name", "value"];
  for (let col of requiredCols) {
    if (colMap[col] == null) throw new Error(`Missing required column: ${col}`);
  }
  // 5. Get Cache Sheet
  const cacheInfo = getOrCreateMonthCacheSpreadsheet_(
    cacheFolder,
    meta.monthKey
  );
  const cacheSS = SpreadsheetApp.openById(cacheInfo.id);
  const cacheSheet = cacheSS.getSheets()[0];
  if (cacheSheet.getLastRow() === 0) {
    cacheSheet
      .getRange(1, 1, 1, SCHEMA.HEADERS.length)
      .setValues([SCHEMA.HEADERS]);
    cacheSheet.setFrozenRows(1);
  }
  // 6. Process Data Rows
  const dataRows = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const type = String(row[colMap["type"]] || "")
      .trim()
      .toLowerCase();

    const shouldProcess =
      CONFIG.PROCESS_TYPES.includes("all") ||
      CONFIG.PROCESS_TYPES.includes(type);
    if (!shouldProcess) continue;

    const appName = String(row[colMap["application_name"]] || "").trim();
    const publisher = String(row[colMap["publisher_name"]] || "").trim();
    const revenue = safeNumber_(row[colMap["value"]]);
    const rank = safeInt_(row[colMap["top"]]);
    const tagsGames = String(row[colMap["tagsgames"]] || "").trim();

    let freecashRevenue = null;
    if (colMap["freecash revenue"] != null) {
      freecashRevenue = safeNumber_(row[colMap["freecash revenue"]]);
    } else if (colMap["freecash_revenue"] != null) {
      freecashRevenue = safeNumber_(row[colMap["freecash_revenue"]]);
    }

    // Force format YYYY-MM-01
    const monthFormatted = `${meta.monthKey}-01`;

    dataRows.push([
      monthFormatted,
      meta.country,
      capitalizeType_(type),
      appName,
      publisher,
      revenue,
      tagsGames,
      freecashRevenue,
      rank,
    ]);
  }
  // 7. Write to Cache (Batched)
  if (dataRows.length > 0) {
    let written = 0;
    while (written < dataRows.length) {
      const batchSize = Math.min(CONFIG.BATCH_SIZE, dataRows.length - written);
      const batch = dataRows.slice(written, written + batchSize);
      const nextRow = cacheSheet.getLastRow() + 1;
      cacheSheet
        .getRange(nextRow, 1, batch.length, SCHEMA.HEADERS.length)
        .setValues(batch);
      written += batchSize;
    }
    SpreadsheetApp.flush();
  }
  return {
    rows: dataRows.length,
    monthKey: meta.monthKey,
    country: meta.country,
    type: CONFIG.PROCESS_TYPES.join(", "),
    cacheSheetName: cacheInfo.name,
    cacheSheetId: cacheInfo.id,
    cacheSheetUrl: cacheInfo.url,
  };
}

// ════════════════════════════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

function log_(msg) {
  Logger.log(msg);
}
function logVerbose_(msg) {
  if (CONFIG.ENABLE_VERBOSE_LOGS) Logger.log(msg);
}

function findAllCsvFiles_(folder) {
  const csvFiles = [];
  const CSV_MIMES = [
    "text/csv",
    "text/comma-separated-values",
    "application/vnd.ms-excel",
  ];
  function scanFolder(currentFolder) {
    const files = currentFolder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const mime = file.getMimeType();
      const name = file.getName().toLowerCase();
      if (CSV_MIMES.includes(mime) || name.endsWith(".csv")) {
        csvFiles.push(file);
      }
    }
    const subfolders = currentFolder.getFolders();
    while (subfolders.hasNext()) {
      const subfolder = subfolders.next();
      if (subfolder.getName() !== CONFIG.CACHE_FOLDER_NAME) {
        scanFolder(subfolder);
      }
    }
  }
  scanFolder(folder);
  return csvFiles;
}

function getOrCreateCacheFolder_() {
  const rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const existing = rootFolder.getFoldersByName(CONFIG.CACHE_FOLDER_NAME);
  return existing.hasNext()
    ? existing.next()
    : rootFolder.createFolder(CONFIG.CACHE_FOLDER_NAME);
}

function getOrCreateMonthCacheSpreadsheet_(cacheFolder, monthKey) {
  const fileName = `${CONFIG.MONTHLY_SHEET_PREFIX}${monthKey}`;
  const fileIter = cacheFolder.getFilesByName(fileName);
  if (fileIter.hasNext()) {
    const file = fileIter.next();
    return { id: file.getId(), url: file.getUrl(), name: file.getName() };
  }
  const ss = SpreadsheetApp.create(fileName);
  const file = DriveApp.getFileById(ss.getId());
  cacheFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return { id: ss.getId(), url: ss.getUrl(), name: fileName };
}

function getMonthlyCache_Files(cacheFolder) {
  const cacheFiles = [];
  const filesIter = cacheFolder.getFiles();
  while (filesIter.hasNext()) {
    const file = filesIter.next();
    if (
      file.getMimeType() === "application/vnd.google-apps.spreadsheet" &&
      file.getName().startsWith(CONFIG.MONTHLY_SHEET_PREFIX)
    ) {
      cacheFiles.push(file);
    }
  }
  cacheFiles.sort((a, b) => a.getName().localeCompare(b.getName()));
  return cacheFiles;
}

function extractMonthKeyFromFileName_(fileName) {
  const match = fileName.match(/Month_(\d{4}-\d{2})/);
  return match ? match[1] : "";
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
      sheet.setFrozenRows(1);
    }
  } else if (sheet.getLastRow() === 0 && headers) {
    sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clearBelowHeader_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getMaxColumns()).clearContent();
  }
}

function loadProcessedFiles_(trackSheet) {
  const processed = new Set();
  const lastRow = trackSheet.getLastRow();
  if (lastRow > 1) {
    const data = trackSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    data.forEach((row) => {
      if (row[0]) processed.add(String(row[0]).trim());
    });
  }
  return processed;
}

// --- Parsing Helpers ---
function parseCsvText_(text) {
  text = trimBOM_(text);
  let rows = Utilities.parseCsv(text);
  if (rows && rows[0] && rows[0].length === 1)
    rows = Utilities.parseCsv(text, ";");
  if (!rows) rows = [];
  if (rows.length && rows[0].length) rows[0][0] = trimBOM_(rows[0][0]);
  return rows;
}

function trimBOM_(str) {
  return typeof str === "string" ? str.replace(/^\uFEFF/, "") : str;
}

function extractMetaFromCsv_(rows) {
  let monthRaw = "",
    country = "";
  const searchLimit = Math.min(rows.length, 30);
  for (let i = 0; i < searchLimit; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    let col0 = String(row[0] || "")
      .trim()
      .toUpperCase();
    const col1 = String(row[1] || "").trim();

    if (col0.startsWith("DATE")) {
      monthRaw = col1
        ? col1
        : col0.includes(":")
        ? col0.split(":")[1].trim()
        : "";
    } else if (col0.startsWith("GEOGRAPH")) {
      country = col1
        ? col1
        : col0.includes(":")
        ? col0.split(":")[1].trim()
        : "";
    }
    if (monthRaw && country) break;
  }
  if (!monthRaw || !country) return null;
  // Parse Month
  const match = String(monthRaw)
    .trim()
    .match(/^(\d{4})[-\/](\d{2})/);
  const monthKey = match ? `${match[1]}-${match[2]}` : "";
  if (!monthKey) {
    const d = new Date(monthRaw);
    if (!isNaN(d))
      return { monthKey: Utilities.formatDate(d, "GMT", "yyyy-MM"), country };
  }
  return monthKey ? { monthKey, country } : null;
}

function findHeaderIndex_(rows) {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].length >= 2) {
      const c0 = String(rows[i][0] || "")
        .trim()
        .toLowerCase();
      const c1 = String(rows[i][1] || "")
        .trim()
        .toLowerCase();
      if (c0 === "top" && c1 === "type") return i;
    }
  }
  return -1;
}

function buildColumnMap_(headerRow) {
  const map = {};
  headerRow.forEach((h, i) => {
    if (h) map[String(h).trim().toLowerCase()] = i;
  });
  return map;
}

function capitalizeType_(type) {
  return type
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function safeNumber_(val) {
  if (val == null || val === "") return null;
  const num = Number(String(val).replace(/,/g, ""));
  return isFinite(num) ? num : null;
}

function safeInt_(val) {
  if (val == null || val === "") return null;
  const num = parseInt(String(val).replace(/[^\d-]/g, ""), 10);
  return isFinite(num) ? num : null;
}

// Putting Appmagic Data Together
// This script takes the last two months of your internal game revenue data (Amplitude) and external market data as input.
// As output, it automatically creates a new "Monthly Snapshot" spreadsheet that reports on your market share by country and lists specific high-revenue games you are currently missing for that period.
/**
 * ============================================================================
 * MONTHLY SNAPSHOT SCRIPT - V1.1 (OPTIMIZED WITH PROGRESS LOGGING)
 * ============================================================================
 * Processes only the last 2 months of data and creates a new spreadsheet
 * with the results. Designed to run quickly for recent data analysis.
 *
 * Usage: Run GENERATE_MONTHLY_SNAPSHOT() to create a new report
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
const MONTHLY_SNAPSHOT_PREFIX = "Market_Insights_Monthly_Snapshot_";
const MONTHLY_BATCH_SIZE = 10000; // Increased for faster processing
const MONTHLY_WRITE_CHUNK_SIZE = 2000;
const MONTHLY_INTER_CHUNK_SLEEP = 500;
const MONTHLY_LOG_EVERY_ROWS = 50000; // Log progress every N rows

// Output folder ID (optional - leave empty to create in root)
const MONTHLY_OUTPUT_FOLDER_ID = "";

// ============================================================================
// LITE COUNTRIES (same as main script)
// ============================================================================
const MONTHLY_LITE_COUNTRIES = [
  "United States",
  "Germany",
  "United Kingdom",
  "Canada",
  "France",
  "Australia",
  "Netherlands",
  "Italy",
  "Poland",
  "Austria",
  "Sweden",
  "Belgium",
  "Switzerland",
  "Japan",
  "South Korea",
];

// ============================================================================
// HEADERS
// ============================================================================
const MONTHLY_MAIN_HEADERS = [
  "Month",
  "Country",
  "Type",
  "Application Name",
  "Publisher",
  "Revenue",
  "tagsGames",
  "Freecash Revenue",
  "Rank",
  "Live on Freecash",
  "Live Market Share %",
  "Unlockable Market Share %",
  "Unreachable Market Share %",
  "Freecash Market Capture Rate %",
  "Missed Revenue Opportunity",
  "Country Tier",
  "Partnership Status",
];

const MONTHLY_SHARE_HEADERS = [
  "Country",
  "Month",
  "Total Market Revenue",
  "Live Revenue",
  "Reachable Revenue",
  "Live Share %",
  "Reachable Share %",
  "Unlockable Share %",
  "Live Games Count",
  "Total Games Count",
];

const MONTHLY_MISSING_HEADERS = [
  "Publisher",
  "Application Name",
  "Country",
  "Month",
  "AppMagic Revenue",
  "Rank",
  "tagsGames",
];

/**
 * ============================================================================
 * MAIN ENTRY POINT
 * ============================================================================
 */
function GENERATE_MONTHLY_SNAPSHOT() {
  const startTime = Date.now();
  Logger.log("═══════════════════════════════════════════════════════════");
  Logger.log("📊 MONTHLY SNAPSHOT GENERATOR V1.1");
  Logger.log("═══════════════════════════════════════════════════════════");
  try {
    // 1. Determine the last 2 months
    const targetMonths = getLastTwoMonths_();
    Logger.log(
      `\n📅 Target months: ${targetMonths.map((m) => m.label).join(", ")}`
    );

    // 2. Create output spreadsheet
    Logger.log("\n📁 Creating output spreadsheet...");
    const outputSs = createMonthlyOutputSpreadsheet_(targetMonths);
    const outputUrl = outputSs.getUrl();
    const outputId = outputSs.getId();

    Logger.log(`   ✓ Created: ${outputUrl}`);

    // 3. Load Amplitude data
    Logger.log("\n📥 Loading Amplitude data...");
    const ampStart = Date.now();
    const amplitudeData = loadAmplitudeDataForMonths_(targetMonths);
    Logger.log(
      `   ✓ Loaded ${amplitudeData.length.toLocaleString()} records in ${(
        (Date.now() - ampStart) /
        1000
      ).toFixed(1)}s`
    );

    // 4. Load mapping table
    Logger.log("\n📥 Loading game mapping table...");
    const manualMap = loadMappingTableMonthly_();
    Logger.log(`   ✓ Loaded ${manualMap.size} game mappings`);

    // 5. Process AppMagic data
    Logger.log("\n⚙️ Processing AppMagic data...");
    const processStart = Date.now();
    const enrichedData = processAppMagicForMonths_(
      targetMonths,
      amplitudeData,
      manualMap
    );
    Logger.log(
      `   ✓ Enriched ${enrichedData.length.toLocaleString()} rows in ${(
        (Date.now() - processStart) /
        1000
      ).toFixed(1)}s`
    );

    if (enrichedData.length === 0) {
      Logger.log("\n⚠️ No data found for the target months!");
      Logger.log("   Check that AppMagic data exists for these months.");
      return outputUrl;
    }

    // 6. Generate output sheets
    Logger.log("\n📝 Generating output sheets...");

    Logger.log("   Creating Main sheet...");
    const mainStart = Date.now();
    generateMainSheetMonthly_(outputSs, enrichedData);
    Logger.log(
      `   ✓ Main sheet done in ${((Date.now() - mainStart) / 1000).toFixed(1)}s`
    );

    Logger.log("   Creating Share Analysis sheet...");
    generateShareSheetMonthly_(outputSs, enrichedData);
    Logger.log("   ✓ Share Analysis done");

    Logger.log("   Creating Missing Opportunities sheet...");
    generateMissingSheetMonthly_(outputSs, enrichedData);
    Logger.log("   ✓ Missing Opportunities done");

    // Update log status
    updateOutputLogStatus_(outputSs, "Complete");

    // 7. Log summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    Logger.log("\n═══════════════════════════════════════════════════════════");
    Logger.log(`✅ MONTHLY SNAPSHOT COMPLETE in ${elapsed}s`);
    Logger.log("═══════════════════════════════════════════════════════════");
    Logger.log(`\n📊 REPORT READY: ${outputUrl}`);
    Logger.log(`\n📈 SUMMARY:`);
    Logger.log(`   • Months: ${targetMonths.map((m) => m.label).join(", ")}`);
    Logger.log(`   • Total rows: ${enrichedData.length.toLocaleString()}`);
    Logger.log("═══════════════════════════════════════════════════════════");

    // 8. Log to tracking sheet
    logSnapshotCreation_(
      outputId,
      outputUrl,
      targetMonths,
      enrichedData.length
    );

    return outputUrl;
  } catch (e) {
    Logger.log("\n❌❌❌ ERROR ❌❌❌");
    Logger.log(`Error: ${e.message}`);
    Logger.log(`Stack: ${e.stack}`);
    throw e;
  }
}

/**
 * ============================================================================
 * DATE UTILITIES
 * ============================================================================
 */

function getLastTwoMonths_() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const months = [];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // Last month (current - 1)
  let month1 = currentMonth - 1;
  let year1 = currentYear;
  if (month1 < 0) {
    month1 = 11;
    year1 = currentYear - 1;
  }
  // Month before last (current - 2)
  let month2 = currentMonth - 2;
  let year2 = currentYear;
  if (month2 < 0) {
    month2 = month2 + 12;
    year2 = currentYear - 1;
  }
  // Add in chronological order (older first)
  months.push({
    year: year2,
    month: month2 + 1,
    monthKey: `${year2}-${String(month2 + 1).padStart(2, "0")}`,
    label: `${monthNames[month2]} ${year2}`,
    startDate: new Date(year2, month2, 1),
    endDate: new Date(year2, month2 + 1, 0),
  });
  months.push({
    year: year1,
    month: month1 + 1,
    monthKey: `${year1}-${String(month1 + 1).padStart(2, "0")}`,
    label: `${monthNames[month1]} ${year1}`,
    startDate: new Date(year1, month1, 1),
    endDate: new Date(year1, month1 + 1, 0),
  });
  return months;
}

function getYearsForMonths_(targetMonths) {
  const years = new Set();
  targetMonths.forEach((m) => years.add(m.year));
  return Array.from(years).sort();
}

/**
 * ============================================================================
 * SPREADSHEET CREATION
 * ============================================================================
 */

function createMonthlyOutputSpreadsheet_(targetMonths) {
  const monthLabels = targetMonths.map((m) => m.monthKey).join("_");
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd_HHmmss"
  );
  const name = `${MONTHLY_SNAPSHOT_PREFIX}${monthLabels}_${timestamp}`;
  const ss = SpreadsheetApp.create(name);
  const defaultSheet = ss.getSheets()[0];
  defaultSheet.setName("Main");
  ss.insertSheet("Share_Analysis");
  ss.insertSheet("Missing_Opportunities");
  ss.insertSheet("_Log");
  const logSheet = ss.getSheetByName("_Log");
  logSheet.getRange("A1:B1").setValues([["Property", "Value"]]);
  logSheet.getRange("A2:B6").setValues([
    ["Created", new Date()],
    ["Months Covered", targetMonths.map((m) => m.label).join(", ")],
    ["Month Keys", targetMonths.map((m) => m.monthKey).join(", ")],
    ["Script Version", "Monthly Snapshot V1.1"],
    ["Status", "Processing..."],
  ]);
  logSheet.getRange("A1:B1").setFontWeight("bold");
  if (MONTHLY_OUTPUT_FOLDER_ID) {
    try {
      const file = DriveApp.getFileById(ss.getId());
      const folder = DriveApp.getFolderById(MONTHLY_OUTPUT_FOLDER_ID);
      folder.addFile(file);
      DriveApp.getRootFolder().removeFile(file);
    } catch (e) {
      Logger.log(`   ⚠️ Could not move to folder: ${e.message}`);
    }
  }
  return ss;
}

/**
 * ============================================================================
 * DATA LOADING
 * ============================================================================
 */

function loadAmplitudeDataForMonths_(targetMonths) {
  const targetMonthKeys = new Set(targetMonths.map((m) => m.monthKey));
  const ss = SpreadsheetApp.openById(AMPLITUDE_SS_ID);
  const sheet = ss.getSheetByName(AMPLITUDE_SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (values.length < AMPLITUDE_HEADER_ROW) {
    throw new Error("Amplitude sheet empty");
  }
  const headers = values[AMPLITUDE_HEADER_ROW - 1];
  const monthHeaders = headers.slice(AMPLITUDE_FIRST_MONTH_COL);
  const result = [];
  for (let i = AMPLITUDE_HEADER_ROW; i < values.length; i++) {
    const row = values[i];
    const game = String(row[AMPLITUDE_COL_GAME] || "").trim();
    const country = String(row[AMPLITUDE_COL_COUNTRY] || "").trim();
    if (!game || !country) continue;

    for (let j = 0; j < monthHeaders.length; j++) {
      const revenue = parseFloat(row[AMPLITUDE_FIRST_MONTH_COL + j]) || 0;
      if (revenue === 0) continue;

      const monthDate = parseMonthNameMonthly_(String(monthHeaders[j]));
      if (!monthDate) continue;

      const monthKey = toMonthKeyMonthly_(monthDate);
      if (!targetMonthKeys.has(monthKey)) continue;

      result.push({
        game,
        country,
        monthDate,
        monthKey,
        revenue,
      });
    }
  }
  return result;
}

function loadMappingTableMonthly_() {
  const ss = SpreadsheetApp.openById(GAME_MAPPING_SS_ID);
  let sheet = ss.getSheetByName(GAME_MAPPING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheetByName("ManualGameMapping");
  }
  if (!sheet) {
    throw new Error("Mapping sheet not found");
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return new Map();
  }
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const map = new Map();
  data.forEach((row) => {
    const amplitudeName = String(row[0] || "").trim();
    const appMagicNameRaw = String(row[1] || "").trim();
    if (!appMagicNameRaw || !amplitudeName) return;

    const key = normalizeGameNameMonthly_(appMagicNameRaw);
    if (!key) return;

    if (!map.has(key)) map.set(key, []);
    map.get(key).push(amplitudeName);
  });
  return map;
}

function normalizeGameNameMonthly_(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ============================================================================
 * APPMAGIC PROCESSING (OPTIMIZED WITH PROGRESS LOGGING)
 * ============================================================================
 */

function processAppMagicForMonths_(targetMonths, amplitudeData, manualMap) {
  const targetMonthKeys = new Set(targetMonths.map((m) => m.monthKey));
  const years = getYearsForMonths_(targetMonths);
  // Build Amplitude index
  Logger.log("   Building Amplitude index...");
  const amplitudeIndex = {};
  amplitudeData.forEach((r) => {
    const key = `${r.game}|${r.country}|${r.monthKey}`;
    if (!amplitudeIndex[key]) amplitudeIndex[key] = 0;
    amplitudeIndex[key] += r.revenue;
  });
  Logger.log(
    `   ✓ Index built with ${Object.keys(amplitudeIndex).length} entries`
  );
  const allEnrichedData = [];
  for (const year of years) {
    const yearConfig = YEAR_CONFIGS[year];
    if (!yearConfig) {
      Logger.log(`   ⚠️ No config for year ${year}`);
      continue;
    }

    Logger.log(`\n   📂 Processing ${year}...`);

    const ss = SpreadsheetApp.openById(yearConfig.inputSsId);
    const sheet = ss.getSheetByName(yearConfig.inputSheetName);

    if (!sheet) {
      Logger.log(`   ⚠️ Sheet not found for ${year}`);
      continue;
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const totalDataRows = lastRow - APPMAGIC_HEADER_ROW;

    if (totalDataRows <= 0) {
      Logger.log(`   ⚠️ No data for ${year}`);
      continue;
    }

    Logger.log(`   Total rows in sheet: ${totalDataRows.toLocaleString()}`);

    // Get headers ONCE
    const headers = sheet
      .getRange(APPMAGIC_HEADER_ROW, 1, 1, lastCol)
      .getValues()[0];
    const colMap = {};
    headers.forEach((h, idx) => (colMap[h] = idx));

    // Validate required columns exist
    const requiredCols = [
      APPMAGIC_COLUMNS.MONTH,
      APPMAGIC_COLUMNS.APPLICATION_NAME,
      APPMAGIC_COLUMNS.COUNTRY,
      APPMAGIC_COLUMNS.PUBLISHER,
      APPMAGIC_COLUMNS.REVENUE,
    ];

    for (const col of requiredCols) {
      if (colMap[col] === undefined) {
        Logger.log(`   ⚠️ Missing column: ${col}`);
        continue;
      }
    }

    // Process in batches with progress logging
    let currentRow = APPMAGIC_HEADER_ROW + 1;
    let yearRowCount = 0;
    let rowsScanned = 0;
    let lastLoggedAt = 0;

    while (currentRow <= lastRow) {
      const batchSize = Math.min(MONTHLY_BATCH_SIZE, lastRow - currentRow + 1);

      // Read batch
      const values = sheet
        .getRange(currentRow, 1, batchSize, lastCol)
        .getValues();

      // Process each row
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        rowsScanned++;

        // Parse month and filter early
        const monthRaw = row[colMap[APPMAGIC_COLUMNS.MONTH]];
        const monthDate = parseAppMagicMonthMonthly_(monthRaw);
        if (!monthDate) continue;

        const monthKey = toMonthKeyMonthly_(monthDate);

        // Skip if not in target months (this is the key filter!)
        if (!targetMonthKeys.has(monthKey)) continue;

        const appName = String(
          row[colMap[APPMAGIC_COLUMNS.APPLICATION_NAME]] || ""
        ).trim();
        const country = String(
          row[colMap[APPMAGIC_COLUMNS.COUNTRY]] || ""
        ).trim();
        if (!appName || !country) continue;

        const publisher = String(
          row[colMap[APPMAGIC_COLUMNS.PUBLISHER]] || ""
        ).trim();
        const revenue = parseFloat(row[colMap[APPMAGIC_COLUMNS.REVENUE]]) || 0;
        const tagsGames = String(
          row[colMap[APPMAGIC_COLUMNS.TAGS_GAMES]] || ""
        ).trim();
        const rank = parseInt(row[colMap[APPMAGIC_COLUMNS.RANK]]) || 0;
        const type = String(row[colMap[APPMAGIC_COLUMNS.TYPE]] || "").trim();

        // Enrich with Freecash data
        const normalizedName = normalizeGameNameMonthly_(appName);
        let freecashRevenue = 0;
        let isLive = "No";

        if (normalizedName) {
          const mappedNames = manualMap.get(normalizedName);
          if (mappedNames && mappedNames.length > 0) {
            mappedNames.forEach((ampName) => {
              const lookupKey = `${ampName}|${country}|${monthKey}`;
              if (amplitudeIndex[lookupKey]) {
                freecashRevenue += amplitudeIndex[lookupKey];
              }
            });
            if (freecashRevenue >= MIN_REVENUE_LIVE) isLive = "Yes";
          }
        }

        allEnrichedData.push({
          monthDate,
          monthKey,
          country,
          type,
          applicationName: appName,
          publisher,
          revenue,
          tagsGames,
          rank,
          freecashRevenue,
          liveOnFreecash: isLive,
        });

        yearRowCount++;
      }

      currentRow += batchSize;

      // Progress logging
      if (rowsScanned - lastLoggedAt >= MONTHLY_LOG_EVERY_ROWS) {
        const pct = ((rowsScanned / totalDataRows) * 100).toFixed(1);
        Logger.log(
          `      Progress: ${pct}% (${rowsScanned.toLocaleString()}/${totalDataRows.toLocaleString()} scanned, ${yearRowCount.toLocaleString()} matched)`
        );
        lastLoggedAt = rowsScanned;
      }
    }

    Logger.log(
      `   ✓ ${year}: Scanned ${rowsScanned.toLocaleString()} rows, found ${yearRowCount.toLocaleString()} for target months`
    );
  }
  return allEnrichedData;
}

/**
 * ============================================================================
 * OUTPUT GENERATION
 * ============================================================================
 */

function generateMainSheetMonthly_(ss, enrichedData) {
  const sheet = ss.getSheetByName("Main");
  Logger.log(
    `      Calculating aggregates for ${enrichedData.length.toLocaleString()} rows...`
  );
  // Calculate aggregates
  const aggMap = {};
  const partnerPublishers = new Set();
  // First pass
  enrichedData.forEach((row) => {
    const key = `${row.country}|${row.monthKey}`;
    if (!aggMap[key]) {
      aggMap[key] = { total: 0, live: 0, reachable: 0 };
    }
    aggMap[key].total += row.revenue;

    if (row.liveOnFreecash === "Yes") {
      aggMap[key].live += row.revenue;
      if (row.publisher) partnerPublishers.add(row.publisher);
    }
  });
  Logger.log(`      Found ${partnerPublishers.size} partner publishers`);
  // Second pass: reachable
  enrichedData.forEach((row) => {
    if (partnerPublishers.has(row.publisher)) {
      const key = `${row.country}|${row.monthKey}`;
      if (aggMap[key]) {
        aggMap[key].reachable = (aggMap[key].reachable || 0) + row.revenue;
      }
    }
  });
  Logger.log(`      Building output rows...`);
  // Build output rows
  const outputRows = enrichedData.map((row) => {
    const key = `${row.country}|${row.monthKey}`;
    const agg = aggMap[key] || { total: 0, live: 0, reachable: 0 };

    const liveShare = agg.total > 0 ? agg.live / agg.total : 0;
    const unlockable =
      agg.total > 0 ? Math.max(agg.reachable - agg.live, 0) / agg.total : 0;
    const unreachable =
      agg.total > 0 ? Math.max(agg.total - agg.reachable, 0) / agg.total : 0;
    const capture =
      row.revenue > 0 ? (row.freecashRevenue || 0) / row.revenue : 0;
    const missed =
      partnerPublishers.has(row.publisher) && row.liveOnFreecash === "No"
        ? row.revenue
        : 0;

    const countryTier = MONTHLY_LITE_COUNTRIES.includes(row.country)
      ? "LITE"
      : "Non-LITE";
    const partnershipStatus =
      row.liveOnFreecash === "Yes"
        ? "Live"
        : partnerPublishers.has(row.publisher)
        ? "Partner Not Live"
        : "Not Partner";

    return [
      row.monthDate,
      row.country,
      row.type,
      row.applicationName,
      row.publisher,
      row.revenue,
      row.tagsGames,
      row.freecashRevenue,
      row.rank,
      row.liveOnFreecash,
      liveShare,
      unlockable,
      unreachable,
      capture,
      missed,
      countryTier,
      partnershipStatus,
    ];
  });
  // Write headers
  sheet
    .getRange(1, 1, 1, MONTHLY_MAIN_HEADERS.length)
    .setValues([MONTHLY_MAIN_HEADERS]);
  sheet.getRange(1, 1, 1, MONTHLY_MAIN_HEADERS.length).setFontWeight("bold");
  // Write data in chunks
  if (outputRows.length > 0) {
    Logger.log(`      Writing ${outputRows.length.toLocaleString()} rows...`);
    writeDataInChunksMonthly_(sheet, outputRows, MONTHLY_MAIN_HEADERS.length);
  }
  Logger.log(`      ✓ Main sheet: ${outputRows.length.toLocaleString()} rows`);
}

function generateShareSheetMonthly_(ss, enrichedData) {
  const sheet = ss.getSheetByName("Share_Analysis");
  const aggMap = new Map();
  const counts = {};
  const partnerPublishers = new Set();
  enrichedData.forEach((row) => {
    if (row.liveOnFreecash === "Yes" && row.publisher) {
      partnerPublishers.add(row.publisher);
    }
  });
  enrichedData.forEach((row) => {
    const key = `${row.country}|${row.monthKey}`;

    if (!aggMap.has(key)) {
      aggMap.set(key, { total: 0, live: 0, reachable: 0 });
    }
    const agg = aggMap.get(key);

    agg.total += row.revenue;
    if (row.liveOnFreecash === "Yes") agg.live += row.revenue;
    if (partnerPublishers.has(row.publisher)) agg.reachable += row.revenue;

    if (!counts[key]) counts[key] = { liveGames: 0, totalGames: 0 };
    counts[key].totalGames++;
    if (row.liveOnFreecash === "Yes") counts[key].liveGames++;
  });
  const shareData = [];
  aggMap.forEach((agg, key) => {
    const [country, monthKey] = key.split("|");
    const cnt = counts[key];
    const liveShare = agg.total > 0 ? agg.live / agg.total : 0;
    const reachableShare = agg.total > 0 ? agg.reachable / agg.total : 0;

    shareData.push([
      country,
      parseAppMagicMonthMonthly_(monthKey + "-01"),
      agg.total,
      agg.live,
      agg.reachable,
      liveShare,
      reachableShare,
      reachableShare - liveShare,
      cnt.liveGames,
      cnt.totalGames,
    ]);
  });
  shareData.sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1]);
  sheet
    .getRange(1, 1, 1, MONTHLY_SHARE_HEADERS.length)
    .setValues([MONTHLY_SHARE_HEADERS]);
  sheet.getRange(1, 1, 1, MONTHLY_SHARE_HEADERS.length).setFontWeight("bold");
  if (shareData.length > 0) {
    sheet
      .getRange(2, 1, shareData.length, MONTHLY_SHARE_HEADERS.length)
      .setValues(shareData);
  }
  Logger.log(
    `      ✓ Share Analysis: ${shareData.length.toLocaleString()} rows`
  );
}

function generateMissingSheetMonthly_(ss, enrichedData) {
  const sheet = ss.getSheetByName("Missing_Opportunities");
  const partnerPublishers = new Set();
  enrichedData.forEach((row) => {
    if (row.liveOnFreecash === "Yes" && row.publisher) {
      partnerPublishers.add(row.publisher);
    }
  });
  const missingRows = enrichedData
    .filter(
      (row) =>
        partnerPublishers.has(row.publisher) && row.liveOnFreecash === "No"
    )
    .map((row) => [
      row.publisher,
      row.applicationName,
      row.country,
      row.monthDate,
      row.revenue,
      row.rank,
      row.tagsGames,
    ]);
  sheet
    .getRange(1, 1, 1, MONTHLY_MISSING_HEADERS.length)
    .setValues([MONTHLY_MISSING_HEADERS]);
  sheet.getRange(1, 1, 1, MONTHLY_MISSING_HEADERS.length).setFontWeight("bold");
  if (missingRows.length > 0) {
    writeDataInChunksMonthly_(
      sheet,
      missingRows,
      MONTHLY_MISSING_HEADERS.length
    );
  }
  Logger.log(
    `      ✓ Missing Opportunities: ${missingRows.length.toLocaleString()} rows`
  );
}

function writeDataInChunksMonthly_(sheet, rows, numCols) {
  const totalChunks = Math.ceil(rows.length / MONTHLY_WRITE_CHUNK_SIZE);
  for (let i = 0; i < rows.length; i += MONTHLY_WRITE_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + MONTHLY_WRITE_CHUNK_SIZE);
    sheet.getRange(2 + i, 1, chunk.length, numCols).setValues(chunk);
    SpreadsheetApp.flush();

    if (i + MONTHLY_WRITE_CHUNK_SIZE < rows.length) {
      Utilities.sleep(MONTHLY_INTER_CHUNK_SLEEP);
    }
  }
}

/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 */

function toMonthKeyMonthly_(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM");
}

function parseMonthNameMonthly_(v) {
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d;
  const parts = String(v).split(" ");
  const m = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  }[parts[0].toLowerCase().substring(0, 3)];
  return m ? new Date(parts[1], m - 1, 1) : null;
}

function parseAppMagicMonthMonthly_(v) {
  if (v instanceof Date) return v;
  const m = String(v).match(/^(\d{4})-(\d{2})/);
  return m ? new Date(m[1], m[2] - 1, 1) : new Date(v);
}

/**
 * ============================================================================
 * LOGGING & TRACKING
 * ============================================================================
 */

function logSnapshotCreation_(outputId, outputUrl, targetMonths, rowCount) {
  try {
    const ss = SpreadsheetApp.openById(PROGRESS_TRACKING_SS_ID);
    let logSheet = ss.getSheetByName("Monthly_Snapshots_Log");

    if (!logSheet) {
      logSheet = ss.insertSheet("Monthly_Snapshots_Log");
      logSheet
        .getRange(1, 1, 1, 6)
        .setValues([
          [
            "Created",
            "Spreadsheet ID",
            "URL",
            "Months Covered",
            "Rows",
            "Status",
          ],
        ]);
      logSheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }

    const newRow = logSheet.getLastRow() + 1;
    logSheet
      .getRange(newRow, 1, 1, 6)
      .setValues([
        [
          new Date(),
          outputId,
          outputUrl,
          targetMonths.map((m) => m.label).join(", "),
          rowCount,
          "Complete",
        ],
      ]);

    Logger.log("\n📝 Logged to Monthly_Snapshots_Log sheet");
  } catch (e) {
    Logger.log(`\n⚠️ Could not log to tracking sheet: ${e.message}`);
  }
}

function updateOutputLogStatus_(ss, status) {
  try {
    const logSheet = ss.getSheetByName("_Log");
    if (logSheet) {
      logSheet.getRange("B6").setValue(status);
    }
  } catch (e) {}
}

/**
 * ============================================================================
 * ADDITIONAL UTILITY FUNCTIONS
 * ============================================================================
 */

function VIEW_MONTHLY_SNAPSHOTS() {
  Logger.log("═══════════════════════════════════════════════════════════");
  Logger.log("📊 MONTHLY SNAPSHOTS LOG");
  Logger.log("═══════════════════════════════════════════════════════════");
  try {
    const ss = SpreadsheetApp.openById(PROGRESS_TRACKING_SS_ID);
    const logSheet = ss.getSheetByName("Monthly_Snapshots_Log");

    if (!logSheet || logSheet.getLastRow() <= 1) {
      Logger.log("\nNo monthly snapshots found.");
      Logger.log("Run GENERATE_MONTHLY_SNAPSHOT() to create one.");
      return;
    }

    const data = logSheet
      .getRange(2, 1, logSheet.getLastRow() - 1, 6)
      .getValues();

    Logger.log(`\nFound ${data.length} snapshot(s):\n`);

    data.forEach((row, i) => {
      Logger.log(`${i + 1}. ${row[3]}`);
      Logger.log(`   Created: ${row[0]}`);
      Logger.log(`   Rows: ${row[4].toLocaleString()}`);
      Logger.log(`   URL: ${row[2]}`);
      Logger.log("");
    });
  } catch (e) {
    Logger.log(`Error: ${e.message}`);
  }
}

function GENERATE_CUSTOM_SNAPSHOT(year1, month1, year2, month2) {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const targetMonths = [
    {
      year: year1,
      month: month1,
      monthKey: `${year1}-${String(month1).padStart(2, "0")}`,
      label: `${monthNames[month1 - 1]} ${year1}`,
      startDate: new Date(year1, month1 - 1, 1),
      endDate: new Date(year1, month1, 0),
    },
    {
      year: year2,
      month: month2,
      monthKey: `${year2}-${String(month2).padStart(2, "0")}`,
      label: `${monthNames[month2 - 1]} ${year2}`,
      startDate: new Date(year2, month2 - 1, 1),
      endDate: new Date(year2, month2, 0),
    },
  ];
  targetMonths.sort((a, b) => a.startDate - b.startDate);
  Logger.log("═══════════════════════════════════════════════════════════");
  Logger.log("📊 CUSTOM MONTHLY SNAPSHOT GENERATOR");
  Logger.log("═══════════════════════════════════════════════════════════");
  const startTime = Date.now();
  try {
    Logger.log(
      `\n📅 Target months: ${targetMonths.map((m) => m.label).join(", ")}`
    );

    const outputSs = createMonthlyOutputSpreadsheet_(targetMonths);
    const outputUrl = outputSs.getUrl();
    const outputId = outputSs.getId();

    Logger.log(`\n📁 Created: ${outputUrl}`);

    Logger.log("\n📥 Loading Amplitude data...");
    const amplitudeData = loadAmplitudeDataForMonths_(targetMonths);
    Logger.log(`   ✓ Loaded ${amplitudeData.length.toLocaleString()} records`);

    Logger.log("\n📥 Loading game mapping table...");
    const manualMap = loadMappingTableMonthly_();
    Logger.log(`   ✓ Loaded ${manualMap.size} game mappings`);

    Logger.log("\n⚙️ Processing AppMagic data...");
    const enrichedData = processAppMagicForMonths_(
      targetMonths,
      amplitudeData,
      manualMap
    );
    Logger.log(`   ✓ Enriched ${enrichedData.length.toLocaleString()} rows`);

    if (enrichedData.length === 0) {
      Logger.log("\n⚠️ No data found for the target months!");
      return outputUrl;
    }

    Logger.log("\n📝 Generating output sheets...");
    generateMainSheetMonthly_(outputSs, enrichedData);
    generateShareSheetMonthly_(outputSs, enrichedData);
    generateMissingSheetMonthly_(outputSs, enrichedData);

    updateOutputLogStatus_(outputSs, "Complete");

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    Logger.log("\n═══════════════════════════════════════════════════════════");
    Logger.log(`✅ CUSTOM SNAPSHOT COMPLETE in ${elapsed}s`);
    Logger.log(`   ${outputUrl}`);
    Logger.log("═══════════════════════════════════════════════════════════");

    logSnapshotCreation_(
      outputId,
      outputUrl,
      targetMonths,
      enrichedData.length
    );

    return outputUrl;
  } catch (e) {
    Logger.log(`\n❌ Error: ${e.message}`);
    throw e;
  }
}

function CLEANUP_OLD_SNAPSHOTS(keepCount) {
  keepCount = keepCount || 5;
  Logger.log("═══════════════════════════════════════════════════════════");
  Logger.log("🧹 CLEANING UP OLD MONTHLY SNAPSHOTS");
  Logger.log(`   Keeping the ${keepCount} most recent snapshots`);
  Logger.log("═══════════════════════════════════════════════════════════");
  try {
    const files = DriveApp.searchFiles(
      `title contains "${MONTHLY_SNAPSHOT_PREFIX}"`
    );
    const fileList = [];

    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        file: file,
        name: file.getName(),
        created: file.getDateCreated(),
      });
    }

    Logger.log(`\nFound ${fileList.length} snapshot(s)`);

    if (fileList.length <= keepCount) {
      Logger.log("Nothing to delete.");
      return;
    }

    fileList.sort((a, b) => b.created - a.created);

    const toDelete = fileList.slice(keepCount);

    Logger.log(`\nDeleting ${toDelete.length} old snapshot(s):`);

    toDelete.forEach((item) => {
      Logger.log(`   🗑️ ${item.name}`);
      item.file.setTrashed(true);
    });

    Logger.log("\n✅ Cleanup complete");
  } catch (e) {
    Logger.log(`\n❌ Error: ${e.message}`);
  }
}

// Get Headquarter Location

/**
 * ============================================================================
 * STANDALONE SHEET HQ ENRICHMENT - V2.0 (GPT-5.1 Adapted)
 * ============================================================================
 * Enriches any spreadsheet with Publisher HQ data.
 * - Creates a local mapping sheet within the target spreadsheet
 * - Uses GPT-5.1 with Web Search
 * - Optimized for maximum throughput before timeout
 * * Usage:
 * 1. Set TARGET_SHEET_CONFIG below
 * 2. Run ENRICH_SHEET_WITH_HQ()
 * ============================================================================
 */

// ============================================================================
// TARGET SHEET CONFIGURATION
// ============================================================================
const TARGET_SHEET_CONFIG = {
  // The spreadsheet to enrich
  spreadsheetId: "1ILSj-kAbeMnODEFmnQRYJJI9wqKOiIA2JNmHDRrKZzI",

  // Sheet name containing the data (leave empty to use first sheet)
  dataSheetName: "",

  // Column containing publisher names (1-indexed)
  publisherColumn: 5, // Column E = Publisher

  // Column to write HQ data (1-indexed, will be created/overwritten)
  hqOutputColumn: 18, // Column R = HQ Location

  // Header name for the HQ column
  hqHeaderName: "Publisher HQ",

  // Name for the local mapping sheet (created in same spreadsheet)
  mappingSheetName: "_HQ_Mapping",

  // Name for progress tracking sheet
  progressSheetName: "_HQ_Progress",
};

// ============================================================================
// OPENAI CONFIGURATION
// ============================================================================
const STANDALONE_OPENAI_MODEL = "gpt-5.1";
const STANDALONE_BATCH_SIZE = 10; // Increased batch size
const STANDALONE_SAVE_EVERY = 2; // Save every 2 batches (every 20 items)

// Google Apps Script has a hard limit of 6 minutes (360000ms).
// We set this to 5.8 minutes to run as long as possible while still
// leaving 12 seconds to save progress gracefully before the hard kill.
const STANDALONE_MAX_RUNTIME_MS = 5.8 * 60 * 1000;

let STANDALONE_START_TIME = new Date();

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Main function to enrich a sheet with HQ data
 * Run this to start or resume enrichment
 */
function ENRICH_SHEET_WITH_HQ() {
  STANDALONE_START_TIME = new Date();

  standaloneLog_(
    "INFO",
    "═══════════════════════════════════════════════════════════"
  );
  standaloneLog_("INFO", "🌍 STANDALONE SHEET HQ ENRICHMENT (GPT-5.1)");
  standaloneLog_(
    "INFO",
    "═══════════════════════════════════════════════════════════"
  );

  try {
    // 1. Open target spreadsheet
    standaloneLog_("INFO", "📂 Opening spreadsheet...");
    const ss = SpreadsheetApp.openById(TARGET_SHEET_CONFIG.spreadsheetId);
    standaloneLog_("INFO", '   ✓ Opened: "' + ss.getName() + '"');

    // 2. Get data sheet
    let dataSheet;
    if (TARGET_SHEET_CONFIG.dataSheetName) {
      dataSheet = ss.getSheetByName(TARGET_SHEET_CONFIG.dataSheetName);
      if (!dataSheet) {
        throw new Error(
          'Sheet "' + TARGET_SHEET_CONFIG.dataSheetName + '" not found'
        );
      }
    } else {
      dataSheet = ss.getSheets()[0];
    }
    standaloneLog_("INFO", '   📄 Data sheet: "' + dataSheet.getName() + '"');

    // 3. Scan for unique publishers
    standaloneLog_("INFO", "\n🔍 Scanning for unique publishers...");
    const publishers = scanSheetForPublishers_(dataSheet);
    standaloneLog_(
      "INFO",
      "   ✓ Found " + publishers.length + " unique publishers"
    );

    if (publishers.length === 0) {
      standaloneLog_(
        "WARN",
        "   No publishers found. Check your column configuration."
      );
      return;
    }

    // 4. Load/create local mapping
    standaloneLog_("INFO", "\n📥 Loading local HQ mapping...");
    const localMapping = getOrCreateLocalMapping_(ss);
    standaloneLog_(
      "INFO",
      "   ✓ Mapping has " + localMapping.size + " entries"
    );

    // 5. Identify what needs enrichment
    const toEnrich = [];
    const alreadyKnown = [];

    publishers.forEach(function (pub) {
      const existing = localMapping.get(pub);
      if (existing && existing !== "Unknown" && existing !== "") {
        alreadyKnown.push(pub);
      } else {
        toEnrich.push(pub);
      }
    });

    standaloneLog_("INFO", "\n📊 Status:");
    standaloneLog_("INFO", "   ✓ Already known: " + alreadyKnown.length);
    standaloneLog_("INFO", "   ⚡ Need enrichment: " + toEnrich.length);

    // 6. Load progress (for resume capability)
    const processedSet = loadLocalProgress_(ss);
    const remaining = toEnrich.filter(function (p) {
      return !processedSet.has(p);
    });

    if (processedSet.size > 0 && remaining.length < toEnrich.length) {
      standaloneLog_(
        "INFO",
        "   🔄 Resuming: " +
          processedSet.size +
          " already processed, " +
          remaining.length +
          " remaining"
      );
    }

    // 7. Enrich with GPT
    if (remaining.length > 0) {
      standaloneLog_(
        "INFO",
        "\n🤖 Starting GPT enrichment (" + remaining.length + " publishers)..."
      );

      const enrichResult = enrichWithGPT_(ss, remaining, localMapping);

      if (enrichResult.timedOut) {
        standaloneLog_("WARN", "\n⏱️ MAX RUNTIME REACHED - Progress saved.");
        standaloneLog_(
          "INFO",
          "   Processed in this run: " + enrichResult.processed
        );
        standaloneLog_(
          "INFO",
          "   👉 Please run ENRICH_SHEET_WITH_HQ() again to continue."
        );
        return;
      }

      standaloneLog_("SUCCESS", "\n✓ Enrichment complete!");
      standaloneLog_("INFO", "   Resolved: " + enrichResult.resolved);
      standaloneLog_("INFO", "   Still unknown: " + enrichResult.stillUnknown);
    }

    // 8. Write HQ column to data sheet
    standaloneLog_("INFO", "\n📝 Writing HQ data to sheet...");
    const finalMapping = getOrCreateLocalMapping_(ss);
    writeHQToDataSheet_(dataSheet, finalMapping);

    // 9. Summary
    const unknownCount = countLocalUnknowns_(finalMapping);

    standaloneLog_(
      "SUCCESS",
      "\n═══════════════════════════════════════════════════════════"
    );
    standaloneLog_("SUCCESS", "✅ ENRICHMENT COMPLETE!");
    standaloneLog_(
      "SUCCESS",
      "═══════════════════════════════════════════════════════════"
    );
    standaloneLog_("INFO", "   Total publishers: " + publishers.length);
    standaloneLog_(
      "INFO",
      "   Known HQ: " + (publishers.length - unknownCount)
    );
    standaloneLog_("INFO", "   Unknown HQ: " + unknownCount);
    standaloneLog_(
      "INFO",
      '\n   📄 Mapping sheet: "' + TARGET_SHEET_CONFIG.mappingSheetName + '"'
    );
    standaloneLog_(
      "INFO",
      "   📊 HQ column written to column " + TARGET_SHEET_CONFIG.hqOutputColumn
    );

    // Clear progress after successful completion
    clearLocalProgress_(ss);
  } catch (e) {
    standaloneLog_("ERROR", "\n❌ Error: " + e.message);
    console.error(e.stack);
  }
}

/**
 * Check status without making changes
 */
function CHECK_ENRICHMENT_STATUS() {
  standaloneLog_(
    "INFO",
    "═══════════════════════════════════════════════════════════"
  );
  standaloneLog_("INFO", "📊 ENRICHMENT STATUS");
  standaloneLog_(
    "INFO",
    "═══════════════════════════════════════════════════════════"
  );

  try {
    const ss = SpreadsheetApp.openById(TARGET_SHEET_CONFIG.spreadsheetId);

    // Get data sheet
    let dataSheet;
    if (TARGET_SHEET_CONFIG.dataSheetName) {
      dataSheet = ss.getSheetByName(TARGET_SHEET_CONFIG.dataSheetName);
    } else {
      dataSheet = ss.getSheets()[0];
    }

    const publishers = scanSheetForPublishers_(dataSheet);
    const localMapping = getOrCreateLocalMapping_(ss);
    const processedSet = loadLocalProgress_(ss);

    let known = 0;
    let unknown = 0;
    let notInMapping = 0;

    publishers.forEach(function (pub) {
      const hq = localMapping.get(pub);
      if (!hq) {
        notInMapping++;
      } else if (hq === "Unknown" || hq === "") {
        unknown++;
      } else {
        known++;
      }
    });

    standaloneLog_("INFO", '\n   Spreadsheet: "' + ss.getName() + '"');
    standaloneLog_("INFO", '   Data sheet: "' + dataSheet.getName() + '"');
    standaloneLog_(
      "INFO",
      "\n   Total unique publishers: " + publishers.length
    );
    standaloneLog_(
      "INFO",
      "   ✓ Known HQ: " +
        known +
        " (" +
        ((known / publishers.length) * 100).toFixed(1) +
        "%)"
    );
    standaloneLog_("INFO", "   ✗ Unknown HQ: " + unknown);
    standaloneLog_("INFO", "   ○ Not in mapping: " + notInMapping);
    standaloneLog_(
      "INFO",
      "\n   Progress tracker: " +
        processedSet.size +
        " processed in current run"
    );

    if (notInMapping > 0 || unknown > 0) {
      standaloneLog_(
        "INFO",
        "\n👉 Run ENRICH_SHEET_WITH_HQ() to enrich " +
          (notInMapping + unknown) +
          " publishers"
      );
    }
  } catch (e) {
    standaloneLog_("ERROR", "Error: " + e.message);
  }
}

/**
 * Reset progress tracking (start fresh)
 */
function RESET_ENRICHMENT_PROGRESS() {
  standaloneLog_("INFO", "🔄 Resetting enrichment progress...");

  try {
    const ss = SpreadsheetApp.openById(TARGET_SHEET_CONFIG.spreadsheetId);
    clearLocalProgress_(ss);
    standaloneLog_("SUCCESS", "✓ Progress cleared. Next run will start fresh.");
  } catch (e) {
    standaloneLog_("ERROR", "Error: " + e.message);
  }
}

/**
 * Reset everything (mapping + progress)
 */
function RESET_ALL_HQ_DATA() {
  standaloneLog_("WARN", "⚠️ Resetting ALL HQ data...");

  try {
    const ss = SpreadsheetApp.openById(TARGET_SHEET_CONFIG.spreadsheetId);

    // Clear mapping sheet
    const mappingSheet = ss.getSheetByName(
      TARGET_SHEET_CONFIG.mappingSheetName
    );
    if (mappingSheet) {
      const lastRow = mappingSheet.getLastRow();
      if (lastRow > 1) {
        mappingSheet
          .getRange(2, 1, lastRow - 1, mappingSheet.getLastColumn())
          .clearContent();
      }
      standaloneLog_("INFO", "   ✓ Mapping sheet cleared");
    }

    // Clear progress
    clearLocalProgress_(ss);
    standaloneLog_("INFO", "   ✓ Progress cleared");

    standaloneLog_(
      "SUCCESS",
      "✅ All HQ data reset. Run ENRICH_SHEET_WITH_HQ() to start fresh."
    );
  } catch (e) {
    standaloneLog_("ERROR", "Error: " + e.message);
  }
}

// ============================================================================
// SCANNING & DATA EXTRACTION
// ============================================================================

function scanSheetForPublishers_(sheet) {
  const publishers = new Set();

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const pubCol = TARGET_SHEET_CONFIG.publisherColumn;
  const data = sheet.getRange(2, pubCol, lastRow - 1, 1).getValues();

  data.forEach(function (row) {
    const pub = String(row[0] || "").trim();
    if (pub && pub.length > 0) {
      publishers.add(pub);
    }
  });

  return Array.from(publishers).sort();
}

// ============================================================================
// LOCAL MAPPING MANAGEMENT
// ============================================================================

function getOrCreateLocalMapping_(ss) {
  const mappings = new Map();

  let sheet = ss.getSheetByName(TARGET_SHEET_CONFIG.mappingSheetName);

  // Create if doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(TARGET_SHEET_CONFIG.mappingSheetName);
    sheet
      .getRange(1, 1, 1, 3)
      .setValues([["Publisher", "HQ Location", "Last Updated"]]);
    sheet.getRange(1, 1, 1, 3).setFontWeight("bold");
    sheet.setColumnWidth(1, 250);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 150);
    return mappings;
  }

  // Load existing data
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return mappings;

  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  data.forEach(function (row) {
    const pub = String(row[0] || "").trim();
    const hq = String(row[1] || "").trim();
    if (pub) {
      mappings.set(pub, hq || "Unknown");
    }
  });

  return mappings;
}

function appendToLocalMapping_(ss, newEntries) {
  // newEntries = [[publisher, hq], ...]
  if (newEntries.length === 0) return;

  let sheet = ss.getSheetByName(TARGET_SHEET_CONFIG.mappingSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(TARGET_SHEET_CONFIG.mappingSheetName);
    sheet
      .getRange(1, 1, 1, 3)
      .setValues([["Publisher", "HQ Location", "Last Updated"]]);
    sheet.getRange(1, 1, 1, 3).setFontWeight("bold");
  }

  const rows = newEntries.map(function (entry) {
    return [entry[0], entry[1], new Date()];
  });
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 3).setValues(rows);
  SpreadsheetApp.flush();
}

function countLocalUnknowns_(mappings) {
  let count = 0;
  mappings.forEach(function (hq) {
    if (!hq || hq === "Unknown" || hq === "") count++;
  });
  return count;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

function loadLocalProgress_(ss) {
  const processed = new Set();

  const sheet = ss.getSheetByName(TARGET_SHEET_CONFIG.progressSheetName);
  if (!sheet) return processed;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return processed;

  const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  data.forEach(function (row) {
    if (row[0]) processed.add(String(row[0]).trim());
  });

  return processed;
}

function saveLocalProgress_(ss, publishers) {
  // publishers = array of publisher names processed
  if (publishers.length === 0) return;

  let sheet = ss.getSheetByName(TARGET_SHEET_CONFIG.progressSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(TARGET_SHEET_CONFIG.progressSheetName);
    sheet.getRange(1, 1, 1, 2).setValues([["Publisher", "Processed At"]]);
    sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
  }

  const rows = publishers.map(function (p) {
    return [p, new Date()];
  });
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, 2).setValues(rows);
  SpreadsheetApp.flush();
}

function clearLocalProgress_(ss) {
  const sheet = ss.getSheetByName(TARGET_SHEET_CONFIG.progressSheetName);
  if (sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
  }
}

// ============================================================================
// GPT ENRICHMENT (SYNCHRONOUS)
// ============================================================================

function enrichWithGPT_(ss, publishers, existingMapping) {
  let resolved = 0;
  let stillUnknown = 0;
  let processed = 0;

  const totalBatches = Math.ceil(publishers.length / STANDALONE_BATCH_SIZE);
  let batchCount = 0;

  // Buffers for batch saves
  let mappingBuffer = [];
  let progressBuffer = [];

  for (let i = 0; i < publishers.length; i += STANDALONE_BATCH_SIZE) {
    // Check timeout BEFORE processing next batch
    if (isStandaloneTimeout_()) {
      // Save buffered data before exiting
      if (mappingBuffer.length > 0) appendToLocalMapping_(ss, mappingBuffer);
      if (progressBuffer.length > 0) saveLocalProgress_(ss, progressBuffer);

      return {
        resolved: resolved,
        stillUnknown: stillUnknown,
        processed: processed,
        timedOut: true,
      };
    }

    const batch = publishers.slice(i, i + STANDALONE_BATCH_SIZE);
    batchCount++;

    standaloneLog_(
      "INFO",
      "   🚀 Batch " +
        batchCount +
        "/" +
        totalBatches +
        " (" +
        batch.length +
        " publishers)..."
    );

    // Process each publisher in batch
    for (let j = 0; j < batch.length; j++) {
      const pub = batch[j];
      try {
        const hq = queryGPTForHQStandalone_(pub);

        if (hq && hq !== "Unknown") {
          resolved++;
          mappingBuffer.push([pub, hq]);
          console.log("      ✓ " + pub + " → " + hq);
        } else {
          stillUnknown++;
          mappingBuffer.push([pub, "Unknown"]);
          console.log("      ✗ " + pub + " → Unknown");
        }

        progressBuffer.push(pub);
        processed++;
      } catch (e) {
        standaloneLog_("WARN", "      ⚠️ Failed: " + pub + " - " + e.message);
        stillUnknown++;
        mappingBuffer.push([pub, "Unknown"]);
        progressBuffer.push(pub);
        processed++;
      }

      // Minimal delay to prevent burst rate limit
      Utilities.sleep(100);
    }

    // Save buffers periodically
    if (batchCount % STANDALONE_SAVE_EVERY === 0) {
      standaloneLog_(
        "INFO",
        "   💾 Saving progress (" + mappingBuffer.length + " results)..."
      );
      appendToLocalMapping_(ss, mappingBuffer);
      saveLocalProgress_(ss, progressBuffer);
      mappingBuffer = [];
      progressBuffer = [];
    }

    // Small breath between batches
    Utilities.sleep(500);
  }

  // Save remaining buffer
  if (mappingBuffer.length > 0) {
    appendToLocalMapping_(ss, mappingBuffer);
  }
  if (progressBuffer.length > 0) {
    saveLocalProgress_(ss, progressBuffer);
  }

  return {
    resolved: resolved,
    stillUnknown: stillUnknown,
    processed: processed,
    timedOut: false,
  };
}

function queryGPTForHQStandalone_(publisher) {
  if (!publisher) return "Unknown";

  const prompt =
    'Find the headquarters country for the game publisher/developer: "' +
    publisher +
    '".\n\n' +
    "Rules:\n" +
    "1. SEARCH the web using the provided tool to find accurate, current information.\n" +
    "2. Return ONLY the country name in this exact format: <hq_location>Country Name</hq_location>\n" +
    '3. Use standard English country names (e.g., "United States", "Japan", "South Korea", "China").\n' +
    "4. If you cannot determine the country after searching, return: <hq_location>Unknown</hq_location>\n" +
    "5. Do not guess - if unsure, return Unknown.";

  const url = "https://api.openai.com/v1/responses";

  const payload = {
    model: STANDALONE_OPENAI_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
    text: {
      format: { type: "text" },
    },
    // Explicitly requested web search tool for GPT-5.1
    tools: [
      {
        type: "web_search",
        user_location: { type: "approximate" },
        search_context_size: "medium",
      },
    ],
    store: false,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + OPENAI_API_KEY,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      const errorBody = response.getContentText();
      standaloneLog_(
        "WARN",
        "   API Error (" + responseCode + "): " + errorBody.substring(0, 150)
      );
      return "Unknown";
    }

    const json = JSON.parse(response.getContentText());

    // Extract text from response
    let text = "";

    if (json.output && Array.isArray(json.output)) {
      for (let i = 0; i < json.output.length; i++) {
        const item = json.output[i];
        if (item.type === "message" && item.content) {
          for (let j = 0; j < item.content.length; j++) {
            const content = item.content[j];
            if (content.type === "output_text" && content.text) {
              text += content.text;
            }
          }
        }
      }
    }

    if (!text && json.text) {
      text =
        typeof json.text === "string" ? json.text : JSON.stringify(json.text);
    }

    // Extract HQ from XML tags
    const match = text.match(/<hq_location>(.*?)<\/hq_location>/i);
    if (match) {
      const hq = match[1].trim();
      // Validate it's a reasonable country name
      if (hq.length > 1 && hq.length < 50 && hq.indexOf("<") === -1) {
        return hq;
      }
    }

    return "Unknown";
  } catch (e) {
    standaloneLog_("ERROR", "   Fetch error: " + e.message);
    return "Unknown";
  }
}

// ============================================================================
// WRITING HQ DATA TO SHEET
// ============================================================================

function writeHQToDataSheet_(sheet, mappings) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const pubCol = TARGET_SHEET_CONFIG.publisherColumn;
  const hqCol = TARGET_SHEET_CONFIG.hqOutputColumn;
  const headerName = TARGET_SHEET_CONFIG.hqHeaderName;

  // Write header
  sheet.getRange(1, hqCol).setValue(headerName).setFontWeight("bold");

  // Read publishers
  const pubData = sheet.getRange(2, pubCol, lastRow - 1, 1).getValues();

  // Build HQ values
  const hqValues = pubData.map(function (row) {
    const pub = String(row[0] || "").trim();
    return [mappings.get(pub) || "Unknown"];
  });

  // Write in chunks to avoid timeout
  const CHUNK_SIZE = 2000;
  for (let i = 0; i < hqValues.length; i += CHUNK_SIZE) {
    const chunk = hqValues.slice(i, i + CHUNK_SIZE);
    sheet.getRange(2 + i, hqCol, chunk.length, 1).setValues(chunk);

    if (i + CHUNK_SIZE < hqValues.length) {
      SpreadsheetApp.flush();
      Utilities.sleep(200);
    }
  }

  SpreadsheetApp.flush();
  standaloneLog_(
    "INFO",
    "   ✓ Written " + hqValues.length + " HQ values to column " + hqCol
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function isStandaloneTimeout_() {
  const elapsed = new Date() - STANDALONE_START_TIME;
  return elapsed > STANDALONE_MAX_RUNTIME_MS;
}

function standaloneLog_(level, message) {
  const prefix = "[" + level + "]";
  if (level === "ERROR") console.error(prefix, message);
  else if (level === "WARN") console.warn(prefix, message);
  else if (level === "SUCCESS") console.log("✅ " + message);
  else console.log(prefix, message);
}

// Append Downloads Data

/**
 * ============================================================================
 * DOWNLOADS DATA SYNC SCRIPT
 * ============================================================================
 * Transforms raw downloads data into a clean format similar to Amplitude data.
 *
 * Usage: runDownloadsDataSync()
 * ============================================================================
 */

function runDownloadsDataSync() {
  // ---------------- CONFIG ----------------
  // Source (Downloads raw data)
  const SOURCE_SS_ID = "1fdVUmIAcsbOPq7zvXCuoCtcnYIvAG04MVKTgQV2JMIY";
  const SOURCE_SHEET_NAME = "Data";
  const HEADER_ROW_INDEX = 7; // Row with "Provider offer name" + date columns

  // Target (Clean downloads data)
  const TARGET_SS_ID = "1LyJ6qOW_4eWjiLg789kO1ZKT30mOSK696K1I2WGj8rY";
  const TARGET_SHEET_NAME = "Data";

  Logger.log("");
  Logger.log("════════════════════════════════════════════════════════════");
  Logger.log("    DOWNLOADS DATA SYNC - Starting");
  Logger.log("════════════════════════════════════════════════════════════");
  Logger.log("");

  // ---------------- 1. READ SOURCE DATA ----------------
  Logger.log("Step 1: Reading source data...");
  Logger.log("   Source ID: " + SOURCE_SS_ID);

  const sourceSS = SpreadsheetApp.openById(SOURCE_SS_ID);
  var sourceSheet = sourceSS.getSheetByName(SOURCE_SHEET_NAME);
  if (!sourceSheet) {
    sourceSheet = sourceSS.getSheets()[0];
    Logger.log("   Using first sheet: " + sourceSheet.getName());
  } else {
    Logger.log("   Using sheet: " + SOURCE_SHEET_NAME);
  }

  const rawData = sourceSheet.getDataRange().getValues();
  Logger.log("   ✓ Read " + rawData.length + " rows");

  if (rawData.length < HEADER_ROW_INDEX) {
    throw new Error(
      "Source sheet does not have enough rows to reach header row " +
        HEADER_ROW_INDEX
    );
  }

  const headerRow = rawData[HEADER_ROW_INDEX - 1];
  Logger.log("   Header row: " + HEADER_ROW_INDEX);

  // ---------------- 2. DETECT MONTH COLUMNS ----------------
  Logger.log("");
  Logger.log("Step 2: Detecting month columns...");

  const monthIndices = [];
  const targetHeaders = ["Game", "Country", "Row Average"];

  for (var col = 1; col < headerRow.length; col++) {
    const cell = headerRow[col];
    var dateObj = null;

    if (cell instanceof Date) {
      dateObj = cell;
    } else if (typeof cell === "string" && cell.trim()) {
      // Expect strings like "2024-06-01"
      const m = cell.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        dateObj = new Date(cell);
      }
    } else if (typeof cell === "number") {
      // Could be Excel serial date
      const testDate = new Date((cell - 25569) * 86400 * 1000);
      if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 2000) {
        dateObj = testDate;
      }
    }

    if (!dateObj || isNaN(dateObj.getTime())) continue;

    monthIndices.push(col);

    const label = Utilities.formatDate(
      dateObj,
      Session.getScriptTimeZone(),
      "MMM yyyy" // e.g. "Jun 2024"
    );
    targetHeaders.push(label);
  }

  Logger.log("   ✓ Found " + monthIndices.length + " month columns");

  if (monthIndices.length === 0) {
    throw new Error(
      "No date/month columns detected in header row " + HEADER_ROW_INDEX
    );
  }

  // Show first and last month
  if (monthIndices.length > 0) {
    Logger.log("   First month column: " + targetHeaders[3]);
    Logger.log(
      "   Last month column: " + targetHeaders[targetHeaders.length - 1]
    );
  }

  // ---------------- 3. PROCESS DATA ROWS ----------------
  Logger.log("");
  Logger.log("Step 3: Processing data rows...");

  const processedData = [];
  var skippedRows = 0;

  for (var r = HEADER_ROW_INDEX; r < rawData.length; r++) {
    const row = rawData[r];

    // Column A: "Game; Country"
    const gameCountryStr = (row[0] || "").toString().trim();
    if (!gameCountryStr) {
      skippedRows++;
      continue;
    }

    // Skip header-like rows
    const lowerStr = gameCountryStr.toLowerCase();
    if (
      lowerStr === "provider offer name" ||
      lowerStr.indexOf("provider") === 0
    ) {
      skippedRows++;
      continue;
    }

    const parts = gameCountryStr.split(";");
    const game = parts[0] ? parts[0].trim() : "";
    const country = parts[1] ? parts[1].trim() : "";

    if (!game) {
      skippedRows++;
      continue;
    }

    const monthValues = [];
    var sum = 0;
    var count = 0;

    for (var mi = 0; mi < monthIndices.length; mi++) {
      const colIndex = monthIndices[mi];
      const val = row[colIndex];
      var num = 0;

      if (typeof val === "number") {
        num = val;
      } else if (typeof val === "string" && val.trim() !== "") {
        // Handle "1,234.56" or "1234"
        const cleaned = val.replace(/,/g, "");
        const parsed = Number(cleaned);
        if (!isNaN(parsed)) num = parsed;
      }

      monthValues.push(num);
      sum += num;
      count++;
    }

    const rowAverage = count > 0 ? sum / count : 0;
    processedData.push([game, country, rowAverage].concat(monthValues));

    // Progress log
    if ((r - HEADER_ROW_INDEX + 1) % 1000 === 0) {
      Logger.log("   Processed " + (r - HEADER_ROW_INDEX + 1) + " rows...");
    }
  }

  Logger.log("   ✓ Processed " + processedData.length + " data rows");
  Logger.log("   ✓ Skipped " + skippedRows + " empty/header rows");

  if (processedData.length === 0) {
    Logger.log("");
    Logger.log("⚠️ WARNING: No data rows found!");
    return;
  }

  // ---------------- 4. WRITE TO TARGET ----------------
  Logger.log("");
  Logger.log("Step 4: Writing to target spreadsheet...");
  Logger.log("   Target ID: " + TARGET_SS_ID);

  const targetSS = SpreadsheetApp.openById(TARGET_SS_ID);
  var targetSheet = targetSS.getSheetByName(TARGET_SHEET_NAME);

  if (!targetSheet) {
    targetSheet = targetSS.insertSheet(TARGET_SHEET_NAME);
    Logger.log("   Created new sheet: " + TARGET_SHEET_NAME);
  } else {
    Logger.log("   Using existing sheet: " + TARGET_SHEET_NAME);
  }

  // Clear previous contents
  targetSheet.clearContents();
  Logger.log("   Cleared existing data");

  const finalOutput = [targetHeaders].concat(processedData);
  const numRows = finalOutput.length;
  const numCols = finalOutput[0].length;

  Logger.log("   Writing " + numRows + " rows x " + numCols + " columns...");

  targetSheet.getRange(1, 1, numRows, numCols).setValues(finalOutput);

  // Format header row
  targetSheet.getRange(1, 1, 1, numCols).setFontWeight("bold");
  targetSheet.setFrozenRows(1);

  // Format "Row Average" column (column C)
  if (processedData.length > 0) {
    targetSheet
      .getRange(2, 3, processedData.length, 1)
      .setNumberFormat("#,##0");
  }

  // Format month columns as numbers
  if (processedData.length > 0 && monthIndices.length > 0) {
    targetSheet
      .getRange(2, 4, processedData.length, monthIndices.length)
      .setNumberFormat("#,##0");
  }

  SpreadsheetApp.flush();

  // ---------------- 5. SUMMARY ----------------
  Logger.log("");
  Logger.log("════════════════════════════════════════════════════════════");
  Logger.log("✅ DOWNLOADS DATA SYNC COMPLETE");
  Logger.log("════════════════════════════════════════════════════════════");
  Logger.log("   Rows written: " + processedData.length);
  Logger.log("   Month columns: " + monthIndices.length);
  Logger.log("   Target: " + targetSS.getUrl());
  Logger.log("════════════════════════════════════════════════════════════");
}

/**
 * Quick test - just read source and show structure
 */
function testDownloadsSource() {
  const SOURCE_SS_ID = "1fdVUmIAcsbOPq7zvXCuoCtcnYIvAG04MVKTgQV2JMIY";
  Logger.log("Testing downloads source structure...");
  Logger.log("");
  const ss = SpreadsheetApp.openById(SOURCE_SS_ID);
  const sheet = ss.getSheetByName("Data") || ss.getSheets()[0];
  Logger.log("Sheet name: " + sheet.getName());
  Logger.log("Total rows: " + sheet.getLastRow());
  Logger.log("Total columns: " + sheet.getLastColumn());
  Logger.log("");
  // Show first 10 rows
  const data = sheet
    .getRange(
      1,
      1,
      Math.min(15, sheet.getLastRow()),
      Math.min(5, sheet.getLastColumn())
    )
    .getValues();
  Logger.log("First 15 rows, first 5 columns:");
  for (var i = 0; i < data.length; i++) {
    Logger.log("Row " + (i + 1) + ": " + JSON.stringify(data[i]));
  }
}

// Matching Games
// We will do this also with the help of the appstore IDs you managed to find. This is a crucial task.

/**
 * FILE: 2_GameMatcher.gs
 * PURPOSE: Matches games from Amplitude to Appmagic.
 * FEATURES: Resume capability + Reprocesses "No Match" entries + Skips existing matches.
 * MODEL: Uses Gemini 1.5 Flash (Latest Stable)
 */

const MATCH_CONFIG = {
  // 🔴 IMPORTANT: PASTE YOUR MAIN SPREADSHEET ID HERE
  HOST_SPREADSHEET_ID: "1hxesbPfCqkHeIByOV6aI6i2ojXIBkstVmzJpdeKmGhY",
  // 🔑 API KEY
  GEMINI_API_KEY: "AIzaSyCdQPlLlFDPPCKM5GcjOR_agftP6Pkerg4",
  SHEET_AMPLITUDE: "Amplitude",
  SHEET_APPMAGIC: "Appmagic",
  SHEET_OUTPUT: "Matched Results",
  CONFIDENCE_STRICT_MATH: 0.95,
  TOKEN_CANDIDATE_POOL: 8,
};

function runUnifiedMatching() {
  console.log("--- STARTING SMART MATCHING PROCESS ---");
  if (!MATCH_CONFIG.GEMINI_API_KEY) {
    console.error("ABORT: No API Key found.");
    return;
  }

  const ss = SpreadsheetApp.openById(MATCH_CONFIG.HOST_SPREADSHEET_ID);
  const sheetAmp = ss.getSheetByName(MATCH_CONFIG.SHEET_AMPLITUDE);
  const sheetMagic = ss.getSheetByName(MATCH_CONFIG.SHEET_APPMAGIC);
  if (!sheetAmp || !sheetMagic) {
    console.error("ABORT: Missing input tabs.");
    return;
  }

  // 1. SETUP OUTPUT SHEET (Do not delete, just load)
  let outputSheet = ss.getSheetByName(MATCH_CONFIG.SHEET_OUTPUT);
  if (!outputSheet) {
    outputSheet = ss.insertSheet(MATCH_CONFIG.SHEET_OUTPUT);
    outputSheet.appendRow([
      "Amplitude Name",
      "Appmagic Name (Match)",
      "Method",
      "Confidence",
      "Reasoning",
    ]);
    outputSheet
      .getRange(1, 1, 1, 5)
      .setFontWeight("bold")
      .setBackground("#e8f0fe");
    outputSheet.setFrozenRows(1);
    outputSheet.setColumnWidth(1, 200);
    outputSheet.setColumnWidth(2, 200);
  }

  // 2. READ EXISTING HISTORY (To know what to skip vs reprocess)
  const historyMap = new Map(); // Stores { rowNumber, isMatch }
  const lastRow = outputSheet.getLastRow();
  if (lastRow > 1) {
    // Read all existing results: [AmpName, MatchName, Method, ...]
    const historyData = outputSheet.getRange(2, 1, lastRow - 1, 3).getValues();

    for (let i = 0; i < historyData.length; i++) {
      const name = historyData[i][0].toString();
      const method = historyData[i][2].toString();
      // If method is NOT "No Match", we consider it done.
      const isSuccess =
        method !== "No Match" && method !== "Error" && method !== "";

      historyMap.set(name, {
        rowIndex: i + 2, // +2 because array is 0-indexed and sheet has header
        isSuccess: isSuccess,
      });
    }
  }

  // 3. PREPARE DATA
  console.log("Reading source data...");
  const dataAmp = sheetAmp
    .getDataRange()
    .getValues()
    .slice(1)
    .map((r) => r[0])
    .filter(Boolean);
  const dataMagic = sheetMagic
    .getDataRange()
    .getValues()
    .slice(1)
    .map((r) => r[0])
    .filter(Boolean);

  console.log(`Pre-processing ${dataMagic.length} target games...`);
  const magicDatabase = dataMagic.map((name) => ({
    original: name,
    clean: normalizeString(name),
    tokens: tokenize(name),
    coreTitle: extractCoreTitle(name),
  }));

  // 4. MAIN LOOP
  for (let i = 0; i < dataAmp.length; i++) {
    const ampName = dataAmp[i];
    const history = historyMap.get(ampName);

    // CHECK: Should we skip this?
    if (history && history.isSuccess) {
      // It exists AND was a successful match previously. Skip.
      if (i % 50 === 0)
        console.log(`Skipping row ${i + 1}: ${ampName} (Already Matched)`);
      continue;
    }

    console.log(
      `Processing row ${i + 1}/${dataAmp.length}: ${ampName} ${
        history ? "(Retrying No-Match)" : "(New)"
      }`
    );

    // --- MATCHING LOGIC ---
    const cleanAmp = normalizeString(ampName);
    const coreAmp = extractCoreTitle(ampName);

    let finalResult = {
      match: "",
      method: "No Match",
      confidence: "None",
      reasoning: "No suitable match found",
    };

    // STEP A: STRICT MATH (Only very high similarity)
    const strictCandidates = magicDatabase
      .map((item) => ({
        name: item.original,
        score: getSimilarity(cleanAmp, item.clean),
        coreScore: getSimilarity(coreAmp, item.coreTitle),
      }))
      .sort((a, b) => b.score - a.score);

    const bestMath = strictCandidates[0];

    if (bestMath.score >= MATCH_CONFIG.CONFIDENCE_STRICT_MATH) {
      finalResult = {
        match: bestMath.name,
        method: "Fuzzy Math (Exact)",
        confidence: "Very High",
        reasoning: `Score: ${(bestMath.score * 100).toFixed(1)}%`,
      };
    } else {
      // STEP B: PRE-FILTER - Only consider candidates where core titles are similar
      const coreCandidates = strictCandidates
        .filter((c) => c.coreScore >= 0.7)
        .slice(0, 5)
        .map((c) => c.name);

      if (coreCandidates.length > 0) {
        // STEP C: STRICT AI with pre-filtered candidates
        const strictAi = callGeminiStrict(ampName, coreCandidates);

        if (strictAi.matchFound) {
          finalResult = {
            match: strictAi.matchedName,
            method: "AI (Strict)",
            confidence: "High",
            reasoning: strictAi.reasoning || "AI confirmed exact identity",
          };
        }
      }

      // STEP D: If still no match, try token-based with VERY strict AI
      if (finalResult.method === "No Match") {
        const tokenCandidates = getBestTokenCandidates(ampName, magicDatabase);

        if (tokenCandidates.length > 0) {
          const smartAi = callGeminiSmart(ampName, tokenCandidates);
          if (smartAi.matchFound) {
            finalResult = {
              match: smartAi.matchedName,
              method: "AI (Smart Retry)",
              confidence: "High",
              reasoning:
                smartAi.reasoning || "AI matched via subtitle/token logic",
            };
          }
        }
      }
    }

    // 5. WRITE RESULT
    const rowData = [
      ampName,
      finalResult.match,
      finalResult.method,
      finalResult.confidence,
      finalResult.reasoning,
    ];

    if (history) {
      // OVERWRITE existing "No Match" row
      outputSheet.getRange(history.rowIndex, 1, 1, 5).setValues([rowData]);
    } else {
      // APPEND new row
      outputSheet.appendRow(rowData);
    }

    // Flush periodically to save progress
    if (i % 10 === 0) SpreadsheetApp.flush();
  }

  console.log("--- MATCHING COMPLETE ---");
}

// ==========================================
//              AI HELPERS
// ==========================================

function callGeminiStrict(targetName, candidates) {
  const prompt = `You are a strict game title matcher. Your job is to determine if any candidate is THE EXACT SAME GAME as the source.


SOURCE: "${targetName}"
CANDIDATES: ${JSON.stringify(candidates)}


CRITICAL RULES - READ CAREFULLY:


1. The CORE TITLE must be identical or nearly identical. "Bash Party" and "Flash Party" are DIFFERENT games. "Bingo Toys" and "Bingo Tycoon" are DIFFERENT games.


2. Acceptable variations ONLY:
  - Platform suffixes: "Game iOS" = "Game Android" = "Game"
  - Punctuation: "Game!" = "Game" 
  - Subtitles after colon: "Game: Subtitle" can match "Game"
  - Trademark symbols: "Game™" = "Game"
  - Minor word additions: "Game Master" might match "Game Master: Puzzle Edition"


3. NOT acceptable - these are DIFFERENT games:
  - Different first/main word: "Bash Party" ≠ "Flash Party", "Cash" ≠ "Crash"
  - Different second word: "Bingo Toys" ≠ "Bingo Tycoon", "Block Joy" ≠ "Block Strike"
  - Sharing category words only: "Carpet Cleaning" ≠ "Clean It: Cleaning Games"
  - Generic word overlap: "Block Puzzle" ≠ "1010! Block Puzzle Game" (different games with shared words)
  - Same genre but different game: "Bingo Journey JP" ≠ "Bingo Journey - Lucky Casino"


4. When in doubt, respond NO_MATCH. False positives are worse than false negatives.


Think step by step:
- What is the core title of the source (ignore iOS/Android/platform)?
- Does any candidate have the SAME core title?
- Are any single-letter or single-word differences that change the meaning?


Respond in this exact format:
MATCH: [exact candidate title from list] or NO_MATCH
REASON: [one sentence explanation]`;

  return executeGeminiRequest(prompt, candidates);
}

function callGeminiSmart(targetName, candidates) {
  const prompt = `You are an extremely conservative game title matcher. Match ONLY if you are 100% certain it's the same game.


SOURCE: "${targetName}"
CANDIDATES: ${JSON.stringify(candidates)}


STRICT MATCHING RULES:


The PRIMARY/CORE words of the title MUST match. Sharing some words is NOT enough.


EXAMPLES OF SAME GAME (acceptable matches):
- "3D Bolt Master™ Android" ↔ "3D Bolt Master™: Screw Master®" (core "3D Bolt Master" matches)
- "Cash Hoard Slots Android" ↔ "Cash Hoard Slots-Casino slots!" (core "Cash Hoard Slots" matches)
- "Archery Clash" ↔ "Archery Clash!" (identical except punctuation)


EXAMPLES OF DIFFERENT GAMES (must return NO_MATCH):
- "Bash Party" ≠ "Flash Party" (Bash ≠ Flash - different word!)
- "Bingo Toys" ≠ "Bingo Tycoon" (Toys ≠ Tycoon - different word!)
- "Block Joy" ≠ "Block Strike" (Joy ≠ Strike - different word!)
- "Carpet Cleaning" ≠ "Clean It: Cleaning Games" (completely different titles!)
- "Baseball Clash" ≠ "Slam Clash!" (Baseball ≠ Slam!)
- "Block Puzzle" ≠ "1010! Block Puzzle Game" (1010! is a specific different game)
- "Bingo Journey JP" ≠ "Bingo Journey - Lucky Casino" (JP version ≠ Lucky Casino version)
- "Bubble Fever" ≠ "Bubble Shooter" (Fever ≠ Shooter!)


KEY TEST: Remove platform words (iOS, Android, Mobile). If the remaining core titles differ by even ONE main word, it's NO_MATCH.


DEFAULT TO NO_MATCH if there's any doubt.


Respond in this exact format:
MATCH: [exact candidate title from list] or NO_MATCH
REASON: [one sentence explanation]`;

  return executeGeminiRequest(prompt, candidates);
}

function executeGeminiRequest(promptText, validCandidates) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${MATCH_CONFIG.GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.1, // Low temperature for more deterministic matching
    },
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    Utilities.sleep(200); // Throttling for safety
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());

    if (json.error) {
      console.warn("AI Error (skipping): " + json.error.message);
      return { matchFound: false };
    }

    const rawAnswer =
      json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Parse the structured response
    const matchLine = rawAnswer
      .split("\n")
      .find((line) => line.startsWith("MATCH:"));
    const reasonLine = rawAnswer
      .split("\n")
      .find((line) => line.startsWith("REASON:"));

    if (!matchLine) {
      console.log("AI response format issue:", rawAnswer.substring(0, 100));
      return { matchFound: false };
    }

    const matchValue = matchLine
      .replace("MATCH:", "")
      .trim()
      .replace(/^"|"$/g, "");
    const reasonValue = reasonLine
      ? reasonLine.replace("REASON:", "").trim()
      : "";

    if (matchValue && matchValue !== "NO_MATCH") {
      // Verify the match is actually in our candidate list
      const foundCandidate = validCandidates.find(
        (c) =>
          c === matchValue ||
          c.toLowerCase() === matchValue.toLowerCase() ||
          normalizeString(c) === normalizeString(matchValue)
      );

      if (foundCandidate) {
        return {
          matchFound: true,
          matchedName: foundCandidate,
          reasoning: reasonValue,
        };
      } else {
        console.log(`AI returned "${matchValue}" but not found in candidates`);
      }
    }

    return { matchFound: false, reasoning: reasonValue };
  } catch (e) {
    console.error("API Request Exception", e);
    return { matchFound: false };
  }
}

// ==========================================
//            MATH & TOKEN HELPERS
// ==========================================

function normalizeString(str) {
  return str
    ? str
        .toString()
        .toLowerCase()
        .replace(/\&/g, "and")
        .replace(/\b(ios|android|aos|mobile|hd|jp|us|uk|de|fr|galaxy)\b/gi, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

/**
 * Extract the core title by removing platform identifiers and common suffixes
 */
function extractCoreTitle(str) {
  if (!str) return "";
  return str
    .toString()
    .replace(/\s*(iOS|Android|AOS|Mobile|HD|JP|US|UK|DE|FR|Galaxy)\s*$/gi, "") // Remove platform at end
    .replace(/\s*[-–:]\s*(iOS|Android|AOS|Mobile).*$/gi, "") // Remove "- iOS" style suffixes
    .replace(/[™®©]/g, "") // Remove trademark symbols
    .replace(/\s*[-–:]\s*$/, "") // Remove trailing dashes/colons
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(str) {
  return str
    ? str
        .toString()
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 1 &&
            !["ios", "android", "mobile", "hd", "the", "and", "for"].includes(w)
        )
    : [];
}

function getSimilarity(s1, s2) {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  const l = s1.length > s2.length ? s1 : s2;
  const s = s1.length > s2.length ? s2 : s1;
  if (l.length === 0) return 1.0;
  return (l.length - levenshteinDistance(l, s)) / l.length;
}

function levenshteinDistance(s, t) {
  const d = [];
  const n = s.length;
  const m = t.length;
  if (n == 0) return m;
  if (m == 0) return n;
  for (let i = n; i >= 0; i--) d[i] = [];
  for (let i = n; i >= 0; i--) d[i][0] = i;
  for (let j = m; j >= 0; j--) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s.charAt(i - 1) === t.charAt(j - 1) ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[n][m];
}

function getBestTokenCandidates(sourceName, magicDatabase) {
  const sourceTokens = tokenize(sourceName);
  const sourceCore = extractCoreTitle(sourceName);
  if (sourceTokens.length === 0) return [];
  return (
    magicDatabase
      .map((item) => {
        const tokenOverlap =
          sourceTokens.filter((t) => item.tokens.includes(t)).length /
          sourceTokens.length;
        const coreSimlarity = getSimilarity(sourceCore, item.coreTitle);

        return {
          name: item.original,
          tokenScore: tokenOverlap,
          coreScore: coreSimlarity,
          // Combined score that heavily weights core title similarity
          combinedScore: coreSimlarity * 0.7 + tokenOverlap * 0.3,
        };
      })
      // STRICT: Require decent core similarity, not just token overlap
      .filter((x) => x.coreScore >= 0.5 && x.tokenScore >= 0.3)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, MATCH_CONFIG.TOKEN_CANDIDATE_POOL)
      .map((x) => x.name)
  );
}
