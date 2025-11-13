import { useState, useEffect, useCallback } from 'react'

// Generic hook for API calls
export const useApi = (apiFunction, immediate = true) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...params) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFunction(...params)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate, execute])

  return { data, loading, error, execute, refetch: execute }
}

// Hook for paginated API calls
export const usePaginatedApi = (apiFunction, initialPage = 1, pageSize = 10) => {
  const [data, setData] = useState([])
  const [page, setPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPage = useCallback(async (pageNum) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFunction({ page: pageNum, limit: pageSize })
      setData(result.data || result)
      setTotalPages(result.totalPages || Math.ceil((result.total || 0) / pageSize))
      setPage(pageNum)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, pageSize])

  useEffect(() => {
    fetchPage(page)
  }, [fetchPage, page])

  const nextPage = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1)
    }
  }

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setPage(pageNum)
    }
  }

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchPage(page),
  }
}

// Hook for infinite scroll API calls
export const useInfiniteApi = (apiFunction, pageSize = 20) => {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)
      setError(null)
      const result = await apiFunction({ page, limit: pageSize })
      const newData = result.data || result

      setData(prev => [...prev, ...newData])
      setHasMore(newData.length === pageSize)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [apiFunction, page, pageSize, loading, hasMore])

  useEffect(() => {
    if (page === 1) {
      loadMore()
    }
  }, []) // Only run on mount

  const reset = () => {
    setData([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  }
}

// Hook for real-time data with polling
export const usePollingApi = (apiFunction, interval = 30000, immediate = true) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      if (!loading) setLoading(true)
      setError(null)
      const result = await apiFunction()
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [apiFunction, loading])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }

    const intervalId = setInterval(fetchData, interval)

    return () => clearInterval(intervalId)
  }, [fetchData, interval, immediate])

  return { data, loading, error, refetch: fetchData }
}

export default useApi

