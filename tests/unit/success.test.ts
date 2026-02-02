import { Response } from "express";
import { OkResponse, CreatedResponse, NoContentResponse } from "../../src/utils/success";

describe("Unified Responses", () => {
    let mockRes: Partial<Response>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });
        mockRes = {
            status: mockStatus,
            json: mockJson,
        };
    });

    describe("OkResponse", () => {
        it("should send 200 status and correct body", () => {
            const data = { id: 1 };
            new OkResponse(data).send(mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith({
                success: true,
                status: "success",
                message: "Success",
                code: 200,
                data,
                errors: undefined,
                meta: undefined,
            });
        });

        it("should include metadata if provided", () => {
            const data = { id: 1 };
            const meta = { page: 1 };
            new OkResponse(data, meta).send(mockRes as Response);

            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                meta,
            }));
        });
    });

    describe("CreatedResponse", () => {
        it("should send 201 status", () => {
            const data = { id: 1 };
            new CreatedResponse(data).send(mockRes as Response);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
                data,
                message: "Created",
                code: 201,
            }));
        });
    });


});
