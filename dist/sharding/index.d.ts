import { ShardedConfig, ShardedConnectionConfig } from "./sharding";
export declare const getShardedConnection: (config: ShardedConfig, shard: number) => ShardedConnectionConfig;
