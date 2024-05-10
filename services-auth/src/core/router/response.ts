export interface BaseResponse<T = unknown> {
  statusCode?: number
  message?: string
  /**
   * @default true
   */
  success?: boolean
  data?: T
  traceStack?: string
}
