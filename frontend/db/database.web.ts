export async function initDatabase() {
  console.log('Database operations are not available on web. This app requires Android or iOS.');
}

export function getDatabase(): any {
  throw new Error('Database is not available on web platform');
}

export async function checkCriticalStock() {
  console.log('Stock check not available on web');
}
