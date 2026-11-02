import { useEffect, useState } from 'react'

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      /* storage unavailable or corrupt – fall back */
    }
    return typeof initial === 'function' ? initial() : initial
  })
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* quota / private mode – ignore */
    }
  }, [key, value])
  return [value, setValue]
}
