import {DatabaseConfig, getShardedConnection} from './connection';
import {createDynamicModel} from './utils';
import {Model} from 'objection';

const shardedModelMap: Map<string, any> = new Map<string, any>();

export abstract class AbstractShardedModel extends Model {
    static get idColumn(): string | string[] {
        return 'id';
    }
    static getTableNameTemplate(): string {
        throw new Error('Tablename template must be implemented');
    }

    static getShardedTableName(shard: number): string {
        return `${this.getTableNameTemplate()}_${shard}`;
    }

    static useShard<T extends typeof AbstractShardedModel>(this: T, config: DatabaseConfig, shard: number): T {
        const tableName = this.getShardedTableName(shard);
        const cachedModel = shardedModelMap.get(tableName);
        if (cachedModel) {
            return cachedModel;
        }

        const connection = getShardedConnection(config, shard);
        const model = createDynamicModel<T>(this, tableName, connection);
        shardedModelMap.set(tableName, model);

        return model;
    }
}
