class ApiError extends Error{
    constructor(message,statusCode){
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this,this.constructor);
    }
}

export default ApiError;

