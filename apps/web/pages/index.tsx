"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === "") return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Milky</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {messages.map((message) => (
          <div key={message.id}>
            <strong>{message.role === "user" ? "You: " : "Milky: "}</strong>
            {message.parts.map((part, i) =>
              part.type === "text" ? (
                <span key={`${message.id}-${i}`} style={{ whiteSpace: "pre-wrap" }}>
                  {part.text}
                </span>
              ) : null
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Milky something..."
          disabled={status !== "ready"}
          style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <button type="submit" disabled={status !== "ready"} style={{ padding: "8px 16px" }}>
          Send
        </button>
      </form>
    </div>
  );
}
