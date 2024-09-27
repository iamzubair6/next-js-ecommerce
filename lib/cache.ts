// type CacheEntry<T> = {
//     value: T;
//     expiry: number;
// };

// class Cache<T> {
//     private cache: Map<string, CacheEntry<T>> = new Map();
//     private defaultTTL: number;

//     constructor(defaultTTL: number = 60000) { // default TTL is 60 seconds
//         this.defaultTTL = defaultTTL;
//     }

//     set(key: string, value: T, ttl?: number): void {
//         const expiry = Date.now() + (ttl || this.defaultTTL);
//         this.cache.set(key, { value, expiry });
//     }

//     get(key: string): T | null {
//         const entry = this.cache.get(key);
//         if (!entry) {
//             return null;
//         }

//         if (Date.now() > entry.expiry) {
//             this.cache.delete(key);
//             return null;
//         }

//         return entry.value;
//     }

//     delete(key: string): void {
//         this.cache.delete(key);
//     }

//     clear(): void {
//         this.cache.clear();
//     }
// }

// export default Cache;
import { unstable_cache as nextCache } from "next/cache";
import { cache as reactCache } from "react";
type Callback = (...args: any[]) => Promise<any>;
export function cache<T extends Callback>(
  callback: T,
  keyParts: string[],
  options: { revalidate?: number | false; tags?: string[] } = {}
) {
  return nextCache(reactCache(callback), keyParts, options);
}
