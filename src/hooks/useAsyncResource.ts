import { useCallback, useEffect, useRef, useState } from 'react'

import { getErrorMessage } from '@/services/apiClient'
import { cacheGet, cacheSet } from '@/services/cache'

interface AsyncResource<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  setData: (updater: T | ((prev: T | null) => T)) => void
}

export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  cacheKey?: string,
): AsyncResource<T> {
  const [data, setDataState] = useState<T | null>(() => (cacheKey ? cacheGet<T>(cacheKey) : null))
  const [loading, setLoading] = useState(() => !(cacheKey && cacheGet<T>(cacheKey)))
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const load = useCallback(
    async (showLoading: boolean) => {
      if (showLoading) setLoading(true)
      try {
        const result = await loaderRef.current()
        if (cacheKey) cacheSet(cacheKey, result)
        setDataState(result)
        setError(null)
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, ...deps],
  )

  const refresh = useCallback(() => load(true), [load])
  const refreshSilently = useCallback(() => load(false), [load])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Re-fetch quietly when the tab regains focus, but only when the cached copy
  // has expired — this keeps navigation instant on a slow backend.
  useEffect(() => {
    const onFocus = () => {
      if (cacheKey && cacheGet(cacheKey)) return
      void refreshSilently()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !(cacheKey && cacheGet(cacheKey))) {
        void refreshSilently()
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshSilently, cacheKey])

  const update = useCallback((updater: T | ((prev: T | null) => T)) => {
    setDataState((prev) =>
      typeof updater === 'function'
        ? (updater as (value: T | null) => T)(prev)
        : updater,
    )
  }, [])

  return { data, loading, error, refresh, setData: update }
}
