import { FormEvent, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bot, Loader2, Mic, Send, Square, X } from 'lucide-react';
import { sendAiChatMessage } from '../../services/aiChatApi';
import { transcribeAudio } from '../../services/speechToTextApi';
import { saveAiServiceFeedback } from '../../services/memberEngagementApi';
import { recordMakeupForCancelledSession } from '../../services/workoutSessionApi';

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

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{
    0: {
      transcript: string;
    };
  }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function makeMessage(role: ChatMessage['role'], text: string, type?: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    text,
    type,
  };
}

function renderInlineAiText(text: string) {
  const parts = String(text || '').split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={`${part}-${index}`} className="font-black text-[#EF233C]">
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <span key={`${part}-${index}`} className="rounded bg-slate-900/10 px-1 font-mono text-[0.92em] text-[#EF233C]">
          {part.slice(1, -1)}
        </span>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderAiMessageText(text: string) {
  const lines = String(text || '').split(/\r?\n/);
  return (
    <div className="space-y-1 whitespace-normal">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={`blank-${index}`} className="h-2" />;

        const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
        if (heading) {
          return (
            <div key={`${line}-${index}`} className="font-black text-[#EF233C]">
              {renderInlineAiText(heading[1])}
            </div>
          );
        }

        const bullet = trimmed.match(/^[-*]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-[#EF233C]" />
              <span>{renderInlineAiText(bullet[1])}</span>
            </div>
          );
        }

        const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) {
          return (
            <div key={`${line}-${index}`} className="flex gap-2">
              <span className="min-w-5 font-black text-[#EF233C]">{numbered[1]}.</span>
              <span>{renderInlineAiText(numbered[2])}</span>
            </div>
          );
        }

        return <div key={`${line}-${index}`}>{renderInlineAiText(trimmed)}</div>;
      })}
    </div>
  );
}

function redirectMessage(redirectUrl: string) {
  if (redirectUrl.includes('rate-service')) return 'Đang chuyển bạn đến trang đánh giá...';
  if (redirectUrl.includes('schedule')) return 'Đang chuyển bạn đến trang lịch...';
  return 'Đang chuyển bạn đến trang kết quả...';
}

function makeupCancelMessage(makeupResult: any) {
  const remaining = Number(makeupResult?.remainingMakeupCount ?? makeupResult?.credits ?? 0);
  const limit = Number(makeupResult?.resetBalance ?? 3);

  if (makeupResult?.granted) {
    return {
      text: `Da ghi nhan 1 lan huy lich co dinh. So buoi bu con lai: ${remaining}/${limit}.`,
      type: 'success',
    };
  }

  if (makeupResult?.reason === 'already_recorded') {
    return {
      text: `Buoi nay da duoc ghi nhan truoc do. So buoi bu con lai: ${remaining}/${limit}.`,
      type: 'success',
    };
  }

  return {
    text: remaining > 0
      ? `Buoi nghi da duoc ghi nhan. So buoi bu con lai: ${remaining}/${limit}.`
      : 'Ban da su dung het so buoi bu trong thang nay. Moi thang chi duoc bu toi da 3 buoi.',
    type: remaining > 0 ? 'success' : 'error',
  };
}

