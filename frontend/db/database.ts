import * as SQLite from 'expo-sqlite';
import * as Notifications from 'expo-notifications';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase() {
  try {
    db = await SQLite.openDatabaseAsync('erpstok.db');

    // Tabloları oluştur
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        qty REAL NOT NULL DEFAULT 0,
        price REAL NOT NULL DEFAULT 0,
        reorder_level REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        total_cost REAL NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS template_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        stock_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
        FOREIGN KEY (stock_id) REFERENCES stocks(id)
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        sell_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'ORDER_RECEIVED',
        cargo_company TEXT,
        cargo_tracking TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      );

      CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        smtp_host TEXT,
        smtp_port INTEGER,
        smtp_user TEXT,
        smtp_pass TEXT,
        from_name TEXT,
        from_email TEXT
      );
    `);

    // İlk ayar kaydını oluştur
    const settingsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM settings'
    );
    if (settingsCount && settingsCount.count === 0) {
      await db.runAsync(
        'INSERT INTO settings (smtp_host, smtp_port, smtp_user, smtp_pass, from_name, from_email) VALUES (?, ?, ?, ?, ?, ?)',
        ['', 587, '', '', '', '']
      );
    }

    // Örnek verileri ekle
    await seedData();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

async function seedData() {
  if (!db) return;

  try {
    // Stok var mı kontrol et
    const stockCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM stocks'
    );

    if (stockCount && stockCount.count === 0) {
      // Örnek stok verileri
      await db.runAsync(
        'INSERT INTO stocks (sku, name, unit, qty, price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
        ['LAP001', 'Laptop', 'Adet', 12, 1200, 5]
      );
      await db.runAsync(
        'INSERT INTO stocks (sku, name, unit, qty, price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
        ['MOU001', 'Mouse', 'Adet', 30, 25, 10]
      );
      await db.runAsync(
        'INSERT INTO stocks (sku, name, unit, qty, price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
        ['KEY001', 'Keyboard', 'Adet', 15, 45, 5]
      );
      await db.runAsync(
        'INSERT INTO stocks (sku, name, unit, qty, price, reorder_level) VALUES (?, ?, ?, ?, ?, ?)',
        ['MON001', 'Monitor', 'Adet', 8, 300, 3]
      );

      console.log('Seed data added successfully');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

export async function checkCriticalStock() {
  const db = getDatabase();
  const criticalStocks = await db.getAllAsync<{
    id: number;
    name: string;
    qty: number;
    reorder_level: number;
  }>('SELECT id, name, qty, reorder_level FROM stocks WHERE qty <= reorder_level');

  if (criticalStocks && criticalStocks.length > 0) {
    for (const stock of criticalStocks) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Kritik Stok Uyarısı',
          body: `${stock.name} stok seviyesi kritik! Mevcut: ${stock.qty}, Minimum: ${stock.reorder_level}`,
          sound: true,
        },
        trigger: null,
      });
    }
  }
}
