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
const index_1 = require("./index");
const groupBy_1 = __importDefault(require("lodash/groupBy"));
//
// const loader = createShardedLoader<string, number>(
//     function loader(shard, keys) {
//         console.log('shard: ', shard);
//         console.log('keys: ', keys);
//
//         return keys.map(() => shard);
//     }
// )
const input = [
    [1, '1'],
    [1, '2'],
    [1, '3'],
    [2, '21'],
    [2, '22'],
    [2, '23'],
    [3, '1'],
];
const groupped = (0, groupBy_1.default)(input, i => i[0]);
console.log(groupped);
console.log(Object.entries(groupped));
const loader = (0, index_1.createShardedLoader)(function loader(shard, keys) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Shards called: ', shard, keys);
        return keys.map(k => k[1]);
    });
});
Promise.all([
    loader.load([0, 1]),
    loader.load([0, 2]),
    loader.load([0, 3]),
    loader.load([1, 11]),
    loader.load([1, 12]),
]).then(r => console.log(r));
