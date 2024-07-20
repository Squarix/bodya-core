import DataLoader from 'dataloader';
import { Redis } from 'ioredis';
interface Serializable {
    toString(): string;
}
export declare function createShardedLoader<K, N>(batchFn: (shard: number, keys: K[]) => Promise<ArrayLike<N | Error>>, options?: DataLoader.Options<[number, K], N>): DataLoader<[number, K], N>;
export declare function createLoader<K extends Serializable, N>(batchFn: DataLoader.BatchLoadFn<K, N>, options?: DataLoader.Options<K, N>, ttlS?: number): DataLoader<K, N>;
export declare function createCachedLoader<K extends Serializable, N>(batchFn: DataLoader.BatchLoadFn<K, N>, redisClient: Redis, options?: DataLoader.Options<K, N>, ttl?: number): DataLoader<K, N>;
export {};
