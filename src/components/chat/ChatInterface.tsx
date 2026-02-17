import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, User, ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  buyer_id: string;
  admin_id: string | null;
  subject: string | null;
  last_message_at: string;
  buyer?: {
    full_name: string | null;
    company_name: string | null;
  };
}

export function ChatInterface() {
  const { user, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      let query = supabase
        .from("chat_conversations")
        .select(`
          id,
          buyer_id,
          admin_id,
          subject,
          last_message_at
        `)
        .order("last_message_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("buyer_id", user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching conversations:", error);
      } else {
        setConversations(data || []);
      }
    };

    fetchConversations();
  }, [user, isAdmin]);

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", activeConversation)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${activeConversation}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        buyer_id: user.id,
        subject: "New inquiry",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
    } else {
      setConversations((prev) => [data, ...prev]);
      setActiveConversation(data.id);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;

    setIsLoading(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      message: newMessage.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
      // Update last_message_at
      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConversation);
    }
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please login to use chat.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] min-h-[400px] bg-card rounded-xl border border-border overflow-hidden">
      {/* Conversations List */}
      <div className={cn(
        "w-80 border-r border-border flex flex-col",
        activeConversation && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </h3>
          {!isAdmin && (
            <Button size="sm" variant="outline" onClick={createConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations yet</p>
              {!isAdmin && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={createConversation}
                >
                  Start a conversation
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-secondary/50 transition-colors",
                    activeConversation === conv.id && "bg-secondary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.subject || "Conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conv.last_message_at), "MMM d, HH:mm")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !activeConversation && "hidden md:flex"
      )}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setActiveConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {isAdmin ? "Customer Support" : "Support Team"}
                </p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isOwn
                              ? "bg-shop text-shop-foreground rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          )}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwn ? "text-shop-foreground/70" : "text-muted-foreground"
                            )}
                          >
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Quick Replies */}
            <div className="px-4 pt-3 flex gap-2 flex-wrap">
              {[
                "What's the MOQ?",
                "Can I get a bulk discount?",
                "What's the delivery timeline?",
                "Do you offer COD?",
                "Send me a quotation",
              ].map((reply) => (
                <button
                  key={reply}
                  onClick={() => setNewMessage(reply)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 hover:bg-secondary text-foreground transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-accent"
                  disabled={!newMessage.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-4">
            <div>
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}