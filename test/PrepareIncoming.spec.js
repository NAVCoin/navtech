'use strict'

const expect = require('expect')
const rewire = require('rewire')
const sinon = require('sinon')
const config = require('config')

const globalSettings = config.get('GLOBAL')
const privateSettings = require('../src/settings/private.settings.json')

let PrepareIncoming = rewire('../src/lib/PrepareIncoming')

describe('[PrepareIncoming]', () => {
  describe('(run)', () => {
    it('should fail on params', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.run({ junkParam: 1234 }, callback)
    })
    it('should set the runtime variables and call getUnspent', (done) => {
      PrepareIncoming.getUnspent = () => {
        expect(PrepareIncoming.runtime.callback).toBe(callback)
        expect(PrepareIncoming.runtime.navClient).toBe(mockClient)
        expect(PrepareIncoming.runtime.outgoingNavBalance).toBe(50000)
        expect(PrepareIncoming.runtime.subBalance).toBe(1000)
        done()
      }

      const callback = () => {}

      const mockClient = {
        getAccountAddress: () => { return Promise.reject({ code: -17 }) },
      }

      PrepareIncoming.run({
        navClient: mockClient,
        outgoingNavBalance: 50000,
        subBalance: 1000,
      }, callback)
    })
  })
  describe('(getUnspent)', () => {
    before(() => { // reset the rewired functions
      PrepareIncoming = rewire('../src/lib/PrepareIncoming')
    })
    it('should fail to list unspent', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockClient = {
        listUnspent: () => { return Promise.reject({ code: -17 }) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        callback,
      }
      PrepareIncoming.getUnspent()
    })
    it('should find no unspent', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.notCalled(mockLogger.writeLog)
        done()
      }
      const mockClient = {
        listUnspent: () => { return Promise.resolve([]) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        callback,
      }
      PrepareIncoming.getUnspent()
    })
    it('should find unspent and call the filter function', (done) => {
      const mockNavCoin = {
        filterUnspent: (options, parsedCallback) => {
          expect(parsedCallback).toBe(PrepareIncoming.unspentFiltered)
          expect(options.unspent).toBe(unspent)
          expect(options.client).toBe(mockClient)
          expect(options.accountName).toBe(privateSettings.account[globalSettings.serverType])
          sinon.assert.notCalled(mockLogger.writeLog)
          done()
        },
      }
      const unspent = [1, 2, 3, 4]
      const callback = () => {}
      const mockClient = {
        listUnspent: () => { return Promise.resolve(unspent) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.__set__('NavCoin', mockNavCoin)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        callback,
      }
      PrepareIncoming.getUnspent()
    })
  })
  describe('(unspentFiltered)', () => {
    before(() => { // reset the rewired functions
      PrepareIncoming = rewire('../src/lib/PrepareIncoming')
    })
    it('should fail to filter the unspent', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockClient = {
        listUnspent: () => { return Promise.reject({ code: -17 }) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        callback,
      }
      PrepareIncoming.unspentFiltered(false)
    })
    it('should return true but have incorrect params', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockClient = {
        listUnspent: () => { return Promise.reject({ code: -17 }) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        callback,
      }
      PrepareIncoming.unspentFiltered(true, {
        junkParam: 1234,
      })
    })
    it('should return true but have no filtered pending', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockClient = {
        listUnspent: () => { return Promise.reject({ code: -17 }) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        callback,
      }
      PrepareIncoming.unspentFiltered(true, {
        currentPending: [],
      })
    })
    it('should return the right data, set currentPending and call PruneUnspent', (done) => {
      PrepareIncoming.pruneUnspent = (options, parsedCallback) => {
        expect(parsedCallback).toBe(PrepareIncoming.unspentPruned)
        expect(options.currentPending).toBe(currentPending)
        expect(options.client).toBe(mockClient)
        expect(options.subBalance).toBe(1000)
        expect(options.maxAmount).toBe(50000)
        sinon.assert.notCalled(mockLogger.writeLog)
        done()
      }
      const mockClient = {
        listUnspent: () => { return Promise.reject({ code: -17 }) },
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        navClient: mockClient,
        subBalance: 1000,
        outgoingNavBalance: 50000,
      }
      const currentPending = [1, 2, 3, 4]
      PrepareIncoming.unspentFiltered(true, {
        currentPending,
      })
    })
  })
  describe('(pruneUnspent)', () => {
    before(() => { // reset the rewired functions
      PrepareIncoming = rewire('../src/lib/PrepareIncoming')
    })
    it('should fail no currentPending param', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.pruneUnspent({
        junkParam: 1234,
      }, callback)
    })
    it('should fail on subBalance is not float', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      const currentPending = [1, 2, 3, 4]
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.pruneUnspent({
        currentPending,
        subBalance: true,
      }, callback)
    })
    it('should fail on maxAmount is not float', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.calledOnce(mockLogger.writeLog)
        done()
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      const currentPending = [1, 2, 3, 4]
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.pruneUnspent({
        currentPending,
        subBalance: 1000,
        maxAmount: 'ABCDE',
      }, callback)
    })
    it('should fail to return any pruned', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(false)
        expect(data.message).toBeA('string')
        sinon.assert.notCalled(mockLogger.writeLog)
        done()
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      const currentPending = [
        { amount: 10000 },
        { amount: 10000 },
        { amount: 10000 },
        { amount: 10000 },
      ]
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.pruneUnspent({
        currentPending,
        subBalance: 1000,
        maxAmount: 5000,
      }, callback)
    })
    it('should have at least 1 trasaction prepared after pruning', (done) => {
      const callback = (success, data) => {
        expect(success).toBe(true)
        expect(data.currentBatch.length).toBe(2)
        expect(data.sumPending).toBe(200)
        sinon.assert.notCalled(mockLogger.writeLog)
        done()
      }
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      const currentPending = [
        { amount: 100 },
        { amount: 100 },
        { amount: 10000 },
        { amount: 10000 },
      ]
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.pruneUnspent({
        currentPending,
        subBalance: 1000,
        maxAmount: 5000,
      }, callback)
    })
  })
  describe('(unspentPruned)', () => {
    before(() => { // reset the rewired functions
      PrepareIncoming = rewire('../src/lib/PrepareIncoming')
    })
    it('should fail with false success', (done) => {
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        callback: (success, data) => {
          expect(success).toBe(false)
          expect(data.message).toBeA('string')
          sinon.assert.calledOnce(mockLogger.writeLog)
          done()
        },
      }
      PrepareIncoming.unspentPruned(
        false, {})
    })
    it('should fail with no current batch', (done) => {
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        callback: (success, data) => {
          expect(success).toBe(false)
          expect(data.message).toBeA('string')
          sinon.assert.calledOnce(mockLogger.writeLog)
          done()
        },
      }
      PrepareIncoming.unspentPruned(
        true, {})
    })
    it('should fail with empty current batch', (done) => {
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        callback: (success, data) => {
          expect(success).toBe(false)
          expect(data.message).toBeA('string')
          sinon.assert.calledOnce(mockLogger.writeLog)
          done()
        },
      }
      PrepareIncoming.unspentPruned(
        true, { currentBatch: [] })
    })
    it('should succeed and run the runtime.callback', (done) => {
      const mockLogger = {
        writeLog: sinon.spy(),
      }
      PrepareIncoming.__set__('Logger', mockLogger)
      PrepareIncoming.runtime = {
        callback: (success, data) => {
          expect(success).toBe(true)
          expect(data.currentBatch).toBe(currentBatch)
          sinon.assert.notCalled(mockLogger.writeLog)
          done()
        },
      }
      const currentBatch = [
        { amount: 100 },
        { amount: 100 },
      ]
      PrepareIncoming.unspentPruned(
        true, { currentBatch })
    })
  })
})
