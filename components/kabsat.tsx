"use client";

import { Bot, ChevronDown, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useState } from "react";

type Message = { role: "bot" | "user"; text: string };

const suggestions = ["Best rainy-day stops?", "Where can I eat near Burnham?", "Make a relaxed first day"];

function answerFor(input: string) {
  const value = input.toLowerCase();
  if (value.includes("rain")) return "For a rainy day, try Museo Kordilyera, Baguio Museum, Ili-Likha, or a slow café stop. Keep a flexible outdoor backup for when the fog clears.";
  if (value.includes("eat") || value.includes("food") || value.includes("restaurant")) return "Near Burnham, you’re close to the market, Session Road, Café by the Ruins, and several local bakeries. Explore has more restaurant ideas by area.";
  if (value.includes("first") || value.includes("relax")) return "A gentle first day: Burnham Park in the morning, Session Road for lunch, Baguio Cathedral, then Mirador before sunset. The Plan tab can save it for you.";
  if (value.includes("nearby") || value.includes("people")) return "Open Nearby when you’re in Baguio, choose a visibility window, and share your location. Other travelers only see an approximate map area—not your exact coordinates.";
  return "I can help with routes, food areas, weather-friendly options, and trip pacing. For a full saved route, open the Plan tab.";
}

export function Kabsat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Naimbag nga aldaw! I’m Kabsat. Ask me anything about planning your Baguio trip." },
  ]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: "user", text: clean }, { role: "bot", text: answerFor(clean) }]);
    setInput("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  return (
    <div className={`kabsat ${open ? "open" : ""}`}>
      {open && (
        <section className="kabsat-panel" aria-label="Kabsat travel assistant">
          <header>
            <div className="kabsat-avatar"><img src="/assets/img/kabsat-avatar.svg" alt="" /></div>
            <div><strong>Kabsat</strong><span><i /> Local trip helper</span></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close Kabsat"><ChevronDown /></button>
          </header>
          <div className="kabsat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>{message.text}</div>
            ))}
          </div>
          <div className="kabsat-suggestions">
            {suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}
          </div>
          <form onSubmit={submit}>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask Kabsat…" aria-label="Message Kabsat" />
            <button type="submit" aria-label="Send message"><Send size={18} /></button>
          </form>
          <p className="kabsat-note"><Sparkles size={13} /> Suggestions are planning aids—confirm current local details.</p>
        </section>
      )}
      <button type="button" className="kabsat-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? <X size={21} /> : <Bot size={22} />}
        <span>{open ? "Close" : "Ask Kabsat"}</span>
      </button>
    </div>
  );
}
