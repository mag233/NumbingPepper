import Database from '@tauri-apps/plugin-sql'
import { isTauri } from './isTauri'

let client: Database | null = null

export const getSqlite = async () => {
  if (!isTauri()) return null
  if (client) return client
  client = await Database.load('sqlite:settings.db')
  return client
}
