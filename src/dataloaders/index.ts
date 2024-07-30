import DataLoader from 'dataloader';
import BluebirdPromise from 'bluebird';
import groupBy from 'lodash/groupBy';
import {Redis} from 'ioredis';

const REDIS_CLIENT_MAX_CONCURRENCY = process.env.REDIS_LOADER_MAX_CONCURRENCY || 100;

interface Serializable {
    toString(): string,
}

/*
* First parameter on load is always shard number!
* Костыль пиздец, но у меня нету даже полдня на написание нормальной фабрики
* чтобы вообще не надо было париться по шардам)
* шардированые запросы не кешируем!
* */
export function createShardedLoader<K, N>(
    batchFn: (shard: number, keys: K[]) => Promise<ArrayLike<N | Error>>,
    options: DataLoader.Options<[number, K], N> = {},
): DataLoader<[number, K], N> {
    return new DataLoader<[number, K], N>(localShardedBatchFn(batchFn), {
        batchScheduleFn: (cb) => setTimeout(cb, 25),
        ...options,
        cache: false,
    });
}

export function createLoader<K extends Serializable, N>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    options: DataLoader.Options<K, N> = {},
    ttlS: number = 0
): DataLoader<K, N> {
    const cacheMap = new Map();
    return new DataLoader<K, N>(
        localCachedBatchFn(batchFn, cacheMap, ttlS), {
            batchScheduleFn: (cb) => setTimeout(cb, 25),
            cacheMap,
            cache: options.cache ? options.cache : false,
            ...options,
        }
    );
}

export function createCachedLoader<K extends Serializable, N>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    redisClient: Redis,
    options: DataLoader.Options<K, N> = {},
    ttl: number = 0,
    cacheKeyFn?: (key: K) => string,
): DataLoader<K, N> {
    return new DataLoader<K, N>(centrallyCachedBatchFn<K, N>(batchFn, redisClient, ttl, cacheKeyFn), {
        batchScheduleFn: (cb) => setTimeout(cb, 25),
        ...options,
        cache: false,
    });
}


function _buildCacheKey(fnName: string, key: string): string {
    return `bodya-dataloaders-${fnName}-${key}`;
}

function localShardedBatchFn<K, N>(
    shardedBatchFn: (shard: number, keys: K[]) => Promise<ArrayLike<N | Error>>,
) {
    return async (keys: ReadonlyArray<[number, K]>) => {
        const groupedKeys = groupBy(keys, (k) => k[0]);
        const shardsKeys = Object.entries(groupedKeys);
        const shards = Object.keys(groupedKeys).map(s => +s);
        const shardedResults = await Promise.all(
            shardsKeys.map(async ([shard, keys]) => {
                return shardedBatchFn(+shard, keys.map(k => k[1]));
            })
        )

        const loaderResults = keys.map(([shard, key]: any) => {
            return shardedResults[shards.indexOf(shard)][groupedKeys[shard].findIndex((k: any) => k[0] === shard && k[1] === key)];
        });

        return loaderResults;
    }
}

function localCachedBatchFn<K extends Serializable, N>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    cacheMap: Map<K, N>,
    ttlS: number,
) {
    return async (keys: ReadonlyArray<K>) => {
        const result = await batchFn(keys);
        // clear local cache after TTL
        setTimeout(() => {
            keys.forEach(k => cacheMap.delete(k));
        }, ttlS * 1000);

        return result;
    };
}

function centrallyCachedBatchFn<K extends Serializable, N>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    redisClient: Redis,
    ttl: number,
    cacheKeyFn?: (key: K) => string,
) {
    return async (keys: ReadonlyArray<K>): Promise<ArrayLike<N | Error>> => {
        const matches = new Map();
        const unmatched: Array<K> = [];
        const cacheKeys = keys.map(k => _buildCacheKey(batchFn.name, cacheKeyFn ? cacheKeyFn(k) : k.toString()));
        const cachedValues: Array<string | null> = await redisClient.mget(cacheKeys);
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
                return matches.set(cacheKeyFn ? cacheKeyFn(keys[i]) : keys[i].toString(), parsedValue);
            }

            return unmatched.push(keys[i]);
        });

        if (!unmatched.length) {
            return keys.map(k => matches.get(k.toString()));
        }

        const results: Array<N | Error> = Array.from(await batchFn(unmatched));
        const cacheables: Record<string, string> = {};

        results.forEach((res, i) => {
            if (!(res instanceof Error)) {
                cacheables[_buildCacheKey(batchFn.name, cacheKeyFn ? cacheKeyFn(unmatched[i]) : unmatched[i].toString())] = JSON.stringify(res);
            }

            matches.set(unmatched[i].toString(), res)
        });

        await redisClient.mset(cacheables);
        await BluebirdPromise.map(Object.keys(cacheables), (key) => {
            return redisClient.expire(key.toString(), ttl);
        }, {concurrency: +REDIS_CLIENT_MAX_CONCURRENCY});

        return keys.map(k => matches.get(k.toString()));
    };
}