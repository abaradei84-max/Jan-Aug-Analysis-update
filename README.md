# Jan–Aug Analysis Update

Interactive GitHub Pages sales dashboard comparing the same period in **2025 vs 2026**.

## Features
- Connected multi-select filters: Zone, State, Customer Name, Line Name, Item Name, Sales Return Value
- 2025 vs 2026 sales KPIs and monthly trend
- Top 10 customers with growth **>= 10%**, selectable by State
- Top 10 customers with decline **>= 10%**, selectable by State
- Sales analysis by Item, Zone and State
- Customers with 2026 selected-period sales **>= 10,000**
- Return value and return-rate analysis
- Responsive charts
- Neon + glassmorphism visual design
- Client-side CSV processing (no server required)

## Data file
For automatic loading, add your real file as:

`data/sales.csv`

You can also upload a CSV from the dashboard using **Upload CSV**. A small demo file is included at `data/sample-sales.csv` so the UI can be previewed immediately.

### Supported columns
The parser accepts common aliases, including:

| Required concept | Supported examples |
|---|---|
| Date / period | `date`, `invoice date`, `sales date`, or `year` + `month` |
| Zone | `zone`, `sales zone`, `region` |
| State | `state`, `sales state`, `province` |
| Customer | `name`, `customer name`, `customer`, `client name` |
| Line | `line name`, `line`, `product line` |
| Item | `item name`, `item`, `product name`, `sku name` |
| Sales | `sales value`, `sales`, `net sales`, `sales amount`, `amount` |
| Returns | `sales return value`, `return value`, `returns`, `sales returns`, `return amount` |

Only rows with year **2025** or **2026** are included in the comparison.

## Calculation notes
- YoY Growth % = `(Sales 2026 - Sales 2025) / Sales 2025 * 100`
- Customers with zero 2025 baseline are excluded from percentage growth/decline rankings to avoid invalid division.
- Return Rate = `2026 Return Value / 2026 Sales * 100`
- The >= 10,000 customer table uses **2026 sales after the current filters are applied**.

## Publish with GitHub Pages
In GitHub open **Settings → Pages**, choose **Deploy from a branch**, then select:
- Branch: `main`
- Folder: `/ (root)`

Save the settings. The site will then be served as a GitHub Pages website.

## Files
- `index.html` — dashboard layout
- `styles.css` — neon / glass UI
- `app.js` — data parsing, linked filters, calculations, charts
- `data/sample-sales.csv` — demo data only
