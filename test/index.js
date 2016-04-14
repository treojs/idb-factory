import 'indexeddbshim'
import ES6Promise from 'es6-promise'
import { expect } from 'chai'
import { open, del, cmp } from '../src'
import * as idbFactory from '../src'

describe('idb-factory', function idbFactoryTests() {
  ES6Promise.polyfill()
  this.timeout(5000)
  const dbName = 'idb-factory'

  before(() => del(dbName))

  it('exposes IDBFactory like API', () => {
    expect(idbFactory.open).a('function')
    expect(idbFactory.del).a('function')
    expect(idbFactory.cmp).a('function')
  })

  it('opens new db', () => {
    return open(dbName, 4, upgradeCallback).then((db) => {
      expect(db.version).equal(4)
      expect([].slice.call(db.objectStoreNames)).eql(['books'])
      return del(db)
    })
  })

  it('opens existing db', () => {
    return open(dbName, 3, upgradeCallback).then((db1) => {
      return open(dbName).then((db2) => {
        expect(db1.version).equal(db2.version)
        db1.close()
        db2.close()
        return del(dbName)
      })
    })
  })

  it('deletes db', () => {
    return open(dbName, 3, upgradeCallback).then((db1) => {
      db1.close()
      return del(dbName).then((e) => {
        // expect(e.oldVersion).equal(3) // Won't work in PhantomJS: https://github.com/ariya/phantomjs/issues/14141
        expect(e.newVersion).to.be.a('null')
      })
    })
  })

  it('compares 2 values', () => {
    expect(cmp(1, 5)).equal(-1)
    expect(cmp('z', 'a')).equal(1)
  })

  it('allows the upgradeneeded callback to throw its own error and be caught', () => {
    return open(dbName, 3, function upgradeneeded(/* e */) {
      throw new Error('Bad callback')
    }).catch((err) => {
      expect(err.message).equal('Bad callback')
    })
  })

  it('resumes from a genuine blocked event via resume property on open', () => {
    let caught = false
    return open(dbName, 3, upgradeCallback).then((db1) => {
      return open(dbName, 4).catch(function errorCatcher(err) {
        if (err.type === 'blocked') {
          // Handle other `err` errors here
          db1.close()
          caught = true
          return err.resume
        }
      }).then(function completedOpen(db2) {
        db2.close()
        expect(caught).equal(true)
        return del(dbName)
      })
    })
  })

  it('resumes from a genuine blocked event via resume property on del (and error properties are in order)', () => {
    let caught = false
    return open(dbName, 3, upgradeCallback).then((db) => {
      return del(dbName).catch(function errorCatcher(err) {
        if (err.type === 'blocked') {
          // Handle other `err` errors here
          // expect(err.oldVersion).to.equal(3) // https://bugzilla.mozilla.org/show_bug.cgi?id=1220279
          expect(err.newVersion).to.be.a('null')
          if (db) db.close()
          caught = true
          return err.resume
        }
      }).then(function completedDelete(e) {
        expect(e.oldVersion).equal(3)
        expect(e.newVersion).to.be.a('null')
        expect(caught).equal(true)
      })
    })
  })

  function upgradeCallback(e) {
    const books = e.target.result.createObjectStore('books', { keyPath: 'id' })
    books.createIndex('byTitle', 'title', { unique: true })
    books.createIndex('byAuthor', 'author')
  }
})
