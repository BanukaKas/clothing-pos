# MINT FASHION POS — Database Administration & Recovery Guide

## 1. Physical Database Location
```
%APPDATA%/mint-fashion-pos/database/mint-fashion.db
```
The database engine is SQLite compiled to WebAssembly (`sql.js`), running locally inside the Electron Main Process.

---

## 2. Manual Backup Creation
Store administrators can create a full database backup at any time:
1. Open **Settings** or **Dashboard**.
2. Click **Backup Database**.
3. A Windows Save File Dialog opens. Choose any destination (e.g. an external USB drive, network share, or cloud folder).
4. The database writes an atomic copy.

---

## 3. Database Restoration
To restore a database backup:
1. Open **Settings**.
2. Click **Restore Database**.
3. Select the `.db` or `.sqlite` backup file.
4. MINT FASHION POS verifies the database with `PRAGMA integrity_check`.
5. Upon verification, the live database is hot-reloaded with the restored data.

---

## 4. Disaster Recovery
If a computer experiences hardware failure or OS crash:
1. Locate the backup file from your USB or cloud backup.
2. Install MINT FASHION POS on the new computer.
3. Launch the app once to generate the database folder.
4. Copy the backup file to:
   `%APPDATA%/mint-fashion-pos/database/mint-fashion.db`
5. Restart MINT FASHION POS. All business records, products, barcodes, and transactions will be immediately available.
