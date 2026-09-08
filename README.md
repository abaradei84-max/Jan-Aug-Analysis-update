# Jan–Aug Analysis Update

Interactive GitHub Pages sales dashboard comparing **January–August 2025 vs January–August 2026**.

## Features
- Connected multi-select filters: Zone, State, Customer Name, Line Name, Item Name, Sales Return Value
- 2025 vs 2026 net-sales KPIs and monthly trend
- Top 10 customers with growth **>= 10%**, selectable by State
- Top 10 customers with decline **>= 10%**, selectable by State
- Sales analysis by Item, Zone and State
- Customers with 2026 Jan–Aug net sales **>= 10,000**
- Return value and return-rate analysis
- Responsive Plotly charts
- Neon + glassmorphism visual design
- Excel processing happens locally in the browser; customer data is not committed to this public repository

## Load the real Excel files
Open the dashboard and click **Load 2025 + 2026 Excel**. Select both workbooks together.

The dashboard automatically finds the sales sheet and maps the actual columns used in the supplied workbooks:

| Dashboard concept | Excel column |
|---|---|
| Year | `Year` |
| Month | `Month ` |
| Zone | `Zone name` |
| State | `State` |
| Customer | `Name` |
| Line | `Line Name` / `Line name` |
| Item | `Item name` |
| Net sales | `Net Amount (Invoiced)` |
| Gross sales | `Sold Amount (Invoiced)` |
| Returns | `Returned Amount (Invoiced)` |

Only months **January through August** are included for both years, so the comparison uses the same period.

## Calculation notes
- Net Sales = `Net Amount (Invoiced)`
- Return Value = absolute value of `Returned Amount (Invoiced)`
- Return Rate = `Returned Amount / Sold Amount * 100`
- YoY Growth % = `(Net Sales 2026 - Net Sales 2025) / Net Sales 2025 * 100`
- Customers with zero 2025 baseline are excluded from percentage growth/decline rankings to avoid invalid division
- The >= 10,000 customer table uses **2026 Jan–Aug net sales after the current filters are applied**

## Privacy
This repository is public. The real Excel files and customer-level sales data are intentionally **not stored in GitHub**. When you select the files from the dashboard, SheetJS reads them locally in your browser and the analysis is performed client-side.

## Publish with GitHub Pages
In GitHub open **Settings → Pages**, choose **Deploy from a branch**, then select:
- Branch: `main`
- Folder: `/ (root)`

Save the settings.

## Files
- `index.html` — dashboard layout and Excel loader
- `styles.css` — neon / glass UI
- `app.js` — Excel parsing, linked filters, calculations and charts
- `data/sample-sales.csv` — demo file retained for development only
