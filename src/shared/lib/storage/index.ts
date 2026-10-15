import { createAppStorage } from './LocalStorageAdapter';

export type { AppStorage, StorageKey } from './AppStorage';
export { createAppStorage, LocalStorageAdapter } from './LocalStorageAdapter';
export type { KeyValueStore } from './LocalStorageAdapter';

export const appStorage = createAppStorage();
