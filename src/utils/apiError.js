class ApiError extends Error{
  constructor(  // Constructor parameters with default values.
    statusCode,
    message= "Something went wrong",
    errors = [],
    stack = ""
  ){
    super(message)  // Call parent Error class with message.
    this.statusCode = statusCode  // 400, 404, 500 etc.
    this.data = null
    this.message = message
    this.success = false  // Always false for errors
    this.errors = errors  // Array of multiple errors

    if(stack) {   // Captures where the error happened (for debugging)
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {Api}