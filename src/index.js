
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
    if (typeof version === 'function') {
      upgradeCallback = version
      version = undefined
    }
    // don't call open with 2 arguments, when version is not set
    const req = version ? idb().open(dbName, version) : idb().open(dbName)
    req.onblocked = (e) => {
      const resume = new Promise((res, rej) => {
        // We overwrite handlers rather than make a new
        //   open() since the original request is still
        //   open and its onsuccess will still fire if
        //   the user unblocks by closing the blocking
        //   connection
        req.onsuccess = (ev) => res(ev.target.result)
        req.onerror = (ev) => {
          ev.preventDefault()
          rej(ev)
        }
      })
      e.resume = resume
      reject(e)
    }
    if (typeof upgradeCallback === 'function') {
      req.onupgradeneeded = (e) => {
        try {
          upgradeCallback(e)
        } catch (err) {
          // We allow the callback to throw its own error
          e.target.result.close()
          reject(err)
        }
      }
    }
    req.onerror = (e) => {
      // Prevent default for `BadVersion` and `AbortError` errors, etc.
      // These are not necessarily reported in console in Chrome but present; see
      //  https://bugzilla.mozilla.org/show_bug.cgi?id=872873
      //  http://stackoverflow.com/questions/36225779/aborterror-within-indexeddb-upgradeneeded-event/36266502
      e.preventDefault()
      reject(e)
    }
    req.onsuccess = (e) => {
      resolve(e.target.result)
    }
  })
}

/**
 * Delete `db` properly:
 * - close it and wait 100ms to disk flush (Safari, older Chrome, Firefox)
 * - if database is locked, due to inconsistent execution of `versionchange`,
 *   try again in 100ms
 *
 * @param {IDBDatabase|String} db
 * @return {Promise}
 */

export function del(db) {
  const dbName = typeof db !== 'string' ? db.name : db

  return new Promise((resolve, reject) => {
    const delDb = () => {
      const req = idb().deleteDatabase(dbName)
      req.onblocked = (e) => {
        // The following addresses part of https://bugzilla.mozilla.org/show_bug.cgi?id=1220279
        e = e.newVersion === null || typeof Proxy === 'undefined' ? e : new Proxy(e, { get: (target, name) => {
          return name === 'newVersion' ? null : target[name]
        } })
        const resume = new Promise((res, rej) => {
          // We overwrite handlers rather than make a new
          //   delete() since the original request is still
          //   open and its onsuccess will still fire if
          //   the user unblocks by closing the blocking
          //   connection
          req.onsuccess = (ev) => {
            // The following are needed currently by PhantomJS: https://github.com/ariya/phantomjs/issues/14141
            if (!('newVersion' in ev)) {
              ev.newVersion = e.newVersion
            }

            if (!('oldVersion' in ev)) {
              ev.oldVersion = e.oldVersion
            }

            res(ev)
          }
          req.onerror = (ev) => {
            ev.preventDefault()
            rej(ev)
          }
        })
        e.resume = resume
        reject(e)
      }
      req.onerror = (e) => {
        e.preventDefault()
        reject(e)
      }
      req.onsuccess = (e) => {
        // The following is needed currently by PhantomJS (though we cannot polyfill `oldVersion`): https://github.com/ariya/phantomjs/issues/14141
        if (!('newVersion' in e)) {
          e.newVersion = null
        }

        resolve(e)
      }
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
