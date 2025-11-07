// Global TypeScript type definitions
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  avatar?: string
}

export interface NavigationItem {
  name: string
  path: string
  icon?: React.ComponentType
  children?: NavigationItem[]
}

export interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export interface StatsCardData {
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease'
  icon: React.ComponentType
}

export interface TableColumn {
  key: string
  title: string
  sortable?: boolean
  render?: (value: any, record: any) => React.ReactNode
}

export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  errors?: string[]
}

export interface PaginationData {
  page: number
  pageSize: number
  total: number
  totalPages: number
}