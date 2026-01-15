import { Response } from "express";
import { sendSuccess, sendError } from "../../src/utils/response";

describe("Response Utils", () => {
    let mockRes: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockRes = {
            status: statusMock,
            json: jsonMock // For when status is not called (though sendSuccess calls it)
        };
    });

    describe("sendSuccess", () => {
        it("should send success response with default status 200", () => {
            const data = { id: 1 };
            sendSuccess(mockRes as Response, data);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data
            });
        });

        it("should send success response with custom status", () => {
            const data = { id: 1 };
            sendSuccess(mockRes as Response, data, 201);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data
            });
        });

        it("should include metadata if provided", () => {
            const data = [{ id: 1 }];
            const meta = { page: 1, total: 10 };
            sendSuccess(mockRes as Response, data, 200, meta);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                data,
                meta
            });
        });
    });

    describe("sendError", () => {
        it("should send error response with default status 500", () => {
            sendError(mockRes as Response, "Error message");

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: "Error message"
            });
        });

        it("should send error response with custom status and errors", () => {
            const errors = ["Field required"];
            sendError(mockRes as Response, "Validation Error", 400, errors);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: "Validation Error",
                errors
            });
        });
    });
});
