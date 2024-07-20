import { DatabaseConfig } from './connection';
import { Model } from 'objection';
export declare abstract class AbstractShardedModel extends Model {
    static get idColumn(): string;
    static getTableNameTemplate(): string;
    static getShardedTableName(shard: number): string;
    static useShard(config: DatabaseConfig, shard: number): typeof Model;
}
