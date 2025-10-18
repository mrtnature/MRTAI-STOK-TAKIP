// Mock implementation of expo-sqlite for web platform
// This prevents expo-sqlite from being bundled in web builds

export const openDatabaseAsync = () => {
  console.warn('SQLite is not available on web platform. Using mock implementation.');
  return Promise.resolve({
    execAsync: () => Promise.resolve({ rows: [] }),
    getAllAsync: () => Promise.resolve([]),
    getFirstAsync: () => Promise.resolve(null),
    runAsync: () => Promise.resolve({ lastInsertRowId: 0, changes: 0 }),
    closeAsync: () => Promise.resolve(),
  });
};

export const openDatabaseSync = () => {
  console.warn('SQLite is not available on web platform. Using mock implementation.');
  return {
    execSync: () => ({ rows: [] }),
    getAllSync: () => [],
    getFirstSync: () => null,
    runSync: () => ({ lastInsertRowId: 0, changes: 0 }),
    closeSync: () => {},
  };
};

export const SQLiteDatabase = class {
  constructor() {
    console.warn('SQLite is not available on web platform. Using mock implementation.');
  }
  
  execAsync() { return Promise.resolve({ rows: [] }); }
  getAllAsync() { return Promise.resolve([]); }
  getFirstAsync() { return Promise.resolve(null); }
  runAsync() { return Promise.resolve({ lastInsertRowId: 0, changes: 0 }); }
  closeAsync() { return Promise.resolve(); }
};

// Default export
export default {
  openDatabaseAsync,
  openDatabaseSync,
  SQLiteDatabase,
};