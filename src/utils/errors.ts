export class AppError extends Error {
    public status: string;
    public isOperational: boolean;

    constructor(
        public statusCode: number,
        public message: string,
        public errors?: any[],
    ) {
        super(message);
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, errors?: any[]) {
        super(400, message, errors);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(401, message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(403, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(404, message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, message);
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = "Internal server error") {
        super(500, message);
    }
}
