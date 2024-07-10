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
exports.createLoader = createLoader;
exports.createCachedLoader = createCachedLoader;
const dataloader_1 = __importDefault(require("dataloader"));
const bluebird_1 = __importDefault(require("bluebird"));
const REDIS_CLIENT_MAX_CONCURRENCY = process.env.REDIS_LOADER_MAX_CONCURRENCY || 10;
function createLoader(batchFn, options, ttl) {
    return new dataloader_1.default(batchFn, options);
}
function createCachedLoader(batchFn, redisClient, options, ttl) {
    return new dataloader_1.default(cachedBatchFn(batchFn, redisClient, ttl), Object.assign(Object.assign({}, options), { cache: false }));
}
function _buildCacheKey(fnName, key) {
    return `bodya-dataloaders-${fnName}-${key}`;
}
function cachedBatchFn(batchFn, redisClient, ttl) {
    return (keys) => __awaiter(this, void 0, void 0, function* () {
        const matches = new Map();
        const unmatched = [];
        const cacheKeys = keys.map(k => _buildCacheKey(batchFn.name, k.toString()));
        const cachedValues = yield redisClient.mGet(cacheKeys);
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
                return matches.set(keys[i].toString(), parsedValue);
            }
            return unmatched.push(keys[i]);
        });
        const results = Array.from(yield batchFn(unmatched));
        const cacheables = [];
        results.forEach((res, i) => {
            if (!(res instanceof Error)) {
                cacheables.push([unmatched[i].toString(), JSON.stringify(res)]);
                matches.set(unmatched[i].toString(), res);
            }
        });
        yield redisClient.mSet(cacheables);
        yield bluebird_1.default.map(cacheables, (key) => {
            return redisClient.expire(key.toString(), ttl);
        }, { concurrency: +REDIS_CLIENT_MAX_CONCURRENCY });
        return keys.map(k => matches.get(k.toString()));
    });
}
