import {createShardedLoader} from './index';
import groupBy from 'lodash/groupBy';

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
]

const groupped = groupBy(input, i => i[0])
console.log(groupped);

console.log(Object.entries(groupped));

const loader = createShardedLoader<number, number>(
    async function loader(shard, keys) {
        console.log('Shards called: ', shard, keys);
        return keys.map(k => k);
    },
)

Promise.all([
    loader.load([7, 1]),
    loader.load([7, 2]),
    loader.load([7, 3]),
    loader.load([2, 11]),
    loader.load([2, 12]),
]).then(r => console.log(r));