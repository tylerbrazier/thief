const KeepAliveEmitter = require('../tools/keepAliveEmitter.js')
const assert = require('assert').strict

main()

async function main () {
  try {
    await testKeepAliveFires()
    await testTimerResets()
    console.log('KeepAliveEmitter tests passed')
  } catch (err) {
    console.error(err)
  }
}

async function testTimerResets () {
  const emitter = new KeepAliveEmitter(100, 'test')
  try {
    emitter.emit('progress', 'initial event to start timer')

    emitter.on('progress', message => {
      if (message === 'test') assert.fail('keep-alive should not have fired')
    })

    await wait(70)
    emitter.emit('progress', 'should reset timer')
    await wait(70)
    emitter.emit('progress', 'should reset timer')
    await wait(70)

    console.log('testTimerResets passed')
  } finally {
    emitter.emit('done')
  }
}

async function testKeepAliveFires () {
  const emitter = new KeepAliveEmitter(100, 'test')
  try {
    emitter.emit('progress', 'initial event to start timer')
    const messages = []
    emitter.on('progress', message => messages.push(message))

    await wait(150)
    assert.equal(messages.length, 1)
    assert.equal(messages[0], 'test')

    await wait(70)
    assert.equal(messages.length, 2)
    assert.equal(messages[1], 'test')

    console.log('testKeepAliveFires passed')
  } finally {
    emitter.emit('done')
  }
}

function wait (delay) {
  return new Promise(resolve => setTimeout(resolve, delay))
}
