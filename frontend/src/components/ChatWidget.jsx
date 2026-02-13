'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function ChatWidget({
  warriorName = 'Luna',
  warriorClass = 'bard',
  portraitSrc = '/warriors/luna_bard.png',
  onSend,
  messages: externalMessages,
}) {
  const [messages, setMessages] = useState(externalMessages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (externalMessages) setMessages(externalMessages);
  }, [externalMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const reply = await onSend?.(text);
      if (reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-[var(--radius-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Image
          src={portraitSrc}
          alt={warriorName}
          width={36}
          height={36}
          className="rounded-full object-cover"
        />
        <div>
          <span className="text-sm font-medium text-txt">{warriorName}</span>
          <span className="text-xs text-txt-dim ml-2">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-guardian text-bg rounded-br-sm'
                  : 'bg-elevated text-txt-body rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-elevated text-txt-dim px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm">
              <span className="animate-pulse">Typing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-elevated border border-border rounded-[var(--radius-btn)] px-4 py-2.5 text-sm text-txt placeholder:text-txt-dim focus:outline-none focus:border-guardian transition-colors"
        />
        <Button onClick={handleSend} disabled={!input.trim() || sending} className="px-4 py-2.5">
          Send
        </Button>
      </div>
    </div>
  );
}
