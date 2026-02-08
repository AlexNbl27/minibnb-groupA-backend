import { supabase, supabaseAdmin } from "../config/supabase";
import { Message } from "../types/message.types";
import { ForbiddenError, NotFoundError } from "../utils/errors";

export class MessageService {
  // Envoyer un message
  async send(userId: string, conversationId: number, content: string): Promise<Message> {
    // Vérifier permission (guest, hôte ou co-hôte avec can_respond_messages)
    // Vérifier permission
    await this.checkSendPermission(conversationId, userId);

    const { data: message, error } = await supabaseAdmin
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

  // Créer ou récupérer une conversation
  async createConversation(guestId: string, listingId: number, message?: string): Promise<any> {
    // 1. Vérifier si une conversation existe déjà
    const { data: existingConversation } = await supabaseAdmin.from("conversations").select("id").eq("guest_id", guestId).eq("listing_id", listingId).single();

    if (existingConversation) {
      // Si message fourni, l'envoyer
      if (message) {
        await this.send(guestId, existingConversation.id, message);
      }
      return existingConversation;
    }

    // 2. Si non, récupérer l'hôte du listing
    const { data: listing } = await supabase.from("listings").select("host_id").eq("id", listingId).single();

    if (!listing) throw new NotFoundError("Listing not found");

    if (listing.host_id === guestId) {
      throw new ForbiddenError("You cannot contact yourself");
    }

    // 3. Créer la conversation (Utilisation de supabaseAdmin pour contourner RLS)
    const { data: newConversation, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        listing_id: listingId,
        guest_id: guestId,
        host_id: listing.host_id,
      })
      .select()
      .single();

    if (error) throw error;

    // 4. Envoyer le message initial si présent
    if (message) {
      await this.send(guestId, newConversation.id, message);
    }

    return newConversation;
  }

  // Récupérer les messages d'une conversation
  async getByConversation(conversationId: number, userId: string, pagination?: { page: number; limit: number }): Promise<{ data: Message[]; total: number; conversation?: any }> {
    // Vérifier permission
    await this.checkViewPermission(conversationId, userId);

    // Fetch conversation metadata
    const { data: conversationData, error: conversationError } = await supabaseAdmin
      .from("conversations")
      .select(
        `
                *,
                listing:listings(name, picture_url),
                guest:profiles!conversations_guest_id_fkey(first_name, last_name, avatar_url),
                host:profiles!conversations_host_id_fkey(first_name, last_name, avatar_url)
            `,
      )
      .eq("id", conversationId)
      .single();

    if (conversationError) throw conversationError;

    let query = supabaseAdmin
      .from("messages")
      .select("*, sender:profiles(first_name, last_name, avatar_url)", { count: "exact" })
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (pagination) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      conversation: conversationData,
    };
  }

  // Récupérer les conversations d'un utilisateur
  async getUserConversations(userId: string) {
    // Utilisation de supabaseAdmin car RLS bloque les SELECT sur conversations
    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select(
        `
                *,
                listing:listings(name, picture_url),
                guest:profiles!conversations_guest_id_fkey(first_name, last_name, avatar_url),
                host:profiles!conversations_host_id_fkey(first_name, last_name, avatar_url),
                messages(content, created_at, sender_id)
            `,
      )
      .or(`guest_id.eq.${userId},host_id.eq.${userId}`)
      .order("created_at", { foreignTable: "messages", ascending: false })
      .limit(1, { foreignTable: "messages" });

    if (error) throw error;

    return data
      .map((conv: any) => ({
        ...conv,
        last_message: conv.messages && conv.messages.length > 0 ? conv.messages[0] : null,
      }))
      .sort((a: any, b: any) => {
        const dateA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.created_at).getTime();
        const dateB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.created_at).getTime();
        return dateB - dateA;
      });
  }

  // Vérifier permission d'envoi
  private async checkSendPermission(conversationId: number, userId: string): Promise<void> {
    // Utilisation de supabaseAdmin car RLS bloque les SELECT sur conversations
    const { data: conversation } = await supabaseAdmin.from("conversations").select("guest_id, host_id, listing_id").eq("id", conversationId).single();

    if (!conversation) throw new NotFoundError("Conversation not found");

    // Guest ou hôte
    if (conversation.guest_id === userId || conversation.host_id === userId) {
      return;
    }

    // Co-hôte avec can_respond_messages
    const { data: coHost } = await supabase.from("co_hosts").select("can_respond_messages").eq("listing_id", conversation.listing_id).eq("co_host_id", userId).single();

    if (!coHost?.can_respond_messages) {
      throw new ForbiddenError("You cannot send messages in this conversation");
    }
  }

  // Vérifier permission de lecture
  private async checkViewPermission(conversationId: number, userId: string): Promise<void> {
    // Utilisation de supabaseAdmin car RLS bloque les SELECT sur conversations
    const { data: conversation } = await supabaseAdmin.from("conversations").select("guest_id, host_id, listing_id").eq("id", conversationId).single();

    if (!conversation) throw new NotFoundError("Conversation not found");

    if (conversation.guest_id === userId || conversation.host_id === userId) {
      return;
    }

    const { data: coHost } = await supabase.from("co_hosts").select("can_access_messages").eq("listing_id", conversation.listing_id).eq("co_host_id", userId).single();

    if (!coHost?.can_access_messages) {
      throw new ForbiddenError("You cannot view this conversation");
    }
  }

  // Assigner un co-hôte à une conversation
  async assignCoHost(conversationId: number, coHostId: number, userId: string): Promise<void> {
    // Hôte uniquement (ou admin si applicable, mais ici hôte du listing)
    const { data: conversation } = await supabaseAdmin.from("conversations").select("listing_id, host_id").eq("id", conversationId).single();

    if (!conversation) throw new NotFoundError("Conversation not found");

    if (conversation.host_id !== userId) {
      throw new ForbiddenError("Only the host can assign a co-host");
    }

    // Vérifier que le co-hôte existe pour ce listing
    const { data: coHost } = await supabase
      .from("co_hosts")
      .select("id")
      .eq("listing_id", conversation.listing_id)
      .eq("id", coHostId) // coHostId est l'ID de la table co_hosts, pas user_id
      .single();

    if (!coHost) {
      throw new NotFoundError("Co-host not found for this listing");
    }

    const { error } = await supabaseAdmin.from("conversations").update({ co_host_id: coHostId }).eq("id", conversationId);

    if (error) throw error;
  }
}
