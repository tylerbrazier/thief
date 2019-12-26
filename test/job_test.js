const fs = require('fs')
const assert = require('assert').strict
const tar = require('tar')
const { join } = require('path')
const {
  getFirstFilename,
  readJson,
  moveAllFiles,
  compressDir,
} = require('../tools/job.js')

const TEST_DIR = join(__dirname, 'dummy')
const EMPTY_DIR = join(__dirname, 'empty')
const info = {
  with_playlist: JSON.stringify({
    playlist: 'Test Playlist',
    ext: 'mp3',
    _filename: 'Test_Song',
  }),
  null_playlist: JSON.stringify({
    playlist: null,
    ext: 'ogg',
    _filename: 'Not_From_Playlist'
  }),
  invalid_json: '{asdf}',
}

main()

async function main () {
  try {
    setup()
    await testGetFirstFilename()
    await testReadJson()
    await testMoveAllFiles()
    await testCompressDir()
    console.log('All tests passed')
  } catch (err) {
    console.error(err)
  } finally {
    cleanup()
  }
}

function setup () {
  console.log('Creating:', EMPTY_DIR, TEST_DIR)
  fs.mkdirSync(EMPTY_DIR, { recursive: true })
  fs.mkdirSync(TEST_DIR, { recursive: true })
  console.log('Creating *.info.json')
  fs.writeFileSync(join(TEST_DIR, 'with_playlist.info.json'), info.with_playlist)
  fs.writeFileSync(join(TEST_DIR, 'null_playlist.info.json'), info.null_playlist)
  fs.writeFileSync(join(TEST_DIR, 'invalid.info.json'), info.invalid_json)
}
function cleanup () {
  console.log('Removing:', EMPTY_DIR, TEST_DIR)
  fs.rmdirSync(EMPTY_DIR, { recursive: true })
  fs.rmdirSync(TEST_DIR, { recursive: true })
}

async function testGetFirstFilename () {
  let filename = await getFirstFilename(TEST_DIR, f => f !== 'invalid.info.json')
  assert(['with_playlist.info.json', 'null_playlist.info.json'].includes(filename))

  // test works without filter
  filename = await getFirstFilename(TEST_DIR)
  assert(filename.endsWith('.info.json'))

  filename = await getFirstFilename(TEST_DIR, f => f === 'none')
  assert(!filename)

  filename = await getFirstFilename(EMPTY_DIR)
  assert(!filename)

  // test that it does not return a directory
  try {
    fs.mkdirSync(join(EMPTY_DIR, 'only_dir'))
    filename = await getFirstFilename(EMPTY_DIR)
    assert(!filename)
  } finally {
    fs.rmdirSync(join(EMPTY_DIR, 'only_dir'))
  }

  console.log('testGetFirstFilename passed')
}

async function testReadJson () {
  let json = await readJson(TEST_DIR, 'with_playlist.info.json')
  assert.equal(json.playlist, 'Test Playlist')

  json = await readJson(TEST_DIR, 'null_playlist.info.json')
  assert.equal(json.playlist, null)

  assert.rejects(async () => await readJson(TEST_DIR, 'no_file'))
  assert.rejects(async () => await readJson(TEST_DIR, 'invalid.info.json'),
    /Unable to parse invalid.info.json/)

  console.log('testReadJson passed')
}

async function testMoveAllFiles () {
  // setup: add some new files to TEST_DIR and make a dest dir
  const dest = join(TEST_DIR, 'move_test')
  fs.writeFileSync(join(TEST_DIR, 'one.txt'), 'one')
  fs.writeFileSync(join(TEST_DIR, 'two.js'), 'var a = 1')
  fs.writeFileSync(join(TEST_DIR, 'three.json'), '{"a":1}')
  fs.mkdirSync(dest)

  await moveAllFiles(TEST_DIR, dest, f => !f.endsWith('.info.json'))
  assert(fs.existsSync(join(dest, 'one.txt')))
  assert(fs.existsSync(join(dest, 'two.js')))
  assert(fs.existsSync(join(dest, 'three.json')))
  assert(!fs.existsSync(join(TEST_DIR, 'one.txt')))
  assert(!fs.existsSync(join(TEST_DIR, 'two.js')))
  assert(!fs.existsSync(join(TEST_DIR, 'three.json')))

  console.log('testMoveAllFiles passed')
}

async function testCompressDir () {
  // setup: make a dir with a couple of files
  const dir = join(TEST_DIR, 'compress_me')
  fs.mkdirSync(dir)
  fs.writeFileSync(join(dir, 'a.txt'), 'a')
  fs.writeFileSync(join(dir, 'b.txt'), 'b')

  const filepath = await compressDir(dir)
  assert.equal(filepath, join(TEST_DIR, 'compress_me.tar.gz'))

  assert(fs.existsSync(filepath))

  const entries = []
  tar.t({
    file: join(TEST_DIR, 'compress_me.tar.gz'),
    sync: true,
    onentry: entry => entries.push(entry.path),
  })
  assert(entries.length === 3)
  assert(entries.includes('compress_me/'))
  assert(entries.includes('compress_me/a.txt'))
  assert(entries.includes('compress_me/b.txt'))

  console.log('testCompressDir passed')
}
