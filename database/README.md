# MINT FASHION POS — SQLite Database Architecture

## 1. Storage Location
The persistent SQLite database is stored outside the application installation folder in the Windows user profile:
```
%APPDATA%/mint-fashion-pos/database/mint-fashion.db
```
*(E.g. `C:\Users\<Username>\AppData\Roaming\mint-fashion-pos\database\mint-fashion.db`)*

### Why this location?
- **Update Safety**: Installing a new application version, setup installer, or software update will never overwrite or erase `%APPDATA%`.
- **Permission Safety**: Avoids Windows UAC permission restrictions associated with `C:\Program Files`.
- **Uninstall Safety**: Electron builder NSIS configuration sets `deleteAppDataOnUninstall: false` so customer business records are protected.

---

## 2. Relational Database Tables (19 Tables)

| # | Table Name | Purpose | Primary Key | Key Foreign Keys |
|---|------------|---------|-------------|------------------|
| 1 | `roles` | Access roles & permission JSON | `id` | - |
| 2 | `users` | Cashiers, Managers, Administrators | `id` | - |
| 3 | `categories` | Clothing categories with accent colors | `id` | - |
| 4 | `products` | Garment catalog with SKU & Barcode | `id` | - |
| 5 | `product_variants`| Variant sizes, colors, SKUs, barcodes | `id` | `product_id -> products.id` |
| 6 | `suppliers` | Vendor directory & terms | `id` | - |
| 7 | `purchases` | Inward stock PO orders | `id` | `supplier_id -> suppliers.id` |
| 8 | `purchase_items`| PO line items | `id` | `purchase_id -> purchases.id` |
| 9 | `customers` | Retail customers & loyalty points | `id` | - |
| 10| `sales` | Sales transactions & invoices | `id` | `customer_id -> customers.id` |
| 11| `sale_items` | Individual garments sold in a transaction | `id` | `sale_id -> sales.id` |
| 12| `payments` | Payment tenders (cash/card/bank/split) | `id` | `sale_id -> sales.id` |
| 13| `returns` | Customer garment returns & refunds | `id` | `sale_id -> sales.id` |
| 14| `return_items`| Returned garments breakdown | `id` | `return_id -> returns.id` |
| 15| `stock_movements`| Immutable inventory audit ledger | `id` | `product_id -> products.id` |
| 16| `expenses` | Store operating expenses | `id` | - |
| 17| `cash_sessions`| Cash register drawer shifts | `id` | - |
| 18| `settings` | Key-value store configuration | `key` | - |
| 19| `audit_logs` | Security & operational action logs | `id` | - |

---

## 3. Barcode System Integration
- `products.barcode`: Unique Code 128 or EAN-13 barcode for the garment style.
- `product_variants.barcode`: Unique variant barcode for size/color combinations.
- Indexed with `idx_products_barcode` and `idx_variants_barcode` for sub-millisecond barcode scanner response at POS checkout.

---

## 4. Automatic Backup & Safe Migration Strategy
1. Before any new schema migration is applied, the system generates an automatic snapshot in `%APPDATA%/mint-fashion-pos/database/backups/pre-migration-backup-<timestamp>.db`.
2. Migrations are executed in an atomic transaction.
3. Post-migration integrity is verified with SQLite `PRAGMA integrity_check`.
4. If existing customer products are detected, demo seed data is skipped entirely.
