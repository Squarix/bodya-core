import { ShardedConfig } from '../sharding/sharding';
import { Model } from 'objection';
export declare abstract class AbstractShardedModel extends Model {
    static get idColumn(): string;
    static getTableNameTemplate(): void;
    static getShardedTableName(shard: number): string;
    static useShard(config: ShardedConfig, shard: number): typeof Model;
}
