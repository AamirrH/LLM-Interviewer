import { useSyncExternalStore } from 'react'

const subscribeRoute = (callback: () => void) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
const subscribeOnline = (callback: () => void) => {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}
export function useRoute() {
  return useSyncExternalStore(subscribeRoute, () => window.location.hash.slice(1) || '/')
}
export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine)
}
