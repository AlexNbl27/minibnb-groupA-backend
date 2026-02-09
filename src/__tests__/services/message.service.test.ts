import { MessageService } from "../../services/message.service";
import { supabaseAdmin } from "../../config/supabase";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

jest.mock("../../config/supabase");

const mockSupabaseAdmin = supabaseAdmin as any;

describe("MessageService", () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = new MessageService();
    jest.clearAllMocks();
  });

  describe("send", () => {
    it("should send message if user is guest", async () => {
      // checkSendPermission
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { guest_id: "user-id", host_id: "host-id", listing_id: 1 },
        error: null,
      });
      // insert
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { id: 1, content: "Hello" },
        error: null,
      });

      const result = await messageService.send("user-id", 1, "Hello");

      expect(mockSupabaseAdmin.insert).toHaveBeenCalledWith(expect.objectContaining({ content: "Hello" }));
      expect(result).toEqual({ id: 1, content: "Hello" });
    });

    it("should send message if user is co-host with permission", async () => {
      // checkSendPermission: not guest/host
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { guest_id: "guest-id", host_id: "host-id", listing_id: 1 },
        error: null,
      });
      // check co-host
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { can_respond_messages: true },
        error: null,
      });
      // insert
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { id: 1 },
        error: null,
      });

      await messageService.send("cohost-id", 1, "Hello");

      expect(mockSupabaseAdmin.insert).toHaveBeenCalled();
    });

    it("should throw ForbiddenError if co-host without permission", async () => {
      // checkSendPermission: not guest/host
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { guest_id: "guest-id", host_id: "host-id", listing_id: 1 },
        error: null,
      });
      // check co-host
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { can_respond_messages: false },
        error: null,
      });

      await expect(messageService.send("cohost-id", 1, "Hello")).rejects.toThrow(ForbiddenError);
    });

    it("should throw NotFoundError if conversation not found", async () => {
      mockSupabaseAdmin.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(messageService.send("user-id", 999, "Hello")).rejects.toThrow(NotFoundError);
    });
  });

  describe("getByConversation", () => {
    it("should return messages if user is guest or host", async () => {
      // checkViewPermission
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { guest_id: "user-id", host_id: "host-id", listing_id: 1 },
        error: null,
      });
      // fetch conversation metadata
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: {
          id: 1,
          guest_id: "user-id",
          host_id: "host-id",
          listing_id: 1,
          listing: { name: "Test Listing", picture_url: "test.jpg" },
          guest: { first_name: "Guest", last_name: "User", avatar_url: null },
          host: { first_name: "Host", last_name: "User", avatar_url: null },
        },
        error: null,
      });
      // get messages
      mockSupabaseAdmin.range.mockResolvedValueOnce({ data: [], count: 0, error: null });

      await messageService.getByConversation(1, "user-id");

      expect(mockSupabaseAdmin.eq).toHaveBeenCalledWith("conversation_id", 1);
    });

    it("should throw ForbiddenError if user has no permission", async () => {
      // checkViewPermission: not guest/host
      mockSupabaseAdmin.single.mockResolvedValueOnce({
        data: { guest_id: "guest-id", host_id: "host-id", listing_id: 1 },
        error: null,
      });
      // check co-host (not found or no permission)
      mockSupabaseAdmin.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(messageService.getByConversation(1, "other-id")).rejects.toThrow(ForbiddenError);
    });
  });
});