export default function AIAssistantChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    makeMessage('assistant', 'Bạn có thể yêu cầu đặt lịch, hủy lịch, xem lịch, xem gói tập hoặc đánh giá buổi tập.'),
  ]);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading && !isTranscribing,
    [input, isLoading, isTranscribing],
  );

  const submitMessage = async (messageText: string, action: PendingAction = pendingAction) => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setMessages((current) => [...current, makeMessage('user', trimmed)]);
    setIsLoading(true);

    try {
      const result = await sendAiChatMessage(trimmed, action);
      const successfulAction = result.action || action?.name;

      if (result.type === 'success' && successfulAction === 'create_booking' && result.result) {
        window.dispatchEvent(new CustomEvent('gymster:schedule-updated'));
      }
      if (result.type === 'success' && successfulAction === 'cancel_booking' && result.result?.sessionId) {
        const makeupResult = recordMakeupForCancelledSession(result.result);
        if (makeupResult.granted || makeupResult.reason !== 'not_fixed_pt_session') {
          const makeupMessage = makeupCancelMessage(makeupResult);
          setMessages((current) => [
            ...current,
            makeMessage(
              'assistant',
              makeupMessage.text,
              makeupMessage.type,
            ),
          ]);
        }
      }
      setMessages((current) => [...current, makeMessage('assistant', result.reply || 'Đã xử lý xong.', result.type)]);
      if (result.type === 'success' && (successfulAction === 'create_review' || successfulAction === 'update_review') && result.result) {
        saveAiServiceFeedback(result.result);
      }
      setPendingAction(result.pendingAction ?? null);
      if (result.type === 'success' && result.redirectUrl) {
        setMessages((current) => [...current, makeMessage('assistant', redirectMessage(result.redirectUrl), 'success')]);
        window.setTimeout(() => {
          navigate(result.redirectUrl);
          if (result.redirectUrl.includes('schedule')) {
            setMessages((current) => [
              ...current,
              makeMessage('assistant', 'Đã chuyển sang trang lịch tập, vui lòng kiểm tra lại lịch tập của bạn.', 'success'),
            ]);
          }
        }, 800);
      }
    } catch (error: any) {
      setMessages((current) => [...current, makeMessage('assistant', error.message || 'AI Assistant gặp lỗi.', 'error')]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitMessage(input);
  };

  const handleVoiceClick = async () => {
    if (isRecording) {
      speechRecognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        speechRecognitionRef.current = recognition;
        recognition.lang = 'vi-VN';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const text = Array.from(event.results)
            .map((result) => result[0]?.transcript || '')
            .join(' ')
            .trim();
          if (text) {
            setInput((current) => `${current}${current ? ' ' : ''}${text}`);
          }
        };
        recognition.onerror = (event) => {
          setMessages((current) => [
            ...current,
            makeMessage('assistant', event.error || 'Khong the nhan dien voice tieng Viet.', 'error'),
          ]);
        };
        recognition.onend = () => {
          setIsRecording(false);
          speechRecognitionRef.current = null;
        };
        recognition.start();
        setIsRecording(true);
        return;
      } catch (error: any) {
        speechRecognitionRef.current = null;
      }
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessages((current) => [...current, makeMessage('assistant', 'Trinh duyet nay khong ho tro ghi am.', 'error')]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (!audioBlob.size) return;

        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          if (text.trim()) {
            setInput((current) => `${current}${current ? ' ' : ''}${text.trim()}`);
          }
        } catch (error: any) {
          setMessages((current) => [
            ...current,
            makeMessage('assistant', error.message || 'Khong the chuyen voice thanh van ban.', 'error'),
          ]);
        } finally {
          setIsTranscribing(false);
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        makeMessage('assistant', error.message || 'Khong the truy cap microphone.', 'error'),
      ]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[130]">
      {isOpen && (
        <div className="mb-4 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#151515] shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EF233C] text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white">Gymster AI</div>
                <div className="text-xs font-semibold text-white/45">Action assistant</div>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-[#EF233C] text-white'
                      : message.type === 'error'
                        ? 'border border-red-400/60 bg-red-50 text-red-800'
                        : message.type === 'success'
                          ? 'border border-emerald-400/60 bg-emerald-50 text-emerald-800'
                          : 'border border-white/10 bg-white text-slate-700'
                  }`}
                >
                  {message.role === 'assistant' ? renderAiMessageText(message.text) : message.text}
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
              placeholder="Nhập lệnh cho AI..."
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#EF233C]/50"
            />
            <button
              type="button"
              onClick={() => void handleVoiceClick()}
              disabled={isLoading || isTranscribing}
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-white transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 ${
                isRecording ? 'bg-[#EF233C]' : 'bg-white/10 hover:bg-white/15'
              }`}
              aria-label={isRecording ? 'Dung ghi am' : 'Ghi am voice'}
              title={isRecording ? 'Dung ghi am' : 'Ghi am voice'}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
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
        aria-label="Mở Gymster AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </button>
    </div>
  );
}
