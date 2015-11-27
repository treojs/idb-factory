# idb-factory

> Better window.indexedDB.

[![](https://saucelabs.com/browser-matrix/idb-factory.svg)](https://saucelabs.com/u/idb-factory)

[![](https://img.shields.io/npm/v/idb-factory.svg)](https://npmjs.org/package/idb-factory)
[![](https://img.shields.io/travis/treojs/idb-factory.svg)](https://travis-ci.org/treojs/idb-factory)
[![](http://img.shields.io/npm/dm/idb-factory.svg)](https://npmjs.org/package/idb-factory)
### cmp(val1, val2)

Compare 2 values, using IndexedDB's [comparison algorithm](http://www.w3.org/TR/IndexedDB).

```js
import { cmp } from 'idb-factory'
console.assert(cmp('z', 'a') === 1)
console.assert(cmp([1], [1]) === 0)
```

## LICENSE

[MIT](./LICENSE)
