### Dataloaders
___
[Dataloaders repo](https://github.com/graphql/dataloader)

Originally dataloaders are used to batch and cache
requests. Dataloaders have in-memory cache, that can
be disabled via options.

**Our implementation also let
dataloaders to have a redis cache.**

Batching is a mechanism, that helps us to avoid multiple
requests to database, replacing it with one big request.

Simple batching schema:

![Dataloaders](https://github.com/sanya-sanya-vlad/bodya-core/assets/42293261/a704d05d-204c-4221-a0ba-a11f2fc0da9a)

### IMPORTANT
Cache key is build as `dataloaders-${function name}-${key}`.
That's why dataloaders batch function __must__ have unique function name.


Caching mechanism has configurable `REDIS_CLIENT_MAX_CONCURRENCY` parameter
it's default values is `20`


### LOADER TYPES:

`createLoader` - loader for main tables, supports local cache

`createShardedLoader` - loader for sharded tables, cache is disabled

`createCachedLoader` - loader for main tables, cache inside redis