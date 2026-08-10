"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ChatChannel, ChatMessage, ChatParticipant } from "@/lib/data/chat";

const roleLabel: Record<string, string> = {
  medico: "Médico",
  entrenador: "Entrenador",
  nutriologo: "Nutriólogo",
  deportista: "Deportista",
  admin: "Admin",
};

export function ChatPanel({
  athleteId,
  channel,
  initialMessages,
  participants,
  currentUserId,
  currentUserName,
  currentUserRole,
  placeholder = "Escribe un mensaje…",
  emptyLabel = "Sin mensajes todavía.",
}: {
  athleteId: string;
  channel: ChatChannel;
  initialMessages: ChatMessage[];
  participants: ChatParticipant[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  placeholder?: string;
  emptyLabel?: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nameById = useRef(new Map(participants.map((p) => [p.id, p.fullName])));

  useEffect(() => {
    const supabase = createClient();
    const realtimeChannel = supabase
      .channel(`chat:${athleteId}:${channel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `athlete_id=eq.${athleteId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            channel: ChatChannel;
            author_id: string;
            role_at_time: string;
            body: string;
            created_at: string;
          };
          if (row.channel !== channel) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                authorId: row.author_id,
                authorName: nameById.current.get(row.author_id) ?? "—",
                roleAtTime: row.role_at_time,
                body: row.body,
                createdAt: row.created_at,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [athleteId, channel]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;

    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("chat_messages").insert({
      athlete_id: athleteId,
      channel,
      author_id: currentUserId,
      role_at_time: currentUserRole,
      body: text,
    });
    setSending(false);
    if (!error) setBody("");
  }

  return (
    <div className="rounded-md border border-black/10">
      <div ref={listRef} className="max-h-80 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-black/50">{emptyLabel}</p>
        ) : (
          <ul className="grid gap-3">
            {messages.map((m) => (
              <li key={m.id}>
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{m.authorName}</span>
                  <span className="text-xs uppercase text-black/40">
                    {roleLabel[m.roleAtTime] ?? m.roleAtTime}
                  </span>
                </div>
                <p className="text-sm">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3">
        <p className="sr-only">Escribiendo como {currentUserName}</p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-black/15 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
