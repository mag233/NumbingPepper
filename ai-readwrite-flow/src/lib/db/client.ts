import Database from '@tauri-apps/plugin-sql'
import { Store } from '@tauri-apps/plugin-store'
import { isTauri } from '../isTauri'

const STORE_FILE = 'settings.store.dat'

let client: Database | null = null
let store: Store | null = null

export const ensureClient = async (): Promise<Database | null> => {
  if (!isTauri()) return null
  if (client) return client
  client = await Database.load('sqlite:settings.db')
  return client
}

export const ensureStore = async (): Promise<Store | null> => {
  if (!isTauri()) return null
  if (store) return store
  try {
    store = await Store.load(STORE_FILE)
    return store
  } catch {
    return null
  }
}

