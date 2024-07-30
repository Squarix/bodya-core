"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKnexConnection = exports.getShardedConnection = void 0;
const knex_1 = require("knex");
const config_1 = __importDefault(require("config"));
const moment_1 = __importDefault(require("moment"));
const shardingMap = new Map();
/*
* 1. define sharding property inside connection config
* 2. function will return suitable config
* 3. shardedConnection is locally cached.
* */
const getShardedConnection = (config, shard) => {
    if (shardingMap.get(shard)) {
        return shardingMap.get(shard);
    }
    const shardedConnection = config_1.default.util.cloneDeep(config.shardedConnections.find(connection => {
        if (!connection.sharding) {
            return;
        }
        const [from, to] = connection.sharding.split('-');
        return +shard >= +from && +shard <= +to;
    }));
    if (!shardedConnection) {
        throw new Error(`Missing config for requested shard: ${shard}`);
    }
    shardingMap.set(shard, shardedConnection);
    return shardedConnection;
};
exports.getShardedConnection = getShardedConnection;
const connectionMap = new Map();
const setTypeParser = (knex) => {
    const DATE_OID = 1082;
    const TIMESTAMP_OID = 1114; // don't know if this is correct, just got it from jeff's response.
    knex.client.driver.types.setTypeParser(DATE_OID, function (val) {
        // For a DATE field, I only want the date
        return val === null ? null : moment_1.default.utc(val).format('YYYY-MM-DD');
    });
    knex.client.driver.types.setTypeParser(TIMESTAMP_OID, function (val) {
        // Ensure no timezone
        return val === null ? null : moment_1.default.utc(val).toDate();
    });
};
const getKnexConnection = (name, config) => {
    if (connectionMap.get(name)) {
        return connectionMap.get(name);
    }
    const connection = config_1.default.util.cloneDeep(config.connections.find(c => c.name === name));
    const knexConnection = (0, knex_1.knex)(connection);
    setTypeParser(knexConnection);
    connectionMap.set(name, knexConnection);
    return connection;
};
exports.getKnexConnection = getKnexConnection;
