import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, ChatMessage } from "../types";
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  User, 
  Lock, 
  Cpu, 
  CornerDownLeft, 
  AlertCircle,
  Activity,
  UserCheck
} from "lucide-react";

interface CoachChatProps {
  profile: UserProfile;
  history: ChatMessage[];
  onUpdateHistory: (history: ChatMessage[]) => void;
  // Triggered when escape system activated
  initialCustomAction?: string;
}

export default function CoachChat({ profile, history, onUpdateHistory, initialCustomAction }: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (history.length > 0) return history;
    
    // Default greeting depending on personality
    const greetings = {
      Commander: "برنامه‌ریزی و بهانه‌تراشی دیگر کافیست! از جایت بلند شو و کار را آغاز کن؛ بهانه‌ها مال ترسوهاست. امروز چه اولویت مقدسی داری که مایل بودی پشت گوش بیندازی؟ همین حالا بگو تا ترست را نابود کنیم.",
      Mentor: "سلام و درود. همواره درک اهمال‌کاری از منظر منشأ عاطفی، بسیار اساسی‌تر از ملامت خود است. بیایید با هم واکاوی کنیم چه مبحث یا ابهامی کار امروز شما را مسدود کرده است تا کمال‌گرایی کاذب را زمین بزنیم.",
      Friend: "سلام دوست نازنینم! قدم اول تغییر همیشه سخت‌ترینه ولی اصلاً نگران نباش، چون من تا ته جاده در کنارت هستم. بیا با هم یه صحبت صمیمانه بکنیم؛ بهم بگو الان چه احساسی داری و سد راهت چیه؟"
    };

    return [
      {
        id: "greet",
        role: "coach",
        text: greetings[profile.personality] || greetings.Friend,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVoiceResponseEnabled, setIsVoiceResponseEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle triggered custom action e.g. "escape" from Today tab
  useEffect(() => {
    if (initialCustomAction === "escape") {
      triggerEscapeIntervention();
    }
  }, [initialCustomAction]);

  // Sync with main app logs
  useEffect(() => {
    onUpdateHistory(messages);
  }, [messages]);

  const speakText = (text: string) => {
    // Disabled as per user request to remove AI talking features
  };

  const handleSendMessage = async (textToSend: string, isVoiceInput = false) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: text,
      createdAt: new Date().toISOString(),
      isVoice: isVoiceInput
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history: [...messages, userMsg],
          profile: profile,
          personality: profile.personality,
          checkInType: "general"
        })
      });

      if (!response.ok) {
        throw new Error("خطا در پاسخ مربی هوشمند");
      }

      const data = await response.json();
      const coachReply = data.text || "مربی پاسخگو در دسترس نیست.";

      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        text: coachReply,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, coachMsg]);
      
      // Auto speech response if enabled
      speakText(coachReply);

    } catch (e: any) {
      console.error(e);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        text: "متاسفانه ارتباطم با سرورهای هوش مصنوعی دچار اختلال شد. اما یادت نره که رمز پیروزی استمرار و اقدام بدون بهانه است؛ همین الان گوشی رو بذار کنار و گام متمرکزی بردار!",
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Immediate psychiatric intervention for repeated task avoidance (Escape System)
  const triggerEscapeIntervention = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/coach/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history: messages,
          profile: profile,
          personality: profile.personality,
          customAction: "escape"
        })
      });

      if (!response.ok) {
        throw new Error("خطا در پاسخ اضطراری مربی");
      }

      const data = await response.json();
      const coachReply = data.text || "شما تنبل نیستید.\nشما دارید از این کار فرار می‌کنید.\nبیایید دلیل واقعی آن را پیدا کنیم.";

      const coachMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "coach",
        text: coachReply,
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, coachMsg]);
      speakText(coachReply);

    } catch (error) {
      const exactMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "coach",
        text: "شما تنبل نیستید.\nشما دارید از این کار فرار می‌کنید.\nبیایید دلیل واقعی آن را پیدا کنیم.\n\nبه جای کلنجار رفتن با خود، این وظیفه ترسناک را به یک گام مضحک و زیر ۵ دقیقه‌ای تبدیل کن و با خاموش کردن کامل اینستاگرام، فقط اولین کلیک را آغاز کن.",
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, exactMsg]);
      speakText(exactMsg.text);
    } finally {
      setLoading(false);
    }
  };

  // Fast Browser-Native Persian Voice-to-Text Input
  const handleToggleMicRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("مرورگر شما از سیستم صوتی فارسی پشتیبانی نمی‌کند. از گوگل کروم یا فایرفاکس استفاده کنید.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const rec = new SpeechRecognition();
      rec.lang = "fa-IR";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onresult = (e: any) => {
        const resultText = e.results[0][0].transcript;
        handleSendMessage(resultText, true);
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech input error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
    }
  };

  const getSubTitleText = () => {
    if (profile.personality === "Commander") return "مربی قاطع مجهز به هوش مقتدر";
    if (profile.personality === "Mentor") return "مرشد دانا و استراتژیک روانشناختی";
    return "رفیق صمیمی و مشوق بی حد و مرز";
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F0F12] pb-24 overflow-hidden relative" style={{ direction: "rtl" }}>
      
      {/* Top Coach Ribbon Custom Design */}
      <div className="p-4 bg-[#16161C] border-b border-[#2A2A35] flex items-center justify-between select-none shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border text-slate-100 uppercase transition-all font-sans font-black ${
              profile.personality === "Commander" 
                ? "bg-rose-950/20 border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.15)] text-rose-300" 
                : profile.personality === "Mentor" 
                ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.15)] text-cyan-300"
                : "bg-blue-950/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.15)] text-blue-300"
            }`}>
              {profile.personality[0]}
            </div>
            {/* Active online dot */}
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 border-2 border-[#16161C] rounded-full animate-ping"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-cyan-400 border-2 border-[#16161C] rounded-full"></div>
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>لاک آی ({
                profile.personality === "Commander" ? "فرمانده" : profile.personality === "Mentor" ? "مرشد" : "رفیق"
              })</span>
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            </h2>
            <span className="text-[10px] text-slate-500 block font-normal">{getSubTitleText()}</span>
          </div>
        </div>

        {/* Voice Synth Controller Panel */}
        <div className="flex items-center gap-2">
          {/* Rescue button */}
          <button
            type="button"
            onClick={triggerEscapeIntervention}
            className="px-3 py-1.5 bg-rose-950/30 border border-rose-900/40 text-rose-400 hover:text-rose-100 hover:bg-rose-950 rounded-full text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0 font-bold"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>نجات از فرار</span>
          </button>
        </div>
      </div>

      {/* Messages Thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
          >
            <div 
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed relative ${
                msg.role === "user" 
                  ? "bg-[#1E1E28] border border-[#2A2A35] text-slate-100 rounded-tr-none" 
                  : "bg-gradient-to-br from-[#1E1E28] via-[#1E1E28] to-[#1E1E28]/80 border border-[#2A2A35]/60 text-slate-100 rounded-tl-none shadow-md"
              }`}
            >
              {/* Message Header indicators */}
              <div className="flex items-center justify-between gap-6 pb-1.5 border-b border-[#2A2A35]/40 mb-1.5 text-[9px] text-slate-500 font-bold">
                <span className="font-mono font-bold">{msg.role === "user" ? "من" : `شخصیت مربی ${profile.personality === "Commander" ? "فرمانده" : profile.personality === "Mentor" ? "مرشد" : "رفیق"}`}</span>
                <span>{new Date(msg.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Text content with custom line breaks */}
              <p className="whitespace-pre-line font-medium leading-relaxed tracking-wide text-slate-200">{msg.text}</p>
              
              {msg.isVoice && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cyan-400 font-sans font-bold">
                  <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>ارسال شده با گفتار فارسی</span>
                </div>
              )}

              {/* Synthesis replay option removed as per user request */}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-end">
            <div className="p-4 bg-[#1E1E28]/60 border border-[#2A2A35] border-dashed rounded-2xl rounded-tl-none max-w-xs flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className="text-[10px] text-slate-500 font-sans font-bold">مربی در حال تلاقی روانشناختی...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Voice feedback waves simulation */}
      {isRecording && (
        <div className="p-3 bg-[#1E1E28]/40 border-t border-[#2A2A35]/60 text-center flex items-center justify-center gap-2 select-none">
          <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
          <span className="text-[10px] text-rose-300 font-bold uppercase animate-pulse font-sans">سیستم گفتار فعال است. صحبت کنید...</span>
          <div className="flex gap-0.5 ml-2">
            <div className="w-1 h-3 bg-rose-500 animate-pulse"></div>
            <div className="w-1 h-5 bg-rose-500 animate-pulse" style={{ animationDelay: "100ms" }}></div>
            <div className="w-1 h-2 bg-rose-500 animate-pulse" style={{ animationDelay: "200ms" }}></div>
          </div>
        </div>
      )}

      {/* Message input panel */}
      <div className="p-3 bg-[#16161C] border-t border-[#2A2A35]">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (inputText.trim()) {
              handleSendMessage(inputText);
            }
          }}
          className="flex gap-2 items-center"
        >
          {/* Speak speech recognition mic */}
          <button
            type="button"
            onClick={handleToggleMicRecording}
            className={`p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
              isRecording 
                ? "bg-rose-500/20 border-rose-500 text-rose-400" 
                : "bg-[#0F0F12] border-[#2A2A35] text-slate-400 hover:text-cyan-400 hover:border-cyan-500"
            }`}
            title="صحبت کردن به فارسی"
          >
            {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>

          {/* Typing input field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="هر بهانه یا گامی که دارید را بنویسید..."
            className="flex-1 bg-[#0F0F12] border border-[#2A2A35] focus:border-cyan-500 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
