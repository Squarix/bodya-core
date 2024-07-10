import DataLoader from 'dataloader';
import {RedisClientType} from "redis";
import BluebirdPromise from 'bluebird';

const REDIS_CLIENT_MAX_CONCURRENCY = process.env.REDIS_LOADER_MAX_CONCURRENCY || 10;
interface Serializable {
    toString(): string,
}

export function createLoader<K extends Serializable, N extends Serializable>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    options: DataLoader.Options<K, N>,
    ttl: number
): DataLoader<K, N> {
    return new DataLoader<K, N>(batchFn, options);
}

export function createCachedLoader<K extends Serializable, N extends Serializable>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    redisClient: RedisClientType,
    options: DataLoader.Options<K, N>,
    ttl: number,
): DataLoader<K, N> {
    return new DataLoader<K, N>(cachedBatchFn(batchFn, redisClient, ttl), {...options, cache: false})
}


function _buildCacheKey(fnName: string, key: string): string {
    return `bodya-dataloaders-${fnName}-${key}`;
}

function cachedBatchFn<K extends Serializable, N extends Serializable>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    redisClient: RedisClientType,
    ttl: number,
) {
    return async (keys: ReadonlyArray<K>) => {
        const matches = new Map();
        const unmatched: Array<K> = [];
        const cacheKeys = keys.map(k => _buildCacheKey(batchFn.name, k.toString()));
        const cachedValues: Array<string | null> = await redisClient.mGet(cacheKeys);
        cachedValues.forEach((value, i) => {
            let parsedValue = null;
            try {
                if (value !== null) {
                    parsedValue = JSON.parse(value);
                }
            } catch (err) {
                console.debug('Strange value in redis: ', value);
            }

            if (parsedValue !== null) {
                return matches.set(keys[i].toString(), parsedValue);
            }

            return unmatched.push(keys[i]);
        });

        const results: Array<N | Error> = Array.from(await batchFn(unmatched));
        const cacheables: Array<[string, string]> = [];

        results.forEach((res, i) => {
            if (!(res instanceof Error)) {
                cacheables.push([unmatched[i].toString(), JSON.stringify(res)])
                matches.set(unmatched[i].toString(), res)
            }
        });

        await redisClient.mSet(cacheables);
        await BluebirdPromise.map(cacheables, (key) => {
            return redisClient.expire(key.toString(), ttl);
        }, {concurrency: +REDIS_CLIENT_MAX_CONCURRENCY});

        return keys.map(k => matches.get(k.toString()));
    };
}