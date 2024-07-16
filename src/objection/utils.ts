import {Model} from 'objection';
import {ShardedConnectionConfig} from '../sharding/sharding';
import {AbstractShardedModel} from './AbstractShardedModel';
import {knex} from 'knex';

export const createDynamicModel = (proto: typeof AbstractShardedModel, tableName: string, connection: ShardedConnectionConfig): typeof Model => {
    const model = Object.create(proto);
    Object.assign(model, {
        tableName: () => {
            return tableName;
        },
    });
    
    model.knex(knex(connection));
    return model;
}