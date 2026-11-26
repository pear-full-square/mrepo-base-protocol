// The actions on a context written here: its files by URI, the protocols
// its runtime loaded.
import test from 'brittle'
import { activate, deactivate, activeAt } from '../index.js'

function context (protocols) {
  const files = {}
  const exec = {
    runtime: { protocols },
    read: async uri => { if (!(uri in files)) throw new Error('none'); return files[uri] },
    // the rest of an execution context, standing in: a file that may not
    // be there, the log (kept: entries, a line each), a step run as it is
    find: async function (p) { try { return await this.read(p) } catch { return null } },
    log: function (level, event, line) { if (typeof line !== 'string') throw new Error('not a log entry: a line'); (this.entries ??= []).push({ level, event, line }) },
    step: async function (event, line, fn, level = 'verbose') { const r = await fn(); (this.entries ??= []).push({ level, event, line: typeof line === 'function' ? line(r) : line }); return r },
    put: (uri, bytes) => { files[uri] = Buffer.from(bytes) },
    remove: uri => { delete files[uri] }
  }
  return { exec, files }
}
const HELP = { package: 'org/help', actions: { get: { uris: ['**'] } } }

test('activate: a loaded protocol\'s config written; one not loaded, no name', async (t) => {
  const { exec, files } = context({ help: HELP, boot: {} })
  t.alike(await activate(exec, { uri: ['.'], args: ['help'] }), 'Activated help: requests from outside are accepted for it.')
  t.alike(JSON.parse(files['/protocols/help.json'].toString()), HELP, 'its config, as the runtime loaded it, in the protocols layer')
  t.alike(await activate(exec, { uri: ['.'], args: ['help'] }), 'Activated help: requests from outside are accepted for it.', 'active already: written again, nothing else')
  await t.exception(activate(exec, { uri: ['.'], args: ['rest'] }), /no protocol: rest \(boot, help\)/)
  await t.exception(activate(exec, { uri: ['.'] }), /missing argument: protocol/)
})

test('deactivate: its file removed; one not active, no name', async (t) => {
  const { exec, files } = context({ help: HELP })
  await activate(exec, { uri: ['.'], args: ['help'] })
  t.alike(await deactivate(exec, { uri: ['.'], args: ['help'] }), 'Deactivated help: requests from outside are refused for it.')
  t.absent('/protocols/help.json' in files, 'out of the protocols layer')
  await t.exception(deactivate(exec, { uri: ['.'], args: ['help'] }), /not active: help/)
  await t.exception(deactivate(exec, { uri: ['.'] }), /missing argument: protocol/)
})

test('where the active set is: the protocols layer, a file a protocol', (t) => {
  t.is(activeAt('boot'), '/protocols/boot.json')
})
