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
        const canSend = await this.checkSendPermission(conversationId, userId);
        if (!canSend) {
            throw new ForbiddenError(
                "You cannot send messages in this conversation",
            );
        }

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
    ): Promise<Message[]> {
        // Vérifier permission
        const canView = await this.checkViewPermission(conversationId, userId);
        if (!canView) {
            throw new ForbiddenError("You cannot view this conversation");
        }

        const { data, error } = await supabase
            .from("messages")
            .select("*, sender:profiles(first_name, last_name, avatar_url)")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data;
    }

    // Vérifier permission d'envoi
    private async checkSendPermission(
        conversationId: number,
        userId: string,
    ): Promise<boolean> {
        const { data: conversation } = await supabase
            .from("conversations")
            .select("guest_id, host_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) return false;

        // Guest ou hôte
        if (
            conversation.guest_id === userId ||
            conversation.host_id === userId
        ) {
            return true;
        }

        // Co-hôte avec can_respond_messages
        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_respond_messages")
            .eq("listing_id", conversation.listing_id)
            .eq("co_host_id", userId)
            .single();

        return coHost?.can_respond_messages || false;
    }

    // Vérifier permission de lecture
    private async checkViewPermission(
        conversationId: number,
        userId: string,
    ): Promise<boolean> {
        const { data: conversation } = await supabase
            .from("conversations")
            .select("guest_id, host_id, listing_id")
            .eq("id", conversationId)
            .single();

        if (!conversation) return false;

        if (
            conversation.guest_id === userId ||
            conversation.host_id === userId
        ) {
            return true;
        }

        const { data: coHost } = await supabase
            .from("co_hosts")
            .select("can_access_messages")
            .eq("listing_id", conversation.listing_id)
            .eq("co_host_id", userId)
            .single();

        return coHost?.can_access_messages || false;
    }
}
