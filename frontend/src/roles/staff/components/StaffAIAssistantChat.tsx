import { FormEvent, useMemo, useState } from 'react';
import { Bot, Loader2, Send, X } from 'lucide-react';
import { sendStaffAiChatMessage } from '../../../services/staffAiChatApi';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  type?: string;
};

type PendingAction = {
  name: string;
  status?: string;
  data: Record<string, unknown>;
} | null;

function makeMessage(role: ChatMessage['role'], text: string, type?: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    type,
  };
}

export function StaffAIAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    makeMessage('assistant', 'Bạn có thể kiểm tra gói hội viên hoặc gia hạn gói.'),
  ]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const submitMessage = async (messageText: string, action: PendingAction = pendingAction) => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setMessages((current) => [...current, makeMessage('user', trimmed)]);
    setIsLoading(true);

    try {
      const result = await sendStaffAiChatMessage(trimmed, action);
      setMessages((current) => [...current, makeMessage('assistant', result.reply || 'Đã xử lý xong.', result.type)]);
      setPendingAction(result.pendingAction ?? null);
    } catch (error: any) {
      setMessages((current) => [...current, makeMessage('assistant', error.message || 'Staff AI gặp lỗi.', 'error')]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage(input);
  };

  const useSuggestion = (value: string) => {
    setInput(value);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[130]">
      {isOpen && (
        <div className="mb-4 flex h-[580px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#151515] shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EF233C] text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white">Staff AI</div>
                <div className="text-xs font-semibold text-white/45">Member package assistant</div>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-white/10 px-4 py-3">
            <div className="grid gap-2">
              {['Kiểm tra gói HV001', 'Gia hạn gói HV001 thêm 3 tháng'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => useSuggestion(suggestion)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-bold text-white/70 transition hover:border-[#EF233C]/40 hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-[#EF233C] text-white'
                      : message.type === 'error'
                        ? 'border border-red-400/60 bg-red-50 text-red-800'
                        : message.type === 'success'
                          ? 'border border-emerald-400/60 bg-emerald-50 text-emerald-800'
                          : 'border border-white/10 bg-white text-slate-700'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/60">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </div>
              </div>
            )}
          </div>

          {pendingAction && pendingAction.status !== 'collecting' && (
            <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void submitMessage('xác nhận', pendingAction)}
                className="rounded-xl bg-[#EF233C] px-3 py-2 text-sm font-black text-white disabled:opacity-50"
              >
                Xác nhận
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setPendingAction(null);
                  void submitMessage('hủy', pendingAction);
                }}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-black text-white/70 disabled:opacity-50"
              >
                Hủy
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-white/10 p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Nhập lệnh cho AI staff..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#EF233C]/50"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EF233C] text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EF233C] text-white shadow-[0_18px_45px_rgba(239,35,60,0.35)] transition hover:bg-[#c91930]"
        aria-label="Mở Staff AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}
