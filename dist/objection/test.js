"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractShardedModel_1 = require("./AbstractShardedModel");
class UserShardedModel extends AbstractShardedModel_1.AbstractShardedModel {
    static getTableNameTemplate() {
        return 'user_shard';
    }
}
const testConfig = {
    shardedConnections: [
        { client: 'pg', host: '1', password: '1', user: '1', database: '1', sharding: '1-3' },
        { client: 'pg', host: '2', password: '2', user: '2', database: '1', sharding: '4-6' },
    ],
    connections: [],
};
const qb = UserShardedModel.useShard(testConfig, 1)
    .query()
    .insert([{ id: 1 }, { id: 2 }])
    .onConflict()
    .merge();
console.log(qb.knex().client, qb.toKnexQuery().toSQL().toNative());
