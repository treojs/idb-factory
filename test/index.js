import 'indexeddbshim'
import ES6Promise from 'es6-promise'
import { expect } from 'chai'
import { open, del } from '../src'
import * as idbFactory from '../src'

describe('idb-factory', () => {
  ES6Promise.polyfill()
  const dbName = 'idb-factory'

  before(() => del(dbName))

  it('exposes IDBFactory like API', () => {
    expect(idbFactory.open).a('function')
    expect(idbFactory.deleteDatabase).a('function')
    expect(idbFactory.cmp).a('function')
  })

  it('opens new db', () => {
    return open(dbName, 4, upgradeneeded).then((db) => {
      expect(db.version).equal(4)
      expect([].slice.call(db.objectStoreNames)).eql(['books'])
      return del(db)
    })
  })

  it('opens existing db', () => {
    return open(dbName, 3, upgradeneeded).then((db1) => {
      return open(dbName).then((db2) => {
        expect(db1.version).equal(db2.version)
        db1.close()
        db2.close()
        return del(dbName)
      })
    })
  })

  function upgradeneeded(e) {
    const books = e.target.result.createObjectStore('books', { keyPath: 'id' })
    books.createIndex('byTitle', 'title', { unique: true })
    books.createIndex('byAuthor', 'author')
  }
})
