import { Response } from "express";

export class SuccessResponse {
    constructor(
        public statusCode: number,
        public data: any,
        public message: string = "Success",
        public meta?: any
    ) { }

    public send(res: Response): void {
        res.status(this.statusCode).json({
            success: true,
            status: "success",
            message: this.message,
            code: this.statusCode,
            data: this.data,
            meta: this.meta
        });
    }
}

export class OkResponse extends SuccessResponse {
    constructor(data: any, meta?: any, message: string = "Success") {
        super(200, data, message, meta);
    }
}

export class CreatedResponse extends SuccessResponse {
    constructor(data: any, meta?: any, message: string = "Created") {
        super(201, data, message, meta);
    }
}

export class NoContentResponse extends SuccessResponse {
    constructor(message: string = "No Content") {
        super(204, message);
    }
}


