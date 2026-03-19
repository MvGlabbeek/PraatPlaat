import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { DiagramData } from "@shared/schema";

interface ChatPanelProps {
  diagramId: number;
  onDiagramDataChange: (ops: any[]) => void;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const SUGGESTIONS = [
  "Voeg een actor 'Manager' toe",
  "Maak een applicatie 'CRM Systeem'",
  "Voeg een proces 'Goedkeuring' toe",
  "Verbind 'Burger' met 'Aanvraag verwerken'",
  "Voeg een systeem 'Email Server' toe",
];

export default function ChatPanel({ diagramId, onDiagramDataChange }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/diagrams", diagramId, "chat"],
    queryFn: () => apiRequest("GET", `/api/diagrams/${diagramId}/chat`).then(r => r.json()),
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/diagrams/${diagramId}/chat`, { message });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/diagrams", diagramId, "chat"] });
      if (data.operations?.length > 0) {
        onDiagramDataChange(data.operations);
      }
    },
  });

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || sendMutation.isPending) return;
    setInput("");
    sendMutation.mutate(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <Bot size={14} className="text-primary" />
        <span className="text-xs font-semibold">Praatplaat Assistent</span>
        <div className={`ml-auto w-2 h-2 rounded-full ${sendMutation.isPending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot size={28} className="mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground mb-3">
              Beschrijf wat je wilt toevoegen of wijzigen op de praatplaat.
            </p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  className="block w-full text-left text-[11px] px-2.5 py-1.5 rounded-md bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            data-testid={`chat-message-${msg.id}`}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-primary" : "bg-muted"}`}>
              {msg.role === "user"
                ? <User size={11} className="text-primary-foreground" />
                : <Bot size={11} className="text-foreground" />
              }
            </div>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <Bot size={11} />
            </div>
            <div className="bg-muted rounded-lg rounded-tl-sm px-3 py-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t space-y-2">
        <div className="flex gap-1.5">
          <Textarea
            data-testid="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ een opdracht... (Enter = verstuur)"
            className="text-xs resize-none min-h-[60px] max-h-[100px]"
            rows={2}
          />
          <Button
            data-testid="chat-send"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            size="sm"
            className="self-end h-8 w-8 p-0 flex-shrink-0"
          >
            <Send size={13} />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Typ: "Voeg een actor X toe" · "Maak een applicatie Y" · "Verbind X met Y"
        </p>
      </div>
    </div>
  );
}
