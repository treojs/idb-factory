# idb-factory

> Better window.indexedDB.

[![](https://saucelabs.com/browser-matrix/idb-factory.svg)](https://saucelabs.com/u/idb-factory)

[![](https://img.shields.io/npm/v/idb-factory.svg)](https://npmjs.org/package/idb-factory)
[![](https://img.shields.io/travis/treojs/idb-factory.svg)](https://travis-ci.org/treojs/idb-factory)
[![](http://img.shields.io/npm/dm/idb-factory.svg)](https://npmjs.org/package/idb-factory)

This module provides consistent, modern API to `window.indexedDB`.
It's especially useful for testing environments when you need to open/delete
a database multiple times.

For implementation details check its [mere 100 lines of source](./src/index.js).

## Example

```js
import { open, del } from 'idb-factory'

// open database with version 1 and create stores
open('mydb', 1, upgradeCallback).then((db) => {
  expect(db.version).equal(2)
  // use db ...
  // delete database
  return del(db)
})

function upgradeCallback(e) {
  e.target.result.createObjectStore('books', { keyPath: 'id' })  
  e.target.result.createObjectStore('magazines')  
}
```

## API

`open` and `del` return `Promise` and handle `blocked` event by repeating
operation after 100ms.

### open(dbName, \[version], \[upgradeCallback])

```js
import { open } from 'idb-factory'

(async () => {

// open "mydb1" v1, and create store and index
const db1 = await open('mydb1', 1, (e) => {
  if (e.oldVersion < 1) {
    const store = e.target.result.createObjectStore('books', { keyPath: 'isbn' })
    store.createIndex('by_title', 'title', { unique: true })
  }  
})

// version and upgradeCallback are optional.
const db2 = await open('mydb2')

})();
```

`open` is also the default so can also be imported with:

```js
import open from 'idb-factory'
```

### del(db)

```js
import { open, del } from 'idb-factory'

(async () => {
const db = await open('mydb')

// do something with db
// ...

// delete existing IDBDatabase instance
await del(db)

})();
```

### del(dbName)

```js
import { del as deleteDatabase } from 'idb-factory'

(async () => {
await deleteDatabase('mydb') // delete database by name

})();
```

### cmp(val1, val2)

```js
import { cmp } from 'idb-factory'

// Compare 2 values, using IndexedDB's comparison algorithm
console.assert(cmp('z', 'a') === 1)
console.assert(cmp([1], [1]) === 0)
```

### global.forceIndexedDB

It is a special global variable, which can be defined to prior
`global.indexedDB`.

```js
function idb() {
  return global.forceIndexedDB
      || global.indexedDB
      || global.webkitIndexedDB
      || global.mozIndexedDB
      || global.msIndexedDB
      || global.shimIndexedDB
}
```

For example, due to [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=137034)
you can't rewrite `window.indexedDB`, but Safari 8 implementation is
[really buggy](https://gist.github.com/nolanlawson/08eb857c6b17a30c1b26),
so you'd like to use [shim and fallback to WebSQL](https://github.com/axemclion/IndexedDBShim).

```js
import 'indexeddbshim'
import { open } from 'idb-factory'

if (isSafari8) {
  global.forceIndexedDB = global.shimIndexedDB
}

(async () => {

// use WebSQL implementation, only in Safari 8,
// and use IndexedDB in remaining browsers.
const db = await open('mydb')

})();
```

## LICENSE

[MIT](./LICENSE)
