import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, DailyLog, Task } from "../types";
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Flame,
  Zap, 
  Target,
  Calendar, 
  CheckCircle, 
  Sparkles, 
  AlertCircle, 
  HelpCircle,
  MoreHorizontal,
  Plus,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  Play,
  HeartCrack,
  Moon,
  Clock,
  ThumbsUp,
  RotateCcw
} from "lucide-react";

interface TodayDashboardProps {
  profile: UserProfile;
  dailyLogs: DailyLog[];
  onUpdateLogs: (logs: DailyLog[]) => void;
  // Let dashboard speak or interact with chat
  onNavigateToChat: (checkInType?: string, customAction?: string) => void;
}

export default function TodayDashboard({ profile, dailyLogs, onUpdateLogs, onNavigateToChat }: TodayDashboardProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  
  // Find or initialize today's log
  const [todayLog, setTodayLog] = useState<DailyLog>(() => {
    const existing = dailyLogs.find(l => l.date === todayStr);
    if (existing) return existing;
    return {
      date: todayStr,
      mostImportantOutcome: "",
      tasks: [],
      morningCompleted: false,
      middayCompleted: false,
      eveningCompleted: false,
      confessionCompleted: false,
    };
  });

  // Task creation local state
  const [taskInput, setTaskInput] = useState("");
  const [outcomeInput, setOutcomeInput] = useState("");
  
  // Check-in modal states
  const [activeCheckInStep, setActiveCheckInStep] = useState<"none" | "morning" | "midday" | "evening" | "confession">("none");
  const [selectedReason, setSelectedReason] = useState<DailyLog["middayReason"] | "">("");
  
  // Confession voice recording simulation
  const [isRecording, setIsRecording] = useState(false);
  const [confessionText, setConfessionText] = useState("");
  const [transcript, setTranscript] = useState("");
  
  // Notification warnings
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Sync state variations
  useEffect(() => {
    const freshLogs = [...dailyLogs];
    const idx = freshLogs.findIndex(l => l.date === todayStr);
    if (idx >= 0) {
      freshLogs[idx] = todayLog;
    } else {
      freshLogs.push(todayLog);
    }
    onUpdateLogs(freshLogs);
  }, [todayLog]);

  // Gamification: Calculate Streak and Consistency Score
  const calculateStreak = () => {
    let streak = 0;
    // Sort logs descending by date
    const sortedLogs = [...dailyLogs].sort((a, b) => b.date.localeCompare(a.date));
    
    // Check if yesterday or today has a completed log
    const todayLogCompleted = todayLog.tasks.length > 0 && todayLog.tasks.every(t => t.status === "completed");
    
    let tempDate = new Date();
    // Move to yesterday if today is not completed yet
    if (!todayLogCompleted) {
      tempDate.setDate(tempDate.getDate() - 1);
    }
    
    for (let i = 0; i < 30; i++) {
      const checkDateStr = tempDate.toISOString().split("T")[0];
      const log = dailyLogs.find(l => l.date === checkDateStr);
      if (log && log.tasks.length > 0 && log.tasks.every(t => t.status === "completed")) {
        streak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateConsistencyScore = () => {
    if (dailyLogs.length === 0) return profile.dna?.consistencyScore || 60;
    
    // Count all tasks completed vs total across past 30 days
    let totalTasksAllowed = 0;
    let completedTasks = 0;
    
    dailyLogs.forEach(log => {
      totalTasksAllowed += log.tasks.length;
      completedTasks += log.tasks.filter(t => t.status === "completed").length;
    });

    if (totalTasksAllowed === 0) return profile.dna?.consistencyScore || 60;
    const baseRatio = (completedTasks / totalTasksAllowed) * 100;
    return Math.round(baseRatio * 0.8 + 20); // Scale comfortably upwards
  };

  // 3-Task constraint enforcement
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInput.trim()) return;

    if (todayLog.tasks.length >= 3) {
      setWarningMessage(
        "تمرکز لیزری! مربی " + 
        (profile.personality === "Commander" ? "فرمانده" : profile.personality === "Mentor" ? "مرشد" : "رفیق") +
        " اجازه اضافه کردن بیش از ۳ اولویت را نمی‌دهد. تعدد وظایف، تله مخفی اهمال‌کاری برای ذهن است!"
      );
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskInput.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      avoidanceCount: 0
    };

    setTodayLog(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
    setTaskInput("");
    setWarningMessage(null);
  };

  // Remove Task
  const handleRemoveTask = (id: string) => {
    setTodayLog(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
    setWarningMessage(null);
  };

  // Toggle Task Status (Direct Action feedback)
  const handleToggleTask = (id: string) => {
    setTodayLog(prev => {
      const updated = prev.tasks.map(t => {
        if (t.id === id) {
          const newStatus = t.status === "completed" ? "pending" : "completed";
          return { ...t, status: newStatus as any };
        }
        return t;
      });
      return { ...prev, tasks: updated };
    });
  };

  // Escape Detection Mechanism
  const handleTrackAvoidanceAndTriggerEscape = (id: string) => {
    // Increment avoidance count of this task
    let isEscapeDetected = false;
    
    setTodayLog(prev => {
      const updated = prev.tasks.map(t => {
        if (t.id === id) {
          const newCount = t.avoidanceCount + 1;
          if (newCount >= 2) {
            isEscapeDetected = true;
          }
          return { ...t, status: "avoided" as any, avoidanceCount: newCount };
        }
        return t;
      });
      return { ...prev, tasks: updated };
    });

    if (isEscapeDetected) {
      // Trigger navigation to Chat with ESCAPE specific trigger
      setTimeout(() => {
        onNavigateToChat("none", "escape");
      }, 500);
    }
  };

  // Complete Morning Check-in
  const handleCompleteMorningCheckin = () => {
    if (!outcomeInput.trim() || todayLog.tasks.length === 0) {
      setWarningMessage("لطفاً مهم‌ترین خروجی مورد نظر و حداقل ۱ اولویت را بنویسید.");
      return;
    }
    setTodayLog(prev => ({
      ...prev,
      mostImportantOutcome: outcomeInput.trim(),
      morningCompleted: true
    }));
    setActiveCheckInStep("none");
    setWarningMessage(null);
  };

  // Complete Midday Check-in with interventions
  const handleCompleteMiddayCheckin = (started: boolean) => {
    if (started) {
      setTodayLog(prev => ({
        ...prev,
        middayCompleted: true,
        middayReason: undefined,
        middayIntervention: "کاربر با قدرت شروع کرده است. عالی است!"
      }));
      setActiveCheckInStep("none");
    } else {
      if (!selectedReason) {
        setWarningMessage("لطفاً ریشه روان‌شناختی عدم شروع را انتخاب کنید.");
        return;
      }
      
      const interventionMap = {
        "Fear of failure": "شکست صرفاً یک بازخورد است نه هویت تو. برای ۱۰ دقیقه کمال‌گرایی را کنار بگذار و خراب بپوش فردا تصحیحش می‌کنی.",
        "Perfectionism": "یک پیش‌نویس کثیف و آغاز شده از کارهای تمام‌نشده و کمال‌گرایانه خیلی سودمندتر است. اولین گام را از عمدا نیمه‌کاره بردار.",
        "Fatigue": "بدنت خسته است. ۵ دقیقه چشمانت را ببند، نفس عمیق بکش و آب بنوش. سپس فقط ۱ سطر بنویس.",
        "Ambiguity": "کار گنگ است. الان فقط یک کاغذ بردار و بنویس قدم اول چیست. جزئیات بزرگ را نادیده بگیر.",
        "Distraction": "گوشی را خاموش کن و داخل کمد بذار. اتاق کار را از جلوی چشم خالی کن. غول حواس پرتی با فاصله نابود می‌شود.",
        "Lack of interest": "هدف نهایی ۹۰ روزه‌ات را به یاد بیاور. این چالش تلخ، بهایی است که برای رسیدن به آن پاداش رویایی می‌پردازی."
      };

      setTodayLog(prev => ({
        ...prev,
        middayCompleted: true,
        middayReason: selectedReason as any,
        middayIntervention: interventionMap[selectedReason] || ""
      }));
      setActiveCheckInStep("none");
      setWarningMessage(null);
    }
  };

  // Complete Evening Check-in
  const handleCompleteEveningCheckin = (stoppedReason: string, tomorrowFirst: string) => {
    setTodayLog(prev => ({
      ...prev,
      eveningCompleted: true,
      eveningStoppedUs: stoppedReason,
      tomorrowFirstAction: tomorrowFirst
    }));
    setActiveCheckInStep("none");
  };

  // Native Farsi Speech Recognition for Night Confession
  const handleToggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("مرورگر شما از سیستم تشخیص صوتی فارسی پشتیبانی نمی‌کند. لطفاً از آخرین نسخه گوگل کروم استفاده کنید.");
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
        setConfessionText(prev => prev + (prev ? " " : "") + resultText);
        setIsRecording(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
    }
  };

  const handleSaveNightConfession = () => {
    if (!confessionText.trim()) return;
    setTodayLog(prev => ({
      ...prev,
      nightConfession: confessionText.trim(),
      confessionCompleted: true
    }));
    setConfessionText("");
    setActiveCheckInStep("none");
  };

  // Visual Helper for Weekly Check-ins Achievements
  const streak = calculateStreak();
  const consistencyScore = calculateConsistencyScore();
  const totalTasks = todayLog.tasks.length;
  const completedTasks = todayLog.tasks.filter(t => t.status === "completed").length;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex-1 pb-24 overflow-y-auto px-4 pt-4 relative" style={{ direction: "rtl" }}>
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between mb-6 select-none">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {profile.fullName ? `سلام ${profile.fullName}` : "انضباط روزانه شما"}
          </h1>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        {/* Profile indicator */}
        <div className="flex items-center gap-1.5 bg-[#1E1E28] border border-[#2A2A35] px-3 py-1.5 rounded-full shadow-lg">
          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] text-slate-400 font-medium font-bold">مربی: {
            profile.personality === "Commander" ? "فرمانده" : profile.personality === "Mentor" ? "مرشد" : "رفیق"
          }</span>
        </div>
      </div>

      {/* GAMIFICATION CORE: Streak, Today's progress & Consistency Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {/* Streak */}
        <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden group min-h-[110px]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
          <span className="text-[9px] text-slate-500 block font-bold mb-1">زنجیره پشتکار</span>
          <div className="w-8 h-8 rounded-xl bg-amber-955/20 border border-amber-900/30 flex items-center justify-center mb-1">
            <Flame className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          </div>
          <span className="text-sm font-black text-amber-500 block font-mono mt-0.5">{streak} روز</span>
        </div>

        {/* Circular Progress */}
        <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden group min-h-[110px]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
          <span className="text-[9px] text-slate-500 block font-bold mb-1.5">پیشرفت کارهای امروز</span>
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="17"
                strokeWidth="4"
                stroke="#1B1B22"
                fill="transparent"
              />
              <circle
                cx="22"
                cy="22"
                r="17"
                className="text-cyan-400 transition-all duration-500 ease-out"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={2 * Math.PI * 17 - (percentage / 100) * (2 * Math.PI * 17)}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[9px] font-black text-cyan-400 font-mono">
              {percentage}٪
            </span>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden group min-h-[110px]">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"></div>
          <span className="text-[9px] text-slate-500 block font-bold mb-1">امتیاز پایداری</span>
          <div className="w-8 h-8 rounded-xl bg-cyan-955/40 border border-cyan-900/40 flex items-center justify-center mb-1">
            <TrendingUp className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <span className="text-sm font-black text-cyan-400 block font-mono mt-0.5">٪{consistencyScore}</span>
        </div>
      </div>

      {/* TARGET 90-DAY GOAL CONSTANT MONITOR */}
      <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-4 mb-6 relative overflow-hidden shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-t from-rose-500 to-indigo-600"></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-950/40 flex items-center justify-center border border-rose-800/30">
            <Target className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex-1">
            <span className="text-[9px] text-rose-400 block uppercase tracking-widest font-black mb-0.5">هدف بزرگ ۹۰ روزه • PEIGIRETO</span>
            <p className="text-xs text-slate-200 font-semibold leading-relaxed mt-0.5 line-clamp-1">{profile.goal}</p>
          </div>
        </div>
      </div>

      {/* WARNING POPUP */}
      {warningMessage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs rounded-xl mb-6 leading-relaxed relative flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>{warningMessage}</p>
        </motion.div>
      )}

      {/* IF MIDDAY INTERVENTION IS PRESENT */}
      {todayLog.middayIntervention && (
        <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl mb-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
          <span className="text-[9px] text-cyan-400 font-bold block uppercase tracking-wider mb-1">مداخله روان‌شناختی مربی برای امروز</span>
          <p className="text-xs text-slate-300 leading-relaxed font-semibold">{todayLog.middayIntervention}</p>
        </div>
      )}

      {/* TODAY'S ACTIVE GOALS LIST (MAX 3 EXECUTIONS) */}
      <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-5 mb-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-white">۳ اولویت مهم امروز</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5 select-none">فقط مهم‌ترین گام‌های اقدام امروز</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/20 font-semibold font-bold">
            {todayLog.tasks.filter(t => t.status === "completed").length} / {todayLog.tasks.length}
          </span>
        </div>

        {/* Task lists */}
        {todayLog.tasks.length === 0 ? (
          <div className="py-8 text-center bg-[#0F0F12] border border-dashed border-[#2A2A35]/80 rounded-xl flex flex-col items-center justify-center p-4">
            <Unlock className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <p className="text-xs text-slate-400 font-medium">هیچ اولویت مهمی ثبت نکردی.</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">ذهنت رو با اولویت‌های زیاد شلوغ نکن. حداکثر ۳ اقدام بزرگ برای امروز تعریف کن و به اون‌ها متعهد باش.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayLog.tasks.map((task) => (
              <div 
                key={task.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  task.status === "completed" 
                    ? "bg-[#0F0F12]/80 border-[#2A2A35]/30 text-slate-500" 
                    : task.status === "avoided"
                    ? "bg-[#0F0F12]/80 border-rose-950/40 text-rose-300/80"
                    : "bg-[#0F0F12] border-[#2A2A35]/80 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3-rtl flex-1">
                  {/* Action Completion Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="w-5 h-5 rounded border-2 transition-all flex items-center justify-center shrink-0 cursor-pointer border-[#2A2A35] hover:border-slate-500"
                  >
                    {task.status === "completed" && <div className="w-2.5 h-2.5 rounded bg-cyan-400 animate-pulse"></div>}
                  </button>

                  <div className="mx-2">
                    <p className={`text-xs leading-relaxed font-semibold break-all ${task.status === "completed" ? "line-through text-slate-500 font-normal" : ""}`}>
                      {task.title}
                    </p>
                    {task.avoidanceCount > 0 && task.status !== "completed" && (
                      <span className="text-[9px] text-rose-400 font-semibold block mt-0.5 font-bold">⚠️ پشت‌گوش انداخته شده: {task.avoidanceCount} مرتبه</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Avoid / Escape reporting button */}
                  {task.status !== "completed" && task.status !== "avoided" && (
                    <button
                      type="button"
                      title="فرار یا به تعویق انداختن"
                      onClick={() => handleTrackAvoidanceAndTriggerEscape(task.id)}
                      className="p-1 px-2 text-[9px] font-bold bg-rose-950/30 border border-rose-900/50 hover:bg-rose-950 text-rose-400 rounded-lg cursor-pointer transition-all shrink-0"
                    >
                      فرار از کار
                    </button>
                  )}
                  
                  {/* Delete Option */}
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-[#0F0F12] rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Task Adding Input Form (Locked to Max 3) */}
        {todayLog.tasks.length < 3 && (
          <form onSubmit={handleAddNewTask} className="mt-4 flex gap-2">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="تعریف اولویت بعدی..."
              className="flex-1 bg-[#0F0F12] border border-[#2A2A35] focus:border-cyan-500 outline-none rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
            />
            <button
              type="submit"
              className="px-3 bg-[#0F0F12] hover:bg-[#1E1E28] border border-[#2A2A35] text-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* WEEKLY WINS CARD */}
      <div className="bg-[#1E1E28]/50 border border-[#2A2A35] rounded-2xl p-4 flex items-center gap-4 hover:border-slate-800/60 transition-all">
        <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-900/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-bounce" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#E2E8F0]">موفقیت‌های این هفته شما</h4>
          <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">با اتمام تعهدات روزانه، امتیاز بهره‌وری شما به زودی قفل قله‌های جدید را باز خواهد کرد.</p>
        </div>
      </div>

      {/* MODALS / OVERLAYS FOR THE CHECK-IN STEPS */}
      <AnimatePresence>
        {activeCheckInStep !== "none" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F0F12]/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#16161C] border border-[#2A2A35] h-auto w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]"
            >
              {/* MORNING CHECK IN FORM */}
              {activeCheckInStep === "morning" && (
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <span>بررسی صبحگاهی (Morning Check-in)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">با پاسخ به این دو سوال، مسیر حرکت تمرکز لیزری امروز خود را همین حالا تعیین و قفل کنید.</p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1.5">مهم‌ترین نتیجه امروز (مقدس‌ترین دستاورد):</label>
                      <input
                        type="text"
                        value={outcomeInput}
                        onChange={(e) => setOutcomeInput(e.target.value)}
                        placeholder="امروز در آخرین ساعت بیداری چه اتفاقی بیفتد پیروزی است؟"
                        className="w-full bg-[#0F0F12] border border-[#2A2A35] focus:border-cyan-500 outline-none rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1.5">۳ اولویت اصلی و ملموس امروز:</label>
                      <div className="space-y-2">
                        {todayLog.tasks.map((task, i) => (
                           <div key={task.id} className="flex items-center justify-between p-2.5 bg-[#0F0F12] border border-[#2A2A35]/80 rounded-xl">
                            <span className="text-xs text-slate-300 font-medium">{i + 1}. {task.title}</span>
                            <button type="button" onClick={() => handleRemoveTask(task.id)} className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {todayLog.tasks.length < 3 && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            id="morning-task-quick-add"
                            placeholder="یکی از اولویت‌های امروز را بنویسید..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = (e.currentTarget as HTMLInputElement).value;
                                if (val.trim()) {
                                  setTodayLog(prev => ({
                                    ...prev,
                                    tasks: [...prev.tasks, {
                                      id: Date.now().toString(),
                                      title: val.trim(),
                                      status: "pending",
                                      createdAt: new Date().toISOString(),
                                      avoidanceCount: 0
                                    }]
                                  }));
                                  (e.currentTarget as HTMLInputElement).value = "";
                                }
                              }
                            }}
                            className="flex-1 bg-[#0F0F12] border border-[#2A2A35] focus:border-cyan-500 outline-none rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById("morning-task-quick-add") as HTMLInputElement;
                              if (el && el.value.trim()) {
                                setTodayLog(prev => ({
                                  ...prev,
                                  tasks: [...prev.tasks, {
                                    id: Date.now().toString(),
                                    title: el.value.trim(),
                                    status: "pending",
                                    createdAt: new Date().toISOString(),
                                    avoidanceCount: 0
                                  }]
                                }));
                                el.value = "";
                              }
                            }}
                            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 px-3 py-2 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center justify-center shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInStep("none")}
                      className="flex-1 py-2.5 rounded-xl border border-[#2A2A35] text-slate-400 text-xs font-bold font-sans cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleCompleteMorningCheckin}
                      disabled={todayLog.tasks.length === 0}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      ثبت و شروع نبردهای امروز
                    </button>
                  </div>
                </div>
              )}

              {/* MIDDAY CHECK IN FORM */}
              {activeCheckInStep === "midday" && (
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span>بررسی نیم‌روزی (Midday Check-in)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">آیا فرآیند انجام کارها را شروع کرده‌ام؟ اگر جواب منفی است، ریشه عاطفی حاکم بر اهمال‌کاری را پیدا کنیم.</p>
                  
                  <div className="space-y-4 mb-6">
                    <p className="text-xs text-slate-300 font-semibold text-center">آیا امروز را با قدرت شروع کردی؟</p>
                    
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleCompleteMiddayCheckin(true)}
                        className="flex-1 py-4 bg-cyan-950/20 border border-cyan-800/40 hover:border-cyan-500 text-cyan-455 hover:shadow-lg rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
                      >
                        <ThumbsUp className="w-5 h-5 text-cyan-400 animate-bounce" />
                        <span>بله، عالی شروع کردم!</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedReason("Fear of failure")} // Pre-fill any reason to trigger reasons menu
                        className="flex-1 py-4 bg-rose-950/20 border border-rose-900/30 hover:border-rose-900/60 text-slate-300 hover:text-rose-355 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
                      >
                        <HeartCrack className="w-5 h-5 text-rose-400" />
                        <span>خیر، هنوز نه...</span>
                      </button>
                    </div>

                    {selectedReason !== "" && (
                      <div className="p-4 bg-[#0F0F12] rounded-2xl border border-[#2A2A35]">
                        <label className="text-[10px] text-slate-500 font-bold block mb-2">اصلی‌ترین علت روان‌شناختی عدم شروع:</label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { value: "Fear of failure", label: "ترس از شکست و ناقص انجام شدن گام اول" },
                            { value: "Perfectionism", label: "کمال‌گرایی افراطی و سخت‌گیری شدید روی شرایط" },
                            { value: "Fatigue", label: "خستگی جسمی یا فرسودگی ذهنی شدید" },
                            { value: "Ambiguity", label: "ابهام ساختاری و گنگ بودن ابعاد اولویت کار" },
                            { value: "Distraction", label: "عوامل حواس‌پرتی محیطی، مجازی یا پیام‌رسان‌ها" },
                            { value: "Lack of interest", label: "بی‌علاقگی یا عدم تمایل ذاتی به موضوع کار" },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setSelectedReason(item.value as any)}
                              className={`p-2.5 rounded-xl text-right border text-xs transition-all cursor-pointer ${
                                selectedReason === item.value 
                                  ? "bg-cyan-950/30 border-cyan-500 text-cyan-300 font-bold"
                                  : "bg-[#1E1E28] border-transparent text-slate-400 hover:bg-[#1E1E28]/80"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCompleteMiddayCheckin(false)}
                          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold mt-4 cursor-pointer"
                        >
                          اعمال مداخله ثانیه اول و باز کردن قفل اقدام
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInStep("none")}
                      className="w-full py-2 bg-[#0F0F12] border border-[#2A2A35] text-slate-500 hover:bg-[#1E1E28] rounded-xl text-xs font-bold cursor-pointer"
                    >
                      بازگشت
                    </button>
                  </div>
                </div>
              )}

              {/* EVENING CHECK IN FORM */}
              {activeCheckInStep === "evening" && (
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-cyan-400" />
                    <span>بررسی عصرگاهی (Evening Check-in)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">با پاسخ به این گام، صندلی امروز را بر پلتفرم دستاوردهای فردا سوار کنید.</p>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">امروز چه پیشرفتی حاصل شد؟</label>
                      <input
                        type="text"
                        id="evening-progress"
                        placeholder="با چه کیفیت و حجمی کار جلو رفت؟"
                        className="w-full bg-[#0F0F12] border border-[#2A2A35] outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">چه مانعی ملموس راه را سد کرد؟</label>
                      <input
                        type="text"
                        id="evening-stopped"
                        placeholder="حواس‌پرتی، بهانه‌تراشی یا..."
                        className="w-full bg-[#0F0F12] border border-[#2A2A35] outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">اولین اقدام کوچک زیر ۵ دقیقه‌ای فردا صبح چیست؟</label>
                      <input
                        type="text"
                        id="evening-tomorrow-action"
                        placeholder="مثلاً: فقط باز کردن صفحه ۱۰ فایل کدنویسی..."
                        className="w-full bg-[#0F0F12] border border-[#2A2A35] outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl p-3 text-xs text-cyan-455 font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInStep("none")}
                      className="flex-1 py-2 rounded-xl bg-[#0F0F12] border border-[#2A2A35] text-slate-405 text-xs font-semibold cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const progress = (document.getElementById("evening-progress") as HTMLInputElement).value;
                        const stopped = (document.getElementById("evening-stopped") as HTMLInputElement).value;
                        const tomorrow = (document.getElementById("evening-tomorrow-action") as HTMLInputElement).value;
                        handleCompleteEveningCheckin(stopped, tomorrow);
                      }}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold cursor-pointer"
                    >
                      دریافت گزارش و اتمام روز
                    </button>
                  </div>
                </div>
              )}

              {/* NIGHT CONFESSION COMPONENT */}
              {activeCheckInStep === "confession" && (
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                    <Moon className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>اعتراف شبانه (Night Confession)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">اعتراف مقدس شبانه به بهانه‌ها، احساسات و خودتخریبی‌های امروز. با زبان صوتی یا مکتوب رازهایت را جلوی مربی فاش کن.</p>
                  
                  <div className="space-y-4 mb-6">
                    <label className="text-xs font-bold text-slate-400 text-center block">"چرا امروز آن کاری که گفتی را به طور کامل جلو نبردی؟"</label>
                    
                    <div className="relative">
                      <textarea
                        rows={5}
                        placeholder="احساست، بهانه‌تراشی‌ها، تنبلی‌های مخفی و فشارهایی که حس کردی را مکتوب یا صوتی اعتراف کن..."
                        value={confessionText}
                        onChange={(e) => setConfessionText(e.target.value)}
                        className="w-full bg-[#0F0F12] border border-[#2A2A35] focus:border-amber-500 focus:ring-1 focus:ring-amber-555 outline-none rounded-2xl p-4 text-xs text-slate-205 placeholder:text-slate-600 leading-relaxed resize-none transition-all font-sans"
                      />
                      
                      {/* Audio Voice simulation buttons */}
                      <button
                        type="button"
                        onClick={handleToggleVoiceRecording}
                        className={`absolute bottom-3 left-3 p-2.5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                          isRecording 
                            ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse" 
                            : "bg-[#1E1E28] border-[#2A2A35] text-slate-400 hover:text-amber-400 hover:border-amber-500"
                        }`}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    {isRecording && (
                      <p className="text-[10px] text-rose-400 font-sans text-center animate-pulse">سیستم در حال شنیدن صدای فارسی شماست... صحبت کنید و مجدداً بزنید.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCheckInStep("none")}
                      className="flex-1 py-1.5 rounded-xl border border-[#2A2A35] text-slate-500 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNightConfession}
                      disabled={!confessionText.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black disabled:opacity-40 cursor-pointer"
                    >
                      ثبت اعتراف و تحلیل روان‌شناختی
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
