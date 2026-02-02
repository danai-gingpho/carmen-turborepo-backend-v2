export interface ICommonResponse<T> {
  data?: T
  response: {
    status: number
    message: string
  }
}