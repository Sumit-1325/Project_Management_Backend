class apiError extends Error {
  constructor(
    message = "Something went wrong",
     statusCode ,
     errors = [], 
     stack = ""
    ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.errors = errors;
    this.success = false;
    this.message = message;

    if (stack) {
      this.stack = stack;
    }else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };