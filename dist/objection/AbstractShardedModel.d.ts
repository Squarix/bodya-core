import { DatabaseConfig } from './connection';
import { Model } from 'objection';
export declare abstract class AbstractShardedModel extends Model {
    static readonly assignedTableName: string;
    static get idColumn(): string | string[];
    static getTableNameTemplate(): string;
    static getShardedTableName(shard: number): string;
    static get tableName(): string;
    static useShard<T extends typeof AbstractShardedModel>(this: T, config: DatabaseConfig, shard: number): T;
}
