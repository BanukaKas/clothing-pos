# MINT FASHION POS — User Operational Guide

## Overview
**MINT FASHION POS** is a modern, offline retail clothing management suite designed for boutiques, apparel chains, and garment retail shops.

---

## 1. Point of Sale (POS) & Checkout
1. **Barcode Scanning**:
   - Point your 1D/2D barcode scanner at any garment hang tag.
   - The system automatically detects whether the barcode is a base product or a specific variant (Size & Color).
   - The garment is instantly added to the active cart.
2. **Manual Garment Selection**:
   - Search by product title, brand, or SKU in the search bar.
   - Select the desired Size (XS, S, M, L, XL, etc.) and Color on the garment card.
   - Click **Add to Cart**.
3. **Cart Operations**:
   - Adjust quantities with `+` and `-`.
   - Apply line discounts or global order discounts.
4. **Checkout**:
   - Select tender: **Cash**, **Card**, **Bank Transfer**, or **Split**.
   - For cash, enter received cash amount to compute exact customer change.
   - Click **Complete Sale**.
   - An atomic SQLite transaction deducts variant stock, records the sale, updates customer loyalty, logs payment, and generates a printable receipt.

---

## 2. Barcode Studio & Label Printing
1. Navigate to **Barcode Studio** in the sidebar.
2. **Filter & Search**:
   - Filter by retail category, garment size, or color.
   - Search by SKU or barcode.
3. **Print Labels**:
   - Check the items you wish to print.
   - Click **Print Selected**.
   - In the **Thermal Barcode Label Studio**:
     - Select preset dimensions (40×30mm, 50×25mm, 60×40mm, or Custom).
     - Customize printed fields (Store Name, Product Title, Variant, SKU, Selling Price, Barcode Graphic, Numbers).
     - Adjust print quantity per item.
     - Review the real-time preview and click **Print Labels**.
4. **Barcode Regeneration**:
   - To re-barcode a product or variant, click the **Regenerate** button on its row.
   - Confirm the prompt. The system generates a collision-free Code 128 or EAN-13 barcode and updates SQLite immediately.

---

## 3. Garment Catalog Management
- Add new garments with multiple sizes and colors.
- Upload thumbnail images.
- Set purchase cost, retail selling price, and reorder notification thresholds.
- Edit garment details anytime without altering existing barcodes unless explicitly regenerated.

---

## 4. Inventory & Stock Adjustments
- View variant-level stock across all sizes and colors.
- Perform stock adjustments (receiving stock, counting corrections, damages, returns).
- Review full stock movement audit trail.
- Monitor low-stock alerts on the dashboard and inventory screens.
