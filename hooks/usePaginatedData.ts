import { useState, useEffect, useCallback } from 'react'
import { 
  getPaginatedData, 
  getFromIndexedDB,
  type PaginatedData,
  type PaginationOptions 
} from '@/lib/database'

export interface UsePaginatedDataOptions {
  tableName: string
  initialPageSize?: number
  fallbackData?: any[]
  searchFields?: string[]
}

export interface UsePaginatedDataReturn<T> {
  // Données
  data: PaginatedData<T>
  loading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  
  // Filtres et recherche
  searchTerm: string
  setSearchTerm: (term: string) => void
  filters: Record<string, any>
  setFilters: (filters: Record<string, any>) => void
  
  // Actions
  refresh: () => Promise<void>
  reset: () => void
}

export function usePaginatedData<T>({
  tableName,
  initialPageSize = 10,
  fallbackData = [],
  searchFields = ['name', 'title', 'product_title']
}: UsePaginatedDataOptions): UsePaginatedDataReturn<T> {
  const [data, setData] = useState<PaginatedData<T>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: initialPageSize,
    totalPages: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})

  const loadData = useCallback(async () => {
    setLoading(false)
    setError(null)
    
    try {
      const options: PaginationOptions = {
        page: currentPage,
        pageSize,
        searchTerm: searchTerm || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined
      }

      const indexedData = await getFromIndexedDB(tableName)
      
      if (indexedData.length > 0) {
        const result = await getPaginatedData<T>(tableName, options)
        setData(result)
      } else if (fallbackData.length > 0) {
        let filteredData = fallbackData

        if (searchTerm) {
          filteredData = fallbackData.filter((item: any) => {
            return searchFields.some(field => 
              item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
          })
        }

        if (Object.keys(filters).length > 0) {
          filteredData = filteredData.filter((item: any) => {
            return Object.entries(filters).every(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return true
              if (Array.isArray(value)) {
                return value.includes(item[key])
              }
              return item[key] === value
            })
          })
        }

        const total = filteredData.length
        const totalPages = Math.ceil(total / pageSize)
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedData = filteredData.slice(startIndex, endIndex)

        setData({
          data: paginatedData,
          total,
          page: currentPage,
          pageSize,
          totalPages
        })
      } else {
        setData({
          data: [],
          total: 0,
          page: 1,
          pageSize,
          totalPages: 0
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [tableName, currentPage, pageSize, searchTerm, filters, fallbackData, searchFields])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, filters])

  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const setPageSizeHandler = useCallback((size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }, [])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  const reset = useCallback(() => {
    setCurrentPage(1)
    setSearchTerm('')
    setFilters({})
  }, [])

  return {
    data,
    loading,
    error,
    
    currentPage,
    pageSize,
    setPage,
    setPageSize: setPageSizeHandler,
    
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    
    refresh,
    reset
  }
}

export function usePaginatedProducts(initialPageSize: number = 10) {
  return usePaginatedData({
    tableName: 'products',
    initialPageSize,
    fallbackData: [],
    searchFields: ['name', 'product_title', 'description']
  })
}

export function usePaginatedOrders(initialPageSize: number = 10) {
  return usePaginatedData({
    tableName: 'orders',
    initialPageSize,
    fallbackData: [],
    searchFields: ['order_number', 'customerName', 'customer_name', 'customerEmail']
  })
}

export function usePaginatedTickets(initialPageSize: number = 10) {
  return usePaginatedData({
    tableName: 'support_tickets',
    initialPageSize,
    fallbackData: [],
    searchFields: ['ticket_number', 'subject', 'customerName', 'customer_name']
  })
} 