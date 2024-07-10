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



