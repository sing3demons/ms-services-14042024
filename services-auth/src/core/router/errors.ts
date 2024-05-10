export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export class ValidationError extends HttpError {
  constructor(public message: string) {
    super(400, message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}
