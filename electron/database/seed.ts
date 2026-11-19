import { Database } from 'sql.js';
import * as bcrypt from 'bcryptjs';

export function seedInitialData(db: Database): void {
  // 1. Roles
  const roles = [
    { id: 'role-admin', name: 'Administrator', permissions: 'all' },
    { id: 'role-manager', name: 'Store Manager', permissions: 'pos,products,inventory,sales,reports,settings,customers' },
    { id: 'role-cashier', name: 'Senior Cashier', permissions: 'pos,returns,customers,sales' },
    { id: 'role-associate', name: 'Sales Associate', permissions: 'pos,products_view' },
  ];

  for (const r of roles) {
    db.run(
      'INSERT OR IGNORE INTO roles (id, name, permissions) VALUES (?, ?, ?);',
      [r.id, r.name, r.permissions]
    );
  }

  // 2. Users (Hashed passwords with bcrypt)
  const salt = bcrypt.genSaltSync(8);
  const defaultPasswordHash = bcrypt.hashSync('admin123', salt);

  const users = [
    {
      id: 'user-1',
      name: 'Amara Perera',
      username: 'amara.p',
      role: 'Store Manager',
      email: 'amara.p@mintfashion.lk',
      status: 'active',
      last_login: '2026-10-29 09:30 AM',
    },
    {
      id: 'user-2',
      name: 'Nuwan Bandara',
      username: 'nuwan.b',
      role: 'Senior Cashier',
      email: 'nuwan.b@mintfashion.lk',
      status: 'active',
      last_login: '2026-10-29 11:15 AM',
    },
    {
      id: 'user-3',
      name: 'Kasun Rathnayake',
      username: 'kasun.admin',
      role: 'Administrator',
      email: 'kasun.admin@mintfashion.lk',
      status: 'active',
      last_login: '2026-10-27 10:00 AM',
    },
    {
      id: 'user-4',
      name: 'Anuki De Silva',
      username: 'anuki.d',
      role: 'Sales Associate',
      email: 'anuki.d@mintfashion.lk',
      status: 'active',
      last_login: '2026-10-28 05:40 PM',
    },
  ];

  for (const u of users) {
    db.run(
      `INSERT OR IGNORE INTO users (id, name, username, password_hash, role, email, status, last_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [u.id, u.name, u.username, defaultPasswordHash, u.role, u.email, u.status, u.last_login]
    );
  }

  // 3. Categories
  const categories = [
    { id: 'cat-1', name: 'Shirts & Tops', slug: 'shirts-tops', description: 'Formal, casual and linen shirts', accentColor: '#059669' },
    { id: 'cat-2', name: 'Denim & Jeans', slug: 'denim-jeans', description: 'Selvedge, slim fit and stretch denim', accentColor: '#2563eb' },
    { id: 'cat-3', name: 'Dresses', slug: 'dresses', description: 'Summer, formal and evening dresses', accentColor: '#db2777' },
    { id: 'cat-4', name: 'T-Shirts & Polos', slug: 'tshirts-polos', description: 'Heavyweight organic cotton basics', accentColor: '#0d9488' },
    { id: 'cat-5', name: 'Trousers & Chinos', slug: 'trousers-chinos', description: 'Pleated trousers, casual chinos', accentColor: '#ca8a04' },
    { id: 'cat-6', name: 'Jackets & Blazers', slug: 'jackets-blazers', description: 'Tailored blazers, denim & bomber jackets', accentColor: '#7c3aed' },
    { id: 'cat-7', name: 'Shoes & Footwear', slug: 'footwear', description: 'Sneakers, loafers and leather boots', accentColor: '#4b5563' },
  ];

  for (const c of categories) {
    db.run(
      'INSERT OR IGNORE INTO categories (id, name, slug, description, accent_color) VALUES (?, ?, ?, ?, ?);',
      [c.id, c.name, c.slug, c.description, c.accentColor]
    );
  }

  // 4. Products & Product Variants
  const products = [
    {
      id: 'prod-1',
      name: 'Signature Oxford Cotton Shirt',
      sku: 'MNT-SH-001',
      barcode: '890123456701',
      category: 'Shirts & Tops',
      brand: 'Mint Couture',
      description: '100% long-staple combed cotton tailored button-down shirt with mother-of-pearl buttons.',
      purchaseCost: 3800,
      sellingPrice: 7900,
      reorderLevel: 15,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-1-1', size: 'S', colorName: 'Sky Blue', colorHex: '#bae6fd', sku: 'MNT-SH-001-S-BLU', stock: 12 },
        { id: 'var-1-2', size: 'M', colorName: 'Sky Blue', colorHex: '#bae6fd', sku: 'MNT-SH-001-M-BLU', stock: 18 },
        { id: 'var-1-3', size: 'L', colorName: 'Sky Blue', colorHex: '#bae6fd', sku: 'MNT-SH-001-L-BLU', stock: 14 },
        { id: 'var-1-4', size: 'M', colorName: 'Pure White', colorHex: '#ffffff', sku: 'MNT-SH-001-M-WHT', stock: 22 },
        { id: 'var-1-5', size: 'L', colorName: 'Pure White', colorHex: '#ffffff', sku: 'MNT-SH-001-L-WHT', stock: 16 },
      ],
    },
    {
      id: 'prod-2',
      name: 'Slim-Fit Indigo Selvedge Jeans',
      sku: 'MNT-DN-002',
      barcode: '890123456702',
      category: 'Denim & Jeans',
      brand: 'Mint Denim Lab',
      description: '13.5oz raw Japanese selvedge denim crafted with custom antique copper hardware.',
      purchaseCost: 6500,
      sellingPrice: 13500,
      reorderLevel: 10,
      image: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-2-1', size: '30', colorName: 'Deep Indigo', colorHex: '#1e3a8a', sku: 'MNT-DN-002-30-IND', stock: 8 },
        { id: 'var-2-2', size: '32', colorName: 'Deep Indigo', colorHex: '#1e3a8a', sku: 'MNT-DN-002-32-IND', stock: 15 },
        { id: 'var-2-3', size: '34', colorName: 'Deep Indigo', colorHex: '#1e3a8a', sku: 'MNT-DN-002-34-IND', stock: 10 },
        { id: 'var-2-4', size: '32', colorName: 'Washed Black', colorHex: '#262626', sku: 'MNT-DN-002-32-BLK', stock: 6 },
      ],
    },
    {
      id: 'prod-3',
      name: 'Linen Blend Summer Midi Dress',
      sku: 'MNT-DR-003',
      barcode: '890123456703',
      category: 'Dresses',
      brand: 'Aura by Mint',
      description: 'Breathable European linen dress with tiered hem, delicate shoulder ties and side pockets.',
      purchaseCost: 5200,
      sellingPrice: 11900,
      reorderLevel: 8,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-3-1', size: 'S', colorName: 'Terracotta', colorHex: '#c2410c', sku: 'MNT-DR-003-S-TER', stock: 5 },
        { id: 'var-3-2', size: 'M', colorName: 'Terracotta', colorHex: '#c2410c', sku: 'MNT-DR-003-M-TER', stock: 8 },
        { id: 'var-3-3', size: 'M', colorName: 'Olive Green', colorHex: '#3f6212', sku: 'MNT-DR-003-M-OLV', stock: 4 },
        { id: 'var-3-4', size: 'S', colorName: 'Ivory Cream', colorHex: '#fef3c7', sku: 'MNT-DR-003-S-IVR', stock: 7 },
      ],
    },
    {
      id: 'prod-4',
      name: 'Classic Heavyweight Cotton Tee',
      sku: 'MNT-TS-004',
      barcode: '890123456704',
      category: 'T-Shirts & Polos',
      brand: 'Mint Basics',
      description: '240 GSM pre-shrunk combed organic cotton jersey with ribbed collar and seamless sides.',
      purchaseCost: 1800,
      sellingPrice: 3900,
      reorderLevel: 25,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-4-1', size: 'S', colorName: 'Forest Green', colorHex: '#064e3b', sku: 'MNT-TS-004-S-GRN', stock: 15 },
        { id: 'var-4-2', size: 'M', colorName: 'Forest Green', colorHex: '#064e3b', sku: 'MNT-TS-004-M-GRN', stock: 25 },
        { id: 'var-4-3', size: 'L', colorName: 'Forest Green', colorHex: '#064e3b', sku: 'MNT-TS-004-L-GRN', stock: 20 },
        { id: 'var-4-4', size: 'M', colorName: 'Charcoal Grey', colorHex: '#374151', sku: 'MNT-TS-004-M-CHR', stock: 30 },
        { id: 'var-4-5', size: 'L', colorName: 'Off White', colorHex: '#f3f4f6', sku: 'MNT-TS-004-L-WHT', stock: 24 },
      ],
    },
    {
      id: 'prod-5',
      name: 'Tailored Italian Wool Blazer',
      sku: 'MNT-JK-005',
      barcode: '890123456705',
      category: 'Jackets & Blazers',
      brand: 'Mint Sartorial',
      description: 'Super 120s Italian wool single-breasted blazer featuring notch lapels and cupro silk lining.',
      purchaseCost: 14000,
      sellingPrice: 28500,
      reorderLevel: 5,
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-5-1', size: 'S', colorName: 'Midnight Navy', colorHex: '#0f172a', sku: 'MNT-JK-005-S-NVY', stock: 3 },
        { id: 'var-5-2', size: 'M', colorName: 'Midnight Navy', colorHex: '#0f172a', sku: 'MNT-JK-005-M-NVY', stock: 4 },
        { id: 'var-5-3', size: 'L', colorName: 'Midnight Navy', colorHex: '#0f172a', sku: 'MNT-JK-005-L-NVY', stock: 2 },
        { id: 'var-5-4', size: 'M', colorName: 'Camel Tan', colorHex: '#b45309', sku: 'MNT-JK-005-M-CAM', stock: 3 },
      ],
    },
    {
      id: 'prod-6',
      name: 'Relaxed Tapered Chino Trousers',
      sku: 'MNT-TR-006',
      barcode: '890123456706',
      category: 'Trousers & Chinos',
      brand: 'Mint Basics',
      description: 'Garment-dyed stretch cotton twill with comfortable mid-rise and subtle front pleats.',
      purchaseCost: 3600,
      sellingPrice: 7500,
      reorderLevel: 10,
      image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-6-1', size: '30', colorName: 'Khaki Stone', colorHex: '#a8a29e', sku: 'MNT-TR-006-30-KHK', stock: 7 },
        { id: 'var-6-2', size: '32', colorName: 'Khaki Stone', colorHex: '#a8a29e', sku: 'MNT-TR-006-32-KHK', stock: 12 },
        { id: 'var-6-3', size: '34', colorName: 'Khaki Stone', colorHex: '#a8a29e', sku: 'MNT-TR-006-34-KHK', stock: 9 },
        { id: 'var-6-4', size: '32', colorName: 'Black', colorHex: '#171717', sku: 'MNT-TR-006-32-BLK', stock: 8 },
      ],
    },
    {
      id: 'prod-7',
      name: 'Vintage Washed Denim Trucker Jacket',
      sku: 'MNT-JK-007',
      barcode: '890123456707',
      category: 'Jackets & Blazers',
      brand: 'Mint Denim Lab',
      description: 'Classic 14oz denim jacket with distressed wash, dual chest pockets, and waist adjusters.',
      purchaseCost: 7200,
      sellingPrice: 15900,
      reorderLevel: 6,
      image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-7-1', size: 'S', colorName: 'Stone Wash Blue', colorHex: '#60a5fa', sku: 'MNT-JK-007-S-BLU', stock: 4 },
        { id: 'var-7-2', size: 'M', colorName: 'Stone Wash Blue', colorHex: '#60a5fa', sku: 'MNT-JK-007-M-BLU', stock: 6 },
        { id: 'var-7-3', size: 'L', colorName: 'Stone Wash Blue', colorHex: '#60a5fa', sku: 'MNT-JK-007-L-BLU', stock: 4 },
      ],
    },
    {
      id: 'prod-8',
      name: 'Leather Minimalist Court Sneakers',
      sku: 'MNT-SH-008',
      barcode: '890123456708',
      category: 'Shoes & Footwear',
      brand: 'Mint Footwear',
      description: 'Supple Italian calfskin leather sneakers with vulcanized rubber sole and cushioned insole.',
      purchaseCost: 9500,
      sellingPrice: 19500,
      reorderLevel: 8,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      variants: [
        { id: 'var-8-1', size: '36', colorName: 'Chalk White', colorHex: '#f8fafc', sku: 'MNT-SH-008-36-WHT', stock: 4 },
        { id: 'var-8-2', size: '38', colorName: 'Chalk White', colorHex: '#f8fafc', sku: 'MNT-SH-008-38-WHT', stock: 3 },
      ],
    },
  ];

  for (const p of products) {
    db.run(
      `INSERT OR IGNORE INTO products
       (id, name, sku, barcode, category, brand, description, purchase_cost, selling_price, reorder_level, image, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [p.id, p.name, p.sku, p.barcode, p.category, p.brand, p.description, p.purchaseCost, p.sellingPrice, p.reorderLevel, p.image, p.status]
    );

    for (const v of p.variants) {
      db.run(
        `INSERT OR IGNORE INTO product_variants
         (id, product_id, size, color_name, color_hex, sku, barcode, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [v.id, p.id, v.size, v.colorName, v.colorHex, v.sku, `${p.barcode}-${v.size}`, v.stock]
      );
    }
  }

  // 5. Suppliers
  const suppliers = [
    {
      id: 'sup-1',
      name: 'Ceylon Weaving Mills Ltd',
      contactPerson: 'Sunil Weerakkody',
      phone: '+94 11 258 7410',
      email: 'orders@ceylonweaving.lk',
      address: 'Export Processing Zone, Biyagama',
      categoriesSupplied: JSON.stringify(['Shirts & Tops', 'T-Shirts & Polos']),
      paymentTerms: 'Net 30 Days',
    },
    {
      id: 'sup-2',
      name: 'Kobe Indigo Mills',
      contactPerson: 'Kenji Takahashi',
      phone: '+81 78 304 9911',
      email: 'export@kobe-selvedge.jp',
      address: 'Chuo-ku, Kobe, Hyogo, Japan',
      categoriesSupplied: JSON.stringify(['Denim & Jeans', 'Jackets & Blazers']),
      paymentTerms: 'Letter of Credit / Net 45 Days',
    },
    {
      id: 'sup-3',
      name: 'Serendib Fine Silks & Linens',
      contactPerson: 'Priyanka Dissanayake',
      phone: '+94 81 445 6789',
      email: 'priyanka@serendibsilks.com',
      address: 'Peradeniya Road, Kandy',
      categoriesSupplied: JSON.stringify(['Dresses', 'Shirts & Tops']),
      paymentTerms: 'Net 15 Days',
    },
  ];

  for (const s of suppliers) {
    db.run(
      `INSERT OR IGNORE INTO suppliers
       (id, name, contact_person, phone, email, address, categories_supplied, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [s.id, s.name, s.contactPerson, s.phone, s.email, s.address, s.categoriesSupplied, s.paymentTerms]
    );
  }

  // 6. Customers
  const customers = [
    {
      id: 'cust-1',
      name: 'Kavinda Jayawardena',
      phone: '+94 77 123 4567',
      email: 'kavinda.j@example.com',
      address: '45 Ward Place, Colombo 07',
      totalPurchases: 86400,
      orderCount: 5,
      loyaltyPoints: 860,
    },
    {
      id: 'cust-2',
      name: 'Dilini Fernando',
      phone: '+94 71 987 6543',
      email: 'dilini.f@example.com',
      address: '12 Gregory Road, Colombo 07',
      totalPurchases: 142500,
      orderCount: 8,
      loyaltyPoints: 1420,
    },
    {
      id: 'cust-3',
      name: 'Rohan Senanayake',
      phone: '+94 76 555 4321',
      email: 'rohan.s@example.com',
      address: '88 Galle Road, Mount Lavinia',
      totalPurchases: 54900,
      orderCount: 3,
      loyaltyPoints: 540,
    },
  ];

  for (const c of customers) {
    db.run(
      `INSERT OR IGNORE INTO customers
       (id, name, phone, email, address, total_purchases, order_count, loyalty_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [c.id, c.name, c.phone, c.email, c.address, c.totalPurchases, c.orderCount, c.loyaltyPoints]
    );
  }

  // 7. Settings
  const defaultSettings = [
    { key: 'storeName', value: 'MINT FASHION' },
    { key: 'tagline', value: 'Contemporary Clothing & Sartorial Goods' },
    { key: 'address', value: 'No. 42 Alfred House Gardens, Colombo 03, Sri Lanka' },
    { key: 'phone', value: '+94 11 257 8899' },
    { key: 'email', value: 'concierge@mintfashion.lk' },
    { key: 'taxNumber', value: 'VAT-102938475-7000' },
    { key: 'currency', value: 'LKR' },
    { key: 'currencySymbol', value: 'Rs.' },
    { key: 'taxRatePercent', value: '8.0' },
    { key: 'enableTax', value: 'true' },
    { key: 'receiptWidth', value: '80mm' },
    { key: 'receiptHeader', value: 'MINT FASHION • COLOMBO' },
    { key: 'receiptFooter', value: 'Thank you for shopping with MINT FASHION!\nExchange within 7 days with original receipt and price tag intact.\nFollow us @mintfashion.lk' },
    { key: 'primaryColor', value: '#059669' },
  ];

  for (const s of defaultSettings) {
    db.run(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
      [s.key, s.value]
    );
  }

  // 8. Sample Sales
  db.run(`
    INSERT OR IGNORE INTO sales 
    (id, receipt_number, customer_id, customer_name, customer_phone, cashier_id, cashier_name, subtotal, discount, tax, total, payment_method, status, created_at)
    VALUES 
    ('sale-1', 'REC-2026-0842', 'cust-1', 'Kavinda Jayawardena', '+94 77 123 4567', 'user-1', 'Amara Perera', 19700, 1000, 1496, 20196, 'card', 'completed', '2026-10-29 10:15:00');
  `);

  db.run(`
    INSERT OR IGNORE INTO sale_items
    (id, sale_id, product_id, variant_id, product_name, sku, size, color, quantity, unit_price, unit_cost, line_total)
    VALUES
    ('sitem-1', 'sale-1', 'prod-1', 'var-1-2', 'Signature Oxford Cotton Shirt', 'MNT-SH-001-M-BLU', 'M', 'Sky Blue', 2, 7900, 3800, 15800),
    ('sitem-2', 'sale-1', 'prod-4', 'var-4-2', 'Classic Heavyweight Cotton Tee', 'MNT-TS-004-M-GRN', 'M', 'Forest Green', 1, 3900, 1800, 3900);
  `);

  db.run(`
    INSERT OR IGNORE INTO payments
    (id, sale_id, amount, method, created_at)
    VALUES
    ('pay-1', 'sale-1', 20196, 'card', '2026-10-29 10:15:00');
  `);

  // 9. Initial Stock Movements
  db.run(`
    INSERT OR IGNORE INTO stock_movements
    (id, product_id, variant_id, product_name, sku, variant_info, type, quantity_delta, previous_stock, new_stock, reason, performed_by, created_at)
    VALUES
    ('mv-1', 'prod-1', 'var-1-2', 'Signature Oxford Cotton Shirt', 'MNT-SH-001-M-BLU', 'M / Sky Blue', 'in', 20, 0, 20, 'Initial wholesale inward shipment', 'Kasun Rathnayake', '2026-10-20 09:00:00'),
    ('mv-2', 'prod-1', 'var-1-2', 'Signature Oxford Cotton Shirt', 'MNT-SH-001-M-BLU', 'M / Sky Blue', 'out', -2, 20, 18, 'Sold on REC-2026-0842', 'Amara Perera', '2026-10-29 10:15:00');
  `);

  // 10. Sample Operating Expenses
  db.run(`
    INSERT OR IGNORE INTO expenses
    (id, category, description, amount, payment_method, reference, recorded_by, expense_date)
    VALUES
    ('exp-1', 'Rent', 'Flagship Store Colombo 07 Monthly Lease', 350000, 'bank_transfer', 'LEASE-OCT-2026', 'Amara Perera', '2026-10-01'),
    ('exp-2', 'Utilities', 'Electricity & Air Conditioning (CEB)', 68500, 'bank_transfer', 'CEB-998822', 'Amara Perera', '2026-10-08'),
    ('exp-3', 'Packaging', 'Recycled Luxury Kraft Paper Bags & Garment Covers', 45000, 'card', 'INV-PKG-331', 'Nuwan Bandara', '2026-10-14');
  `);

  // 11. Initial Audit Log
  db.run(`
    INSERT OR IGNORE INTO audit_logs
    (id, user_id, user_name, action, entity_type, entity_id, details)
    VALUES
    ('audit-init', 'user-3', 'Kasun Rathnayake', 'SYSTEM_INITIALIZE', 'database', 'mint-fashion.db', 'MINT FASHION SQLite database initialized and seeded with retail catalog');
  `);
}
