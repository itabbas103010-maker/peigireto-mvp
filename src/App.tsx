import { useState, useEffect } from "react";
import { UserProfile, DailyLog, ChatMessage, ThemeMode } from "./types";
import Onboarding from "./components/Onboarding";
import TodayDashboard from "./components/TodayDashboard";
import CoachChat from "./components/CoachChat";
import ReportsView from "./components/ReportsView";
import AtomicHabits from "./components/AtomicHabits";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  MessageSquare, 
  Fingerprint, 
  PieChart, 
  Settings, 
  Sun, 
  Moon, 
  Info,
  Sliders,
  RotateCcw,
  Volume2,
  Trash2,
  Lock,
  Compass,
  Bell,
  Activity
} from "lucide-react";

export default function App() {
  // Local states
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("lock_ai_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem("lock_ai_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("lock_ai_chat");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<"today" | "chat" | "reports" | "settings" | "habits">("today");
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("lock_ai_theme") as ThemeMode) || "dark";
  });

  // Action states passed across components (like Escape Detection trigger)
  const [customAction, setCustomAction] = useState<string | undefined>(undefined);

  // Sync state modifications with storage
  useEffect(() => {
    if (profile) {
      localStorage.setItem("lock_ai_profile", JSON.stringify(profile));
    } else {
      localStorage.removeItem("lock_ai_profile");
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("lock_ai_logs", JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  useEffect(() => {
    localStorage.setItem("lock_ai_chat", JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    localStorage.setItem("lock_ai_theme", themeMode);
    // Reflect dark/light modes on HTML/Body
    const root = document.documentElement;
    if (themeMode === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [themeMode]);

  // Complete onboarding
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setActiveTab("today");
  };

  // Switch tabs with custom triggers (e.g. from Dashboard to Chat)
  const handleNavigateToChat = (checkInType?: string, actionName?: string) => {
    setCustomAction(actionName);
    setActiveTab("chat");
  };

  // Local active notification banner state for in-app overlay if browser permission is blocked (iframe issues)
  const [activeNotification, setActiveNotification] = useState<{ title: string; body: string; type: string } | null>(null);

  // Background timer checking for active notifications
  useEffect(() => {
    if (!profile || !profile.remindersEnabled || !profile.reminderTimes) return;

    // Track recently triggered times (YYYY-MM-DD HH:MM) to avoid duplicate trigger within the same minute
    const triggeredMinutes = new Set<string>();

    const checkReminders = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const hhmm = `${hours}:${minutes}`;

      const todayStr = now.toISOString().split('T')[0];
      const triggerKey = `${todayStr}_${hhmm}`;

      if (triggeredMinutes.has(triggerKey)) return;

      const times = profile.reminderTimes!;
      let reminderType = "";
      let title = "";
      let body = "";

      if (hhmm === times.morning) {
        reminderType = "morning";
        title = "🌅 بررسی صبحگاهی (Morning Check-in)";
        body = "زمان شروع روز جدید! بیا امروز رو طوفانی شروع کنیم و مهم‌ترین اهدافت رو ثبت کنیم.";
      } else if (hhmm === times.midday) {
        reminderType = "midday";
        title = "⚡ بررسی نیم‌روزی (Midday Check-in)";
        body = "آیا کارهای سخت امروز رو شروع کردی؟ مربی پیگیرتو منتظر شروع پرقدرت شماست!";
      } else if (hhmm === times.evening) {
        reminderType = "evening";
        title = "🌇 بررسی عصرگاهی (Evening Check-in)";
        body = "زمان ثبت گزارش پیشرفت کارهاست. چقدر امروز جلو رفتی؟ بیا به مربی اطلاع بده.";
      } else if (hhmm === times.night) {
        reminderType = "night";
        title = "🌌 اعتراف شبانه (Night Confession)";
        body = "بریم برای تحلیل و اعتراف درباره اهمال‌کاری‌های امروز و تنظیم فردا.";
      }

      if (reminderType) {
        triggeredMinutes.add(triggerKey);
        triggerNotification(title, body, reminderType);
      }
    };

    const triggerNotification = (notiTitle: string, notiBody: string, checkInType: string) => {
      // 1. In-App Banner Notification Overlay
      setActiveNotification({ title: notiTitle, body: notiBody, type: checkInType });

      // Play soft systemic alert beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        console.log("Audio play blocked", e);
      }

      // 2. Standard Browser OS Push Notification if possible
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            new Notification(notiTitle, {
              body: notiBody,
              icon: "/favicon.ico",
              tag: "lock-ai-reminder"
            });
          } catch (e) {
            console.warn("Notification error within sandboxed frame:", e);
          }
        }
      }
    };

    const interval = setInterval(checkReminders, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [profile]);

  const handleTestNotification = () => {
    if (!profile) return;
    
    // Request permission
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        const title = "🔔 آزمایش زنده یادآور تجربی پیگیرتو";
        const body = "سیستم یادآوری کارهای مهم و زمان‌بندی بررسی‌های روزانه با موفقیت فعال شد.";
        
        // Soft audio alert
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
          gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.35);
        } catch (e) { console.log(e); }

        // Custom overlay
        setActiveNotification({
          title,
          body,
          type: "morning"
        });

        // Trigger OS notification
        if (permission === "granted") {
          try {
            new Notification(title, {
              body,
              icon: "/favicon.ico"
            });
          } catch (e) {
            console.log("Browser OS Notification failed, showing in-app message.");
          }
        }
      });
    } else {
      // Custom overlay fallback
      setActiveNotification({
        title: "🔔 آزمایش اعلان‌ها",
        body: "سیستم اعلان‌ها فعال شد (مرورگر شما در این حالت ابزار بومی ندارد ولی اعلان درون‌برنامه فعال است).",
        type: "midday"
      });
    }
  };

  // Erase all local memory cleanly
  const handleResetData = () => {
    const confirmation = window.confirm("آیا مایلید تمام سوابق چک‌این، دی‌ان‌ای بهره‌وری و تاریخچه چت خود را ۱۰۰٪ پاک کنید؟ این فرآیند غیر قابل بازگشت است.");
    if (confirmation) {
      localStorage.clear();
      setProfile(null);
      setDailyLogs([]);
      setChatHistory([]);
      setActiveTab("today");
    }
  };

  // Rendering screen flow
  if (!profile || !profile.hasCompletedOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-0 md:p-6 font-sans transition-colors duration-300 ${
      themeMode === "dark" ? "bg-[#0F0F12] text-slate-100" : "bg-slate-100 text-slate-950"
    }`} style={{ direction: "rtl" }}>
      
      {/* Primary Mobile Container Frame (Simulated premium phone body on large screens) */}
      <div className={`w-full max-w-md h-screen md:h-[780px] flex flex-col relative overflow-hidden transition-all duration-300 ${
        themeMode === "dark" 
          ? "bg-[#16161C] border border-[#2A2A35] md:rounded-[40px] shadow-2xl" 
          : "bg-white border border-slate-200 md:rounded-[40px] shadow-xl"
      }`}>
        
        {/* Sliding premium dynamic banner notification */}
        <AnimatePresence>
          {activeNotification && (
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -100 }}
              className="absolute top-4 left-4 right-4 bg-gradient-to-r from-slate-900 to-indigo-950 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl z-50 flex items-start gap-3 flex-row-reverse text-right"
              style={{ direction: "rtl" }}
            >
              <div className="p-2.5 bg-cyan-900/40 border border-cyan-500/30 rounded-xl shrink-0">
                <Bell className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <span className="text-[9px] text-cyan-400 font-extrabold block mb-0.5 uppercase tracking-wider">یادآور مربی پیگیرتو</span>
                <h4 className="text-xs font-bold text-slate-100">{activeNotification.title}</h4>
                <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">{activeNotification.body}</p>
                <div className="flex gap-2.5 mt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const checkType = activeNotification.type;
                      setActiveNotification(null);
                      handleNavigateToChat(checkType, `چک‌این ${checkType === "morning" ? "صبحگاهی" : checkType === "midday" ? "نیم‌روزی" : checkType === "evening" ? "عصرگاهی" : "شبانه"}`);
                    }}
                    className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                  >
                    چک‌این لایو
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNotification(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    بعداً
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Main tabs view renderer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "today" && (
            <TodayDashboard 
              profile={profile}
              dailyLogs={dailyLogs}
              onUpdateLogs={setDailyLogs}
              onNavigateToChat={handleNavigateToChat}
            />
          )}

          {activeTab === "chat" && (
            <CoachChat 
              profile={profile}
              history={chatHistory}
              onUpdateHistory={setChatHistory}
              initialCustomAction={customAction}
            />
          )}

          {activeTab === "habits" && (
            <AtomicHabits />
          )}

          {activeTab === "reports" && (
            <ReportsView 
              profile={profile}
              dailyLogs={dailyLogs}
            />
          )}

          {activeTab === "settings" && (
            <div className="flex-1 pb-24 overflow-y-auto p-5 select-none" style={{ direction: "rtl" }}>
              <div className="mb-6">
                <h1 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-indigo-400 bg-clip-text text-transparent">تنظیمات مربی پیگیرتو</h1>
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">فاب‌های کنترلی، مدیریت داده‌ها و تغییر در شخصیت مربی پاسخ دهی شما.</p>
              </div>

              <div className="space-y-4">
                
                {/* Theme selection panel */}
                <div className={`p-4 rounded-2xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-900" : "bg-white border-slate-200 shadow-sm"}`}>
                  <label className="text-xs font-bold text-slate-400 block mb-3">حالت نمایش بصری برنامه</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setThemeMode("dark")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                        themeMode === "dark" 
                          ? "bg-slate-950 border-emerald-500 text-emerald-400 shadow-md"
                          : "bg-slate-100 border-transparent text-slate-400"
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      <span>قفل تاریک (سرمه‌ای)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setThemeMode("light")}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer transition-all ${
                        themeMode === "light" 
                          ? "bg-slate-100 border-emerald-600 text-emerald-700 shadow-md font-bold"
                          : "bg-slate-900/40 border-transparent text-slate-500"
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      <span>قفل روشن (گرم)</span>
                    </button>
                  </div>
                </div>

                {/* Edit Goal and Motivation Settings */}
                <div className={`p-4 rounded-2xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-900" : "bg-white border-slate-200 shadow-sm"}`}>
                  <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <span>بازتعریف اهداف و مربی کنونی</span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">اصلی‌ترین هدف ۹۰ روزه شما:</label>
                      <input
                        type="text"
                        value={profile?.goal || ""}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, goal: e.target.value } : null)}
                        className={`w-full text-xs font-semibold rounded-xl p-3 outline-none border focus:border-emerald-500 transition-all ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">لحن و شخصیت مربی:</label>
                      <select
                        value={profile?.personality || "Friend"}
                        onChange={(e) => setProfile(prev => prev ? { ...prev, personality: e.target.value as any } : null)}
                        className={`w-full text-xs font-semibold rounded-xl p-3 outline-none border focus:border-emerald-500 transition-all ${
                          themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="Commander">مربی فرمانده (strict / قاطع و سرسخت)</option>
                        <option value="Friend">مربی رفیق صمیمی (supportive / مهربان و مشوق)</option>
                        <option value="Mentor">مربی مرشد (analytical / خردمند و حکیم)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bell notification & task remind scheduler */}
                <div className={`p-4 rounded-2xl border ${themeMode === "dark" ? "bg-slate-900/60 border-slate-900" : "bg-white border-slate-200 shadow-sm"}`}>
                  <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>تنظیم زمان اعلان یادآورهای چک‌این روزانه</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                    مربی در چهار نوبت طلایی روزانه بر اساس ساعت‌های تنظیمی شما متصل شده و ثبت گزارش‌ها را یادآوری می‌کند.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/20">
                      <span className="text-xs font-bold text-slate-300">فعال بودن یادآورهای رفتاری:</span>
                      <button
                        type="button"
                        onClick={() => setProfile(prev => prev ? { ...prev, remindersEnabled: !prev.remindersEnabled } : null)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          profile?.remindersEnabled ? "bg-cyan-500" : "bg-slate-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            profile?.remindersEnabled ? "-translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {profile?.remindersEnabled && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">🌅 چک‌این صبحگاهی:</label>
                            <input
                              type="time"
                              value={profile.reminderTimes?.morning || "08:30"}
                              onChange={(e) => setProfile(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  reminderTimes: {
                                    ...(prev.reminderTimes || { morning: "08:30", midday: "13:00", evening: "18:00", night: "22:00" }),
                                    morning: e.target.value
                                  }
                                };
                              })}
                              className={`w-full text-xs font-mono font-bold text-center rounded-xl p-2.5 outline-none border focus:border-cyan-500 transition-all ${
                                themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">⚡ چک‌این نیم‌روزی:</label>
                            <input
                              type="time"
                              value={profile.reminderTimes?.midday || "13:00"}
                              onChange={(e) => setProfile(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  reminderTimes: {
                                    ...(prev.reminderTimes || { morning: "08:30", midday: "13:00", evening: "18:00", night: "22:00" }),
                                    midday: e.target.value
                                  }
                                };
                              })}
                              className={`w-full text-xs font-mono font-bold text-center rounded-xl p-2.5 outline-none border focus:border-cyan-500 transition-all ${
                                themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">🌇 گزارش عصرگاهی:</label>
                            <input
                              type="time"
                              value={profile.reminderTimes?.evening || "18:00"}
                              onChange={(e) => setProfile(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  reminderTimes: {
                                    ...(prev.reminderTimes || { morning: "08:30", midday: "13:00", evening: "18:00", night: "22:00" }),
                                    evening: e.target.value
                                  }
                                };
                              })}
                              className={`w-full text-xs font-mono font-bold text-center rounded-xl p-2.5 outline-none border focus:border-cyan-500 transition-all ${
                                themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 block mb-1">🌌 اعتراف شبانه:</label>
                            <input
                              type="time"
                              value={profile.reminderTimes?.night || "22:00"}
                              onChange={(e) => setProfile(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  reminderTimes: {
                                    ...(prev.reminderTimes || { morning: "08:30", midday: "13:00", evening: "18:00", night: "22:00" }),
                                    night: e.target.value
                                  }
                                };
                              })}
                              className={`w-full text-xs font-mono font-bold text-center rounded-xl p-2.5 outline-none border focus:border-cyan-500 transition-all ${
                                themeMode === "dark" ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleTestNotification}
                          className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>تست و ارسال یک اعلان نمونه لایو</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* RESET STORAGE */}
                <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl">
                  <span className="text-xs font-bold text-rose-300 block mb-1">پاک کردن تمام داده‌های محلی</span>
                  <p className="text-[10px] text-rose-400/80 leading-relaxed mb-3">اگر قصد شروع مجدد فرآیند ۹۰ روزه را دارید، می‌توانید شناسنامه رفتاری و چت‌ها را به تنظیمات کارخانه برگردانید.</p>
                  
                  <button
                    type="button"
                    onClick={handleResetData}
                    className="w-full py-2.5 bg-rose-900/60 hover:bg-rose-955 text-slate-100 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>پاکسازی همه‌چیز و بازگشت به شروع</span>
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAVIGATION TAB BAR FRAME */}
        <div className={`absolute bottom-0 left-0 right-0 h-20 border-t flex items-center justify-around px-2 z-40 select-none ${
          themeMode === "dark" 
            ? "bg-[#16161C]/95 border-[#2A2A35]/80 backdrop-blur-md" 
            : "bg-white/95 border-slate-200 backdrop-blur-md shadow-[0_-4px_15px_rgba(0,0,0,0.03)]"
        }`}>
          
          {/* Item 1: TODAY */}
          <button
            type="button"
            onClick={() => {
              setCustomAction(undefined);
              setActiveTab("today");
            }}
            className={`flex flex-col items-center gap-1 focus:outline-none flex-1 py-1 cursor-pointer transition-all ${
              activeTab === "today" 
                ? (themeMode === "dark" ? "text-cyan-400 transform -translate-y-0.5 font-bold" : "text-cyan-600 transform -translate-y-0.5 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <Calendar className={`w-4 h-4 transition-transform duration-200 ${activeTab === "today" ? "scale-110" : ""}`} />
            <span className="text-[9px] tracking-tight">چک‌این روزانه</span>
          </button>

          {/* Item 1b: HABITS */}
          <button
            type="button"
            onClick={() => {
              setCustomAction(undefined);
              setActiveTab("habits");
            }}
            className={`flex flex-col items-center gap-1 focus:outline-none flex-1 py-1 cursor-pointer transition-all ${
              activeTab === "habits" 
                ? (themeMode === "dark" ? "text-cyan-400 transform -translate-y-0.5 font-bold" : "text-cyan-600 transform -translate-y-0.5 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <Activity className={`w-4 h-4 transition-transform duration-200 ${activeTab === "habits" ? "scale-110" : ""}`} />
            <span className="text-[9px] tracking-tight">چرخه عادت‌ها</span>
          </button>

          {/* Item 2: AI CHAT */}
          <button
            type="button"
            onClick={() => {
              setCustomAction(undefined);
              setActiveTab("chat");
            }}
            className={`flex flex-col items-center gap-1 focus:outline-none flex-1 py-1 cursor-pointer transition-all ${
              activeTab === "chat" 
                ? (themeMode === "dark" ? "text-cyan-400 transform -translate-y-0.5 font-bold" : "text-cyan-600 transform -translate-y-0.5 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <MessageSquare className={`w-4 h-4 transition-transform duration-200 ${activeTab === "chat" ? "scale-110" : ""}`} />
            <span className="text-[9px] tracking-tight">گفت‌و‌گو</span>
          </button>

          {/* Item 4: REPORTS VIEW */}
          <button
            type="button"
            onClick={() => {
              setCustomAction(undefined);
              setActiveTab("reports");
            }}
            className={`flex flex-col items-center gap-1 focus:outline-none flex-1 py-1 cursor-pointer transition-all ${
              activeTab === "reports" 
                ? (themeMode === "dark" ? "text-cyan-400 transform -translate-y-0.5 font-bold" : "text-cyan-600 transform -translate-y-0.5 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <PieChart className={`w-4 h-4 transition-transform duration-200 ${activeTab === "reports" ? "scale-110" : ""}`} />
            <span className="text-[9px] tracking-tight">آنالیز</span>
          </button>

          {/* Item 5: SETTINGS */}
          <button
            type="button"
            onClick={() => {
              setCustomAction(undefined);
              setActiveTab("settings");
            }}
            className={`flex flex-col items-center gap-1 focus:outline-none flex-1 py-1 cursor-pointer transition-all ${
              activeTab === "settings" 
                ? (themeMode === "dark" ? "text-cyan-400 transform -translate-y-0.5 font-bold" : "text-cyan-600 transform -translate-y-0.5 font-bold") 
                : "text-slate-500 hover:text-slate-400"
            }`}
          >
            <Settings className={`w-4 h-4 transition-transform duration-200 ${activeTab === "settings" ? "scale-110" : ""}`} />
            <span className="text-[9px] tracking-tight">تنظیمات</span>
          </button>

        </div>

      </div>

    </div>
  );
}
