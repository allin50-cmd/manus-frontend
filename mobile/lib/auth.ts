import * as SecureStore from 'expo-secure-store'

const SESSION_KEY = 'fg_session_cookie'
const PERSON_KEY  = 'fg_person'

export async function storeSession(cookieValue: string, person: string) {
  await SecureStore.setItemAsync(SESSION_KEY, cookieValue)
  await SecureStore.setItemAsync(PERSON_KEY, person)
}

export async function getStoredSession(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY)
}

export async function getStoredPerson(): Promise<string | null> {
  return SecureStore.getItemAsync(PERSON_KEY)
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY)
  await SecureStore.deleteItemAsync(PERSON_KEY)
}

export async function isLoggedIn(): Promise<boolean> {
  const s = await getStoredSession()
  return !!s
}
