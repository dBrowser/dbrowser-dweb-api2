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

test('read/write/update manifest', async t => {
  var archive = await tutil.createArchive(daemon, [])

  await pda.writeManifest(archive, {
    url: `dweb://${tutil.FAKE_DAT_KEY}`,
    title: 'My DWeb',
    description: 'This dweb has a manifest!',
    type: 'foo bar',
    links: {repository: 'https://github.com/dbrowser/dbrowser-dweb-api.git'},
    author: 'dweb://ffffffffffffffffffffffffffffffff'
  })

  t.deepEqual(await pda.readManifest(archive), {
    title: 'My DWeb',
    description: 'This dweb has a manifest!',
    type: 'foo bar',
    links: {repository: [{href: 'https://github.com/dbrowser/dbrowser-dweb-api.git'}]},
    url: `dweb://${tutil.FAKE_DAT_KEY}`,
    author: 'dweb://ffffffffffffffffffffffffffffffff'
  })

  await pda.updateManifest(archive, {
    title: 'My DWeb!!',
    type: 'foo'
  })

  t.deepEqual(await pda.readManifest(archive), {
    title: 'My DWeb!!',
    description: 'This dweb has a manifest!',
    type: 'foo',
    links: {repository: [{href: 'https://github.com/dbrowser/dbrowser-dweb-api.git'}]},
    url: `dweb://${tutil.FAKE_DAT_KEY}`,
    author: 'dweb://ffffffffffffffffffffffffffffffff'
  })

  await pda.updateManifest(archive, {
    author: {url: 'dweb://foo.com'}
  })

  t.deepEqual(await pda.readManifest(archive), {
    title: 'My DWeb!!',
    description: 'This dweb has a manifest!',
    type: 'foo',
    links: {repository: [{href: 'https://github.com/dbrowser/dbrowser-dweb-api.git'}]},
    url: `dweb://${tutil.FAKE_DAT_KEY}`,
    author: 'dweb://foo.com'
  })

  // should ignore bad well-known values
  // but leave others alone
  await pda.updateManifest(archive, {
    author: true,
    foobar: true
  })

  t.deepEqual(await pda.readManifest(archive), {
    title: 'My DWeb!!',
    description: 'This dweb has a manifest!',
    type: 'foo',
    links: {repository: [{href: 'https://github.com/dbrowser/dbrowser-dweb-api.git'}]},
    url: `dweb://${tutil.FAKE_DAT_KEY}`,
    author: 'dweb://foo.com',
    foobar: true
  })
})

