import {AbstractShardedModel} from './AbstractShardedModel';

class UserShardedModel extends AbstractShardedModel {
    static getTableNameTemplate() {
        return 'user_shard'
    }
}

const testConfig = {
    connections: [
        {client: 'pg', host: '1', password: '1', user: '1', database: '1', sharding: '1-3'},
        {client: 'pg', host: '2', password: '2', user: '2', database: '1', sharding: '4-6'},
    ]
}

const qb = UserShardedModel.useShard(testConfig, 1)
    .query()
    .where('1', 1)
    .andWhere('2', 2);
console.log(
    qb.knex().client,
    qb.toKnexQuery().toSQL().toNative(),
);