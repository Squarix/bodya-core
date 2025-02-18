"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createShardedLoader = createShardedLoader;
exports.createLoader = createLoader;
exports.createCachedLoader = createCachedLoader;
const dataloader_1 = __importDefault(require("dataloader"));
const bluebird_1 = __importDefault(require("bluebird"));
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const timers_1 = require("timers");
const REDIS_CLIENT_MAX_CONCURRENCY = process.env.REDIS_LOADER_MAX_CONCURRENCY || 100;
/*
* First parameter on load is always shard number!
* Костыль пиздец, но у меня нету даже полдня на написание нормальной фабрики
* чтобы вообще не надо было париться по шардам)
* шардированые запросы не кешируем!
* */
function createShardedLoader(batchFn, options = {}) {
    return new dataloader_1.default(localShardedBatchFn(batchFn), Object.assign(Object.assign({ batchScheduleFn: (cb) => {
            const timeoutId = setTimeout(() => {
                cb();
                (0, timers_1.clearTimeout)(timeoutId);
            }, 25);
        } }, options), { cache: false }));
}
function createLoader(batchFn, options = {}, ttlS = 0) {
    const cacheMap = new Map();
    return new dataloader_1.default(localCachedBatchFn(batchFn, cacheMap, ttlS), Object.assign({ batchScheduleFn: (cb) => setTimeout(cb, 25), cacheMap, cache: options.cache ? options.cache : false }, options));
}
function createCachedLoader(batchFn, redisClient, options = {}, ttl = 0, cacheKeyFn) {
    return new dataloader_1.default(centrallyCachedBatchFn(batchFn, redisClient, ttl, cacheKeyFn), Object.assign(Object.assign({ batchScheduleFn: (cb) => {
            const timeoutId = +setTimeout(() => {
                cb();
                (0, timers_1.clearTimeout)(timeoutId);
            }, 25);
        } }, options), { cache: false }));
}
function _buildCacheKey(fnName, key) {
    return `bodya-dataloaders-${fnName}-${key}`;
}
function localShardedBatchFn(shardedBatchFn) {
    return (keys) => __awaiter(this, void 0, void 0, function* () {
        const groupedKeys = (0, groupBy_1.default)(keys, (k) => k[0]);
        const shardsKeys = Object.entries(groupedKeys);
        const shards = Object.keys(groupedKeys).map(s => +s);
        const shardedResults = yield Promise.all(shardsKeys.map((_a) => __awaiter(this, [_a], void 0, function* ([shard, keys]) {
            return shardedBatchFn(+shard, keys.map(k => k[1]));
        })));
        const loaderResults = keys.map(([shard, key]) => {
            return shardedResults[shards.indexOf(shard)][groupedKeys[shard].findIndex((k) => k[0] === shard && k[1] === key)];
        });
        return loaderResults;
    });
}
function localCachedBatchFn(batchFn, cacheMap, ttlS) {
    return (keys) => __awaiter(this, void 0, void 0, function* () {
        const result = yield batchFn(keys);
        // clear local cache after TTL
        const timeoutId = +setTimeout(() => {
            keys.forEach(k => cacheMap.delete(k));
            (0, timers_1.clearTimeout)(timeoutId);
        }, ttlS * 1000);
        return result;
    });
}
function centrallyCachedBatchFn(batchFn, redisClient, ttl, cacheKeyFn) {
    return (keys) => __awaiter(this, void 0, void 0, function* () {
        const matches = new Map();
        const unmatched = [];
        const cacheKeys = keys.map(k => _buildCacheKey(batchFn.name, cacheKeyFn ? cacheKeyFn(k) : k.toString()));
        const cachedValues = yield redisClient.mget(cacheKeys);
        cachedValues.forEach((value, i) => {
            let parsedValue = null;
            try {
                if (value !== null) {
                    parsedValue = JSON.parse(value);
                }
            }
            catch (err) {
                console.debug('Strange value in redis: ', value);
            }
            if (parsedValue !== null) {
                return matches.set(cacheKeyFn ? cacheKeyFn(keys[i]) : keys[i].toString(), parsedValue);
            }
            return unmatched.push(keys[i]);
        });
        if (!unmatched.length) {
            return keys.map(k => matches.get(cacheKeyFn ? cacheKeyFn(k) : k.toString()));
        }
        const results = Array.from(yield batchFn(unmatched));
        const cacheables = {};
        results.forEach((res, i) => {
            if (!(res instanceof Error)) {
                cacheables[_buildCacheKey(batchFn.name, cacheKeyFn ? cacheKeyFn(unmatched[i]) : unmatched[i].toString())] = JSON.stringify(res);
            }
            matches.set(cacheKeyFn ? cacheKeyFn(unmatched[i]) : unmatched[i].toString(), res);
        });
        yield redisClient.mset(cacheables);
        yield bluebird_1.default.map(Object.keys(cacheables), (key) => {
            return redisClient.expire(key.toString(), ttl);
        }, { concurrency: +REDIS_CLIENT_MAX_CONCURRENCY });
        return keys.map(k => matches.get(cacheKeyFn ? cacheKeyFn(k) : k.toString()));
    });
}
