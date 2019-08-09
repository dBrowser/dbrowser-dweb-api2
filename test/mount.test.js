const test = require('ava')
const tutil = require('./util')
const pda = require('../index')

var daemon

test.before(async () => {
  daemon = await tutil.createOneDaemon()
})
test.after(async () => {
  await daemon.cleanup()
})

test('mount and unmount', async t => {
  var archive1 = await tutil.createArchive(daemon, [])
  var archive2 = await tutil.createArchive(daemon, [
    'bar'
  ])

  await pda.mount(archive1, '/foo', archive2.key)
  t.deepEqual((await pda.readdir(archive1, '/')).sort(), ['.key', 'foo'].sort())
  t.deepEqual((await pda.readdir(archive1, '/foo')).sort(), ['.key', 'bar'].sort())
  t.deepEqual((await pda.readdir(archive1, '/', {recursive: true})).sort(), [
    ".key",
    "foo",
    "foo/.key",
    "foo/bar"
  ].sort())
  t.deepEqual((await pda.stat(archive1, '/foo')).isDirectory(), true)
  await pda.writeFile(archive2, 'hello.txt', 'hello')
  t.deepEqual(await pda.readFile(archive1, '/foo/hello.txt', 'utf8'), 'hello')

  await pda.unmount(archive1, '/foo')
  t.deepEqual((await pda.readdir(archive1, '/')).sort(), ['.key'].sort())
})

// TODO
/*test('mount at version', async t => {
  var archive1 = await tutil.createArchive(daemon, [])
  var archive2 = await tutil.createArchive(daemon, [
    'bar'
  ])

  pda.writeFile(archive2, '/test.txt', '1')
  pda.writeFile(archive2, '/test.txt', '2')

  await pda.mount(archive1, '/foo', {key: archive2.key, version: 2})
  t.deepEqual(await pda.readFile(archive1, '/foo/test.txt', 'utf8'), '1')
})*/

test('EntryAlreadyExistsError', async t => {
  var archive = await tutil.createArchive(daemon, [])
  var archive2 = await tutil.createArchive(daemon, [])

  await pda.writeFile(archive, '/file', 'new content')
  const err = await t.throws(pda.mount(archive, '/file', archive2.key))
  t.truthy(err.entryAlreadyExists)
})

test('ArchiveNotWritableError', async t => {
  var archive = await tutil.createArchive(daemon, [], tutil.FAKE_DAT_KEY)
  var archive2 = await tutil.createArchive(daemon, [])

  const err = await t.throws(pda.mount(archive, '/bar', archive2.key))
  t.truthy(err.archiveNotWritable)

  const err2 = await t.throws(pda.unmount(archive, '/bar'))
  t.truthy(err2.archiveNotWritable)
})

test('InvalidPathError', async t => {
  var archive = await tutil.createArchive(daemon, [])
  var archive2 = await tutil.createArchive(daemon, [])

  const err = await t.throws(pda.mount(archive, '/foo%20bar', archive2.key))
  t.truthy(err.invalidPath)

  const err2 = await t.throws(pda.unmount(archive, '/foo%20bar'))
  t.truthy(err2.invalidPath)
})

test('ParentFolderDoesntExistError', async t => {
  var archive = await tutil.createArchive(daemon, [
    'foo'
  ])
  var archive2 = await tutil.createArchive(daemon, [])

  const err1 = await t.throws(pda.mount(archive, '/bar/foo', archive2.key))
  t.truthy(err1.parentFolderDoesntExist)

  const err2 = await t.throws(pda.mount(archive, '/foo/bar', archive2.key))
  t.truthy(err2.parentFolderDoesntExist)
})

test('unmount NotFoundError', async t => {
  var archive = await tutil.createArchive(daemon, [])

  const err = await t.throws(pda.unmount(archive, '/foo/bar'))
  t.truthy(err.notFound)
})
