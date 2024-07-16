import DataLoader from 'dataloader';
import {RedisClientType} from 'redis';
import BluebirdPromise from 'bluebird';
import groupBy from 'lodash/groupBy';

const REDIS_CLIENT_MAX_CONCURRENCY = process.env.REDIS_LOADER_MAX_CONCURRENCY || 10;

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
    batchFn: (shard: number, keys: K) => Promise<ArrayLike<N | Error>>,
    options: DataLoader.Options<K, N>,
): DataLoader<K, N> {
    return new DataLoader<K, N>(localShardedBatchFn(batchFn), {...options, cache: false})
}

export function createLoader<K extends Serializable, N>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    options: DataLoader.Options<K, N>,
    ttlS: number
): DataLoader<K, N> {
    const cacheMap = new Map();
    return new DataLoader<K, N>(
        localCachedBatchFn(batchFn, cacheMap, ttlS), {
            ...options,
            cacheMap,
        }
    );
}

export function createCachedLoader<K extends Serializable, N>(
    batchFn: DataLoader.BatchLoadFn<K, N>,
    redisClient: RedisClientType,
    options: DataLoader.Options<K, N>,
    ttl: number,
): DataLoader<K, N> {
    return new DataLoader<K, N>(centrallyCachedBatchFn<K, N>(batchFn, redisClient, ttl), {
        ...options,
        cache: false,
    });
}


function _buildCacheKey(fnName: string, key: string): string {
    return `bodya-dataloaders-${fnName}-${key}`;
}

function localShardedBatchFn<K, N>(
    shardedBatchFn: (shard: number, keys: K) => Promise<ArrayLike<N | Error>>,
) {
    return async (keys: ReadonlyArray<K>) => {
        const groupedKeys = groupBy(keys, (k: any) => k[0]);
        const shardedResults = await Promise.all(
            Object.entries(groupedKeys).map(async ([shard, keys]) => {
                return shardedBatchFn(+shard, keys[1]);
            })
        )

        const loaderResults = keys.map(([shard, key]: any) => {
            return shardedResults[shard][groupedKeys[shard].findIndex((k: any) => k[0] === shard && k[1] === key)];
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
    redisClient: RedisClientType,
    ttl: number,
) {
    return async (keys: ReadonlyArray<K>): Promise<ArrayLike<N | Error>> => {
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
            }

            matches.set(unmatched[i].toString(), res)
        });

        await redisClient.mSet(cacheables);
        await BluebirdPromise.map(cacheables, (key) => {
            return redisClient.expire(key.toString(), ttl);
        }, {concurrency: +REDIS_CLIENT_MAX_CONCURRENCY});

        return keys.map(k => matches.get(k.toString()));
    };
}