// global variables

// 1. Sheet Names
const SHEET_CONTACTS = "Contacts";
const SHEET_DEALS = "Deals";
const SHEET_ACTIVITIES = "Sales Acts";
const SHEET_FINANCE = "Finance";
const SHEET_AM = "Accounts";
const SHEET_LOG = "Log";
const SHEET_MERGE = "Mail Merge";
const SHEET_TEMPLATES = "Templates";
const SHEET_REMINDERS = "Reminders";

// 2. Sheets Headers
// Contacts sheet headers
const CONTACT_HEADERS = {
  ID: "Contact ID",
  STATUS: "Status",
  COMPANY: "Company",
  EMAIL: "Email",
  DEAL_ID: "Deal ID",
  ACTIVITY: "Activity",
  NEXT_TOUCH: "Next Touch Point",
  FIRST_NAME: "First Name",
  LAST_NAME: "Last Name",
  LAST_CONTACTED: "Last Contacted",
  RECENT_EMAIL: "Recent Sent Email",
  LAST_INCOMING: "Last Incoming Email",
  AI_NOTES: "AI Notes"
};

// Deals sheet headers
const DEAL_HEADERS = {
  ID: "Deal ID",
  NAME: "Deal Name",
  COMPANY: "Company",
  CONTACT_ID: "Contact ID",
  PRIMARY_CONTACT: "Primary Contact",
  DATE: "Creation Date",
  STAGE: "Stage",
  NEXT_STEP: "Next Step",
  NEXT_STEP_DATE: "Next Step Date",
  VALUE: "Deal Value"
};

// Finance sheet headers
const FINANCE_HEADERS = {
  EMAIL: "Contact Email",
  AMOUNT: "Amount",
  STATUS: "Status",
  DATE_WON: "Date Won"
};

// AM sheet headers
const AM_HEADERS = {
  EMAIL: "Contact Email",
  STATUS: "Onboarding Status",
  CONTRACT_START: "Contract Start Date"
};

const ACTIVITIES_HEADERS = {
  EMAIL: "Contact Email",
  TYPE: "Type",
  DATE: "Date",
  STATUS: "Status",
  OWNER: "Owner",
  SUMMARY: "Summary"
}

const REMINDER_HEADERS = {
  FULL_NAME: "Full Name",
  EMAIL: "Email",
  PURPOSE: "Purpose",
  DATE: "Date",
  RECURRING: "Recurrence"
}

const MERGE_HEADERS = {
  STATUS: "Status"
}

// 3. Dropdown Values
const DEAL_STAGES = {
  QUALIFIED: "Qualified",
  NEW: "New",
  WON: "Won"
};

const ACTIVITY_STATUS = {
  OPEN: "OPEN"
};

const FINANCE_STATUS = {
  TO_INVOICE: "To Invoice"
};

const AM_STATUS = {
  NOT_STARTED: "Not Started"
};

const MERGE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive"
};