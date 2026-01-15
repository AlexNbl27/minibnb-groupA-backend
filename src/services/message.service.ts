import { supabase } from "../config/supabase";
import { Message } from "../types/message.types";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export class MessageService {
    // Envoyer un message
    async send(
        userId: string,
        conversationId: number,
        content: string,
    ): Promise<Message> {
        // Vérifier permission (guest, hôte ou co-hôte avec can_respond_messages)
        // Vérifier permission
        await this.checkSendPermission(conversationId, userId);

        const { data: message, error } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: userId,
                content,
            })
            .select()
            .single();

        if (error) throw error;
        return message;
    }

    // Récupérer les messages d'une conversation
    async getByConversation(
        conversationId: number,
        userId: string,
        pagination: { page: number; limit: number } = { page: 1, limit: 10 },
    ): Promise<{ data: Message[]; total: number }> {
        // Vérifier permission
        await this.checkViewPermission(conversationId, userId);

        const from = (pagination.page - 1) * pagination.limit;
        const to = from + pagination.limit - 1;

        const { data, error, count } = await supabase
            .from("messages")
            .select("*, sender:profiles(first_name, last_name, avatar_url)", { count: "exact" })
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .range(from, to);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0
        };
    }

    // Vérifier permission d'envoi
    private async checkSendPermission(
        conversationId: number,
        userId: string,
    ): Promise<void> {
        const { data: conversation } = await supabase
            .from("conversations")
            .select("guest_id, host_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) throw new NotFoundError("Conversation not found");

        // Guest ou hôte
        if (
            conversation.guest_id === userId ||
            conversation.host_id === userId
        ) {
            return;
        }

        // Co-hôte avec can_respond_messages
        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_respond_messages")
            .eq("listing_id", conversation.listing_id)
            .eq("co_host_id", userId)
            .single();

        if (!coHost?.can_respond_messages) {
            throw new ForbiddenError("You cannot send messages in this conversation");
        }
    }

    // Vérifier permission de lecture
    private async checkViewPermission(
        conversationId: number,
        userId: string,
    ): Promise<void> {
        const { data: conversation } = await supabase
            .from("conversations")
            .select("guest_id, host_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) throw new NotFoundError("Conversation not found");

        if (
            conversation.guest_id === userId ||
            conversation.host_id === userId
        ) {
            return;
        }

        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_access_messages")
            .eq("listing_id", conversation.listing_id)
            .eq("co_host_id", userId)
            .single();

        if (!coHost?.can_access_messages) {
            throw new ForbiddenError("You cannot view this conversation");
        }
    }
}
