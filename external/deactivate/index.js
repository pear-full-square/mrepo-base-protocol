// deactivate: protocol/deactivate . <protocol>, an active protocol made inactive (README.md beside it).
import { activeAt } from '../../internal/config.js'

export async function deactivate (exec, { args = [] }) {
  const [name] = args
  if (!name) throw new Error('missing argument: protocol')
  if (await exec.find(activeAt(name)) === null) throw new Error(`not active: ${name}`)
  exec.remove(activeAt(name))
  exec.log('verbose', 'deactivated', 'Its file removed from the protocols layer.')
  return `Deactivated ${name}: requests from outside are refused for it.`
}
