
/**
 * Open IndexedDB database with `name`.
 * Retry logic allows to avoid issues in tests env,
 * when db with the same name delete/open repeatedly and can be blocked.
 *
 * @param {String} dbName
 * @param {Number} [version]
 * @param {Function} [upgradeCallback]
 * @return {Promise}
 */

export function open(dbName, version, upgradeCallback) {
  return new Promise((resolve, reject) => {
    let isFirst = true
    if (typeof version === 'function') {
      upgradeCallback = version
      version = undefined
    }
    const openDb = () => {
      // don't call open with 2 arguments, when version is not set
      const req = version ? idb().open(dbName, version) : idb().open(dbName)
      req.onblocked = () => {
        if (isFirst) {
          isFirst = false
          setTimeout(openDb, 100)
        } else {
          reject(new Error('database is blocked'))
        }
      }
      if (typeof upgradeCallback === 'function') req.onupgradeneeded = upgradeCallback
      req.onerror = (e) => reject(e.target.error)
      req.onsuccess = (e) => resolve(e.target.result)
    }
    openDb()
  })
}

/**
 * Delete `db` properly:
 * - close it and wait 100ms to disk flush (Safari, older Chrome, Firefox)
 * - if database is locked, due to inconsistent exectution of `versionchange`,
 *   try again in 100ms
 *
 * @param {IDBDatabase|String} db
 * @return {Promise}
 */

export function del(db) {
  const dbName = typeof db !== 'string' ? db.name : db

  return new Promise((resolve, reject) => {
    let isFirst = true
    const delDb = () => {
      const req = idb().deleteDatabase(dbName)
      req.onblocked = () => {
        if (isFirst) {
          isFirst = false
          setTimeout(delDb, 100)
        } else {
          reject(new Error('database is blocked'))
        }
      }
      req.onerror = (e) => reject(e.target.error)
      req.onsuccess = () => resolve()
    }

    if (typeof db !== 'string') {
      db.close()
      setTimeout(delDb, 100)
    } else {
      delDb()
    }
  })
}

/**
 * Compare `first` and `second`.
 * Added for consistency with official API.
 *
 * @param {Any} first
 * @param {Any} second
 * @return {Number} -1|0|1
 */

export function cmp(first, second) {
  return idb().cmp(first, second)
}

/**
 * Get globally available IDBFactory instance.
 * - it uses `global`, so it can work in any env.
 * - it tries to use `global.forceIndexedDB` first,
 *   so you can rewrite `global.indexedDB` with polyfill
 *   https://bugs.webkit.org/show_bug.cgi?id=137034
 * - it fallbacks to all possibly available implementations
 *   https://github.com/axemclion/IndexedDBShim#ios
 * - function allows to have dynamic link,
 *   which can be changed after module's initial exectution
 *
 * @return {IDBFactory}
 */

function idb() {
  return global.forceIndexedDB
      || global.indexedDB
      || global.webkitIndexedDB
      || global.mozIndexedDB
      || global.msIndexedDB
      || global.shimIndexedDB
}
