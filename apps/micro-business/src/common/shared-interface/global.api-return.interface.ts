export interface GlobalApiReturn<T> {
  response: { status: number }
  data: T
  message?: string
}