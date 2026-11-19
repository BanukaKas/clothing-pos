# MINT FASHION POS — Windows Desktop Installation Guide

## System Requirements
- **Operating System**: Windows 10, Windows 11, or Windows Server (64-bit x64).
- **RAM**: 4 GB minimum (8 GB recommended).
- **Storage**: 500 MB free hard drive space.
- **Display**: 1366 × 768 minimum resolution (1920 × 1080 recommended).
- **Barcode Scanner**: Standard 1D / 2D USB or Bluetooth barcode scanner (Plug & Play, Keyboard Wedge mode).
- **Receipt / Label Printer**: 80mm / 58mm POS thermal receipt printer, and 40×30mm / 50×25mm / 60×40mm label printer.
- **Internet Connection**: **None required**. The application is 100% offline.

---

## Fresh Installation on a Customer Laptop

1. Copy the setup file `MINT-FASHION-POS-Setup.exe` from the `customer-release/` folder or USB flash drive onto the customer's laptop.
2. Double-click `MINT-FASHION-POS-Setup.exe`.
3. Choose the desired installation folder (default is `C:\Users\<User>\AppData\Local\Programs\MINT FASHION POS`).
4. Keep the options to create a **Desktop Shortcut** and **Start Menu Shortcut** checked.
5. Click **Install**. The setup wizard installs all files and sets up the local runtime.
6. Once installation completes, click **Finish**.
7. MINT FASHION POS launches automatically and initializes the permanent SQLite database at:
   `%APPDATA%/mint-fashion-pos/database/mint-fashion.db`.

---

## Default Login Credentials
- **Role**: Administrator
- **Username**: `admin`
- **Password**: `admin123`

*(Please change your password immediately after initial setup via the **Users** screen).*

---

## Updating an Existing Installation Without Losing Data

When a newer version of MINT FASHION POS is released:
1. Do **NOT** manually delete the database or uninstall the application.
2. Simply double-click the new `MINT-FASHION-POS-Setup.exe`.
3. The installer safely upgrades application binaries while preserving:
   - All customer product inventory and variant barcodes.
   - All past sales receipts and transactions.
   - Customer records and loyalty points.
   - User accounts and login credentials.
   - Store settings and tax configurations.
4. On first launch of the new version:
   - An automatic pre-migration backup of the active database is saved into `%APPDATA%/mint-fashion-pos/database/backups/`.
   - New database schema migrations are applied atomically.
   - Database integrity is checked and verified.
