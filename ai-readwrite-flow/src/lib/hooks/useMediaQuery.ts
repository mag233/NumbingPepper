import { useEffect, useState } from 'react'

type MediaQueryChangeHandler = (matches: boolean) => void

export const useMediaQuery = (query: string, onChange?: MediaQueryChangeHandler) => {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
      onChange?.(event.matches)
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [onChange, query])

  return matches
}
