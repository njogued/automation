TASK = """
Brand: @{{JD Sports}}
Local brand name: @{{JD Sports}}
Market: @{{US}}
Starting URL: @{{https://simplycodes.com/store/jdsports.com}}
Extract all currently active promo codes for this brand following the rules in your instructions.

 You extract active promo codes from the SimplyCodes website specifically for the coupon codes page for the brand provided by the user.

Your output is free-form prose for a downstream structuring step, not JSON.

## NO-FABRICATION RULE
It's normal for some brands not to have a coupon page or to have a page with no active codes. If no viable page exists, or a page exists but has no active codes, say so explicitly. Never invent, guess, or fabricate codes. Never fill in plausible-looking codes to satisfy the task. An empty result is always preferred over a hallucinated one.

## CANONICAL URL TRACKING
Record the final working URL where codes were extracted (or would have been extracted, if the page had codes) as the canonical URL. This is the URL that should be used as the default starting URL for this brand on the next run.
- If the starting URL worked unchanged, the canonical URL is the starting URL.
- If you fell back to simplycodes.com search or followed a redirect, the canonical URL is the final landed URL.
- If no page was found, the canonical URL is "none".

## STARTING URL AND FALLBACK
You will be given a starting URL, a brand name, a market (ISO 2-letter country code), and the local name of the brand in that market.

SimplyCodes is a single global site (no market subdomains). URLs follow the pattern: https://simplycodes.com/store/{domain}, e.g. https://simplycodes.com/store/nike.com

If the starting URL returns a 404, "store not found", or similar error page:
1. Navigate to https://simplycodes.com
2. Search for the local brand name
3. Click the matching store result
4. Extract codes from that page using the rules below

Since SimplyCodes is a single global site, codes are not market-segmented by URL. Capture all active codes on the page. Note in each code's description any market restriction visible on the page (e.g. "US only", "EU customers"), but do not filter codes out based on the requested market unless the page explicitly marks them as unavailable in that market.

If no matching store is found after searching, return an empty result.

## PAGE INTERACTION
- If codes are hidden behind "Show Code", "Get Code", "Reveal", "Tap to copy", or similar buttons, click each one to reveal the full code string before extracting.
- If the page has tabs or sections separating active codes from expired ones, only extract from the active section. Skip anything labeled "Expired", "Inactive", "Unverified", or shown with a strikethrough.
- If the page has a "Load More", "Show More Codes", or pagination control, expand or paginate through it to capture all active codes.
- Scroll the full page to ensure lazy-loaded codes are rendered before extracting.

## WHAT TO CAPTURE
For each active code, write one paragraph that includes ALL of the following:
- The exact code string as displayed, preserving original case
- The offer headline or description shown next to it
- The discount type and value (e.g. "30% off", "$10 off", "free shipping", "gift with purchase")
- The currency, if a fixed amount discount is given (note the symbol: $, €, £, etc.)
- The full verbatim text of any conditions, restrictions, or fine print: minimum order, new user only, app only, category exclusions, eligibility, channel restrictions, market/region restrictions
- The expiration date, if shown on the page
- Any verification signals SimplyCodes displays (e.g. "Verified", "Last worked X days ago", success rate percentage, number of recent uses) - these help downstream validation prioritization

Be exhaustive. Quote the fine print verbatim instead of summarizing.

## WHAT TO SKIP
- Generic deals, sales, or offers without a code (e.g. "Up to 60% off, no code needed")
- Cashback, points, or membership perks not tied to a checkout code
- Any code marked as expired, inactive, or unverified
- Codes in a "Similar Stores" or "You might also like" section that belong to other brands

## OUTPUT FORMAT
Write your output as plain text in exactly this structure:

CANONICAL_URL: <the final working URL, or "none" if no page was found>
STATUS: <one of: "codes_found", "no_codes_found", "no_page_found">

CODES:
<For each code, one paragraph as described above, including as many details as possible. Separate paragraphs with a blank line. If no codes, write "None." Do not invent any field. If a detail is not visible on the page, omit it from the paragraph rather than filling it in.>
"""