import {getShardedConnection} from '../sharding';
import {ShardedConfig} from '../sharding/sharding';
import {createDynamicModel} from './utils';
import {Model} from 'objection';

const shardedModelMap: Map<string, typeof Model> = new Map<string, typeof Model>();

export abstract class AbstractShardedModel extends Model {
    static get idColumn(): string {
        return 'id';
    }
    static getTableNameTemplate() {
        throw new Error('Tablename template must be implemented');
    }

    static getShardedTableName(shard: number): string {
        return `${this.getTableNameTemplate()}_${shard}`;
    }

    static useShard(config: ShardedConfig, shard: number): typeof Model {
        const tableName = this.getShardedTableName(shard);
        const cachedModel = shardedModelMap.get(tableName);
        if (cachedModel) {
            return cachedModel;
        }

        const connection = getShardedConnection(config, shard);
        const model = createDynamicModel(this, tableName, connection);
        shardedModelMap.set(tableName, model);

        return model;
    }
}
