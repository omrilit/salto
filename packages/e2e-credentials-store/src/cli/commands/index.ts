/*
 * Copyright 2025 Salto Labs Ltd.
 * Licensed under the Salto Terms of Use (the "License");
 * You may not use this file except in compliance with the License.  You may obtain a copy of the License at https://www.salto.io/terms-of-use
 *
 * CERTAIN THIRD PARTY SOFTWARE MAY BE CONTAINED IN PORTIONS OF THE SOFTWARE. See NOTICE FILE AT https://github.com/salto-io/salto/blob/main/NOTICES
 */
import register from './register'
import unregister from './unregister'
import list from './list'
import adapters from './adapters'
import clear from './clear'
import free from './free'
import lease from './lease'

const commands = {
  register,
  unregister,
  list,
  adapters,
  clear,
  free,
  lease,
}

export default commands
