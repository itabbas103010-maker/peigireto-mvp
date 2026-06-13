import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, CheckCircle, Sparkles, AlertCircle, RefreshCw, Star, Info, Moon, Sun, ArrowLeftRight, HelpCircle } from "lucide-react";

export interface HabitLoop {
  id: string;
  title: string;
  type: "positive" | "negative";
  cue: string;      // Stage 1: Cue
  craving: string;  // Stage 2: Craving
  response: string; // Stage 3: Response
  reward: string;   // Stage 4: Reward
  streak: number;
  lastCompleted?: string; // YYYY-MM-DD
  createdAt: string;
}

export default function AtomicHabits() {
  const [habits, setHabits] = useState<HabitLoop[]>(() => {
    const saved = localStorage.getItem("peigireto_atomic_habits");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    // Default initial templates to help the user understand
    return [
      {
        id: "default-1",
        title: "مطالعه کتب تخصصی",
        type: "positive",
        cue: "بعد از ریختن چای تلخ صبحانه روی میز کار (واضح کن)",
        craving: "به تسلط علمی و کدهای تمیزی که خواهم نوشت فکر می‌کنم (جذاب کن)",
        response: "کتابم را باز روبرویم می‌گذارم و تعهد به خواندن فقط ۲ صفحه می‌کنم (ساده کن)",
        reward: "تیک زدن در پیگیرتو و نوشیدن اولین جرعه چای داغ (لذت‌بخش کن)",
        streak: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: "default-2",
        title: "ترک اینستاگرام حین کار",
        type: "negative",
        cue: "گوشی را خاموش کرده و در کمد اتاق دیگر قرار می‌دهم (نامرئی کن)",
        craving: "به این فکر می‌کنم که پیمایش بی‌هدف چقدر زمان باارزشم را متلاشی می‌کند (غیرجذاب کن)",
        response: "روی برنامه‌های شبکه اجتماعی قفل ساعتی اضافه می‌کنم (سخت کن)",
        reward: "ثبت ساعات کار تمیز بدون حواس‌پرتی در پیگیرتو (ناخوشایند کن - برای شکستن لوپ قبلی)",
        streak: 5,
        createdAt: new Date().toISOString(),
      }
    ];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"positive" | "negative">("positive");

  // Form states
  const [title, setTitle] = useState("");
  const [cue, setCue] = useState("");
  const [craving, setCraving] = useState("");
  const [response, setResponse] = useState("");
  const [reward, setReward] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("peigireto_atomic_habits", JSON.stringify(habits));
  }, [habits]);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !cue.trim() || !craving.trim() || !response.trim() || !reward.trim()) {
      setError("لطفاً تمام فیلدهای چرخه ۴ مرحله‌ای جیمز کلیر را با مثال پر کنید.");
      return;
    }

    const newHabit: HabitLoop = {
      id: Date.now().toString(),
      title: title.trim(),
      type: activeTab,
      cue: cue.trim(),
      craving: craving.trim(),
      response: response.trim(),
      reward: reward.trim(),
      streak: 0,
      createdAt: new Date().toISOString()
    };

    setHabits(prev => [newHabit, ...prev]);
    setTitle("");
    setCue("");
    setCraving("");
    setResponse("");
    setReward("");
    setError(null);
    setShowAddForm(false);
  };

  const handleRemoveHabit = (id: string) => {
    if (window.confirm("آیا مایلید این عادات و چرخه ثبت شده اتمی را حذف کنید؟")) {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  const handleCompleteHabitToday = (id: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    setHabits(prev => prev.map(habit => {
      if (habit.id === id) {
        if (habit.lastCompleted === todayStr) {
          return habit; // Already completed today
        }
        return {
          ...habit,
          streak: habit.streak + 1,
          lastCompleted: todayStr
        };
      }
      return habit;
    }));
  };

  const filteredHabits = habits.filter(h => h.type === activeTab);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 text-right" style={{ direction: "rtl" }}>
      
      {/* Atomic Habits Header Info card */}
      <div className="mb-4 bg-gradient-to-br from-indigo-950/40 to-[#16161C] border border-[#2A2A35] p-4 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-950/30 flex items-center justify-center shrink-0 border border-orange-850/30">
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">مهندسی عادات بر اساس «عادت‌های اتمی»</h2>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              تفسیر اتمیکِ جیمز کلیر: کلید تغییر رفتار، ۴ مرحله چرخه‌ی بیولوژیک است. عادات مثبت بساز یا با معکوس کردن لوپ، عادات مسموم را نابود کن.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Habit Loop Breakdown Box */}
      <div className="mb-6 bg-[#16161C] border border-[#2A2A35]/80 rounded-2xl p-4 shadow-lg text-right">
        <h3 className="text-xs font-extrabold text-cyan-400 mb-2 flex items-center gap-1.5 justify-start">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>راز چرخه ۴ مرحله‌ای عادت چیست؟</span>
        </h3>
        <p className="text-[10px] text-slate-300 leading-relaxed mb-3.5 text-justify font-medium">
          هر رفتاری که روزانه تکرار می‌کنید، از یک چرخه عصبی چهار مرحله‌ای عبور می‌کند. جیمز کلیر در کتاب «عادت‌های اتمی» توضیح می‌دهد که برای ساختن عادات قوی یا سرکوب عادت‌های مخرب، باید روی این مراحل متمرکز شوید:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="bg-[#0F0F12] border border-[#2A2A35]/50 p-3 rounded-xl flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-lg bg-cyan-950/50 border border-cyan-800/30 text-cyan-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0 mt-0.5">۱</span>
            <div>
              <h4 className="text-[10px] font-black text-slate-200">نشانه (Cue) - «آن را واضح کن»</h4>
              <p className="text-[9px] text-slate-405 mt-1 leading-relaxed">محرکی محیطی که مغز شما را آگاه کرده و پیش‌بینی پاداش را آغاز می‌کند (مثلاً دیدن کتاب زبان روی میز کار).</p>
            </div>
          </div>

          <div className="bg-[#0F0F12] border border-[#2A2A35]/50 p-3 rounded-xl flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-lg bg-amber-955/50 border border-amber-900/30 text-amber-500 flex items-center justify-center font-bold text-[10px] font-mono shrink-0 mt-0.5">۲</span>
            <div>
              <h4 className="text-[10px] font-black text-slate-200">اشتیاق (Craving) - «آن را جذاب کن»</h4>
              <p className="text-[9px] text-slate-405 mt-1 leading-relaxed">نیروی محرکه پشت هر عادت؛ میلِ شدید به تغییرِ احساسِ درونی‌تان پس از دریافت پاداش (مثلاً اشتیاق به رشد تخصصی).</p>
            </div>
          </div>

          <div className="bg-[#0F0F12] border border-[#2A2A35]/50 p-3 rounded-xl flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-lg bg-emerald-955/50 border border-emerald-900/30 text-emerald-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0 mt-0.5">۳</span>
            <div>
              <h4 className="text-[10px] font-black text-slate-200">پاسخ (Response) - «آن را ساده کن»</h4>
              <p className="text-[9px] text-slate-405 mt-1 leading-relaxed">خود اقدامی که بر اساس اشتیاق انجام می‌دهید. هر چه گام اول آسان‌تر باشد (مثلاً فقط ۵ دقیقه مطالعه)، مقاومت کمتر است.</p>
            </div>
          </div>

          <div className="bg-[#0F0F12] border border-[#2A2A35]/50 p-3 rounded-xl flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-lg bg-indigo-950/60 border border-indigo-900/30 text-indigo-400 flex items-center justify-center font-bold text-[10px] font-mono shrink-0 mt-0.5">۴</span>
            <div>
              <h4 className="text-[10px] font-black text-slate-200">پاداش (Reward) - «آن را لذت‌بخش کن»</h4>
              <p className="text-[9px] text-slate-405 mt-1 leading-relaxed">هدف نهایی عادت؛ حس موفقیت که به مغز می‌گوید در صورت مواجه دوباره با نشانه، اقدام مشابه را مجدداً تکرار کن.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector Positive vs Negative */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0F0F12] border border-[#2A2A35]/60 rounded-xl mb-6 select-none">
        <button
          type="button"
          onClick={() => {
            setActiveTab("positive");
            setShowAddForm(false);
          }}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "positive"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          ➕ ساخت عادات مثبت (توسعه)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("negative");
            setShowAddForm(false);
          }}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === "negative"
              ? "bg-rose-500/15 border border-rose-500/30 text-rose-400 font-extrabold"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          ❌ ترک عادات منفی (حذف)
        </button>
      </div>

      {/* Habit Actions Container */}
      <div className="mb-6 flex justify-between items-center bg-[#1E1E28]/40 border border-[#2A2A35]/60 p-3 rounded-xl">
        <span className="text-[10px] text-slate-400 font-bold">
          {activeTab === "positive" 
            ? "تعداد عادات مثبت شما: " + filteredHabits.length 
            : "تعداد عادات منفی مشخص شده: " + filteredHabits.length}
        </span>
        <button
          type="button"
          onClick={() => setShowAddForm(prev => !prev)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
            showAddForm 
              ? "bg-slate-800 text-slate-300"
              : activeTab === "positive"
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
              : "bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10"
          }`}
        >
          {showAddForm ? "انصراف" : "تعریف چرخه جدید"}
        </button>
      </div>

      {/* ADD FORM */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddHabit}
            className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-4 mb-6 space-y-4 overflow-hidden"
          >
            <div className="border-b border-[#2A2A35] pb-2.5">
              <h3 className="text-xs font-bold text-slate-200">
                {activeTab === "positive" ? "⭐ تعریف چرخه‌ی عادت مثبت جدید" : "⚠️ فرم معکوس‌سازی عادت منفی مسموم"}
              </h3>
              <p className="text-[9px] text-[#A1A1AA] mt-0.5 leading-relaxed">
                همان کارهایی که در ۵ دقیقه ابتدایی کلید می‌زنید تا مهار رفتار در دست قرار گیرد.
              </p>
            </div>

            {/* Habit Title */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">نام یا عنوان اصلی عادت:</label>
              <input
                type="text"
                placeholder="مثال: مطالعه روزانه، نخوردن شکر مفرط، بیدار شدن به موقع..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs font-semibold rounded-lg p-2.5 bg-[#0F0F12] border border-[#2A2A35] focus:border-cyan-500 outline-none text-slate-100"
              />
            </div>

            {/* Cue (Stage 1) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 font-bold">مرحله ۱ - نشانه (Cue):</label>
                <span className="text-[9px] text-indigo-400">{activeTab === "positive" ? "«واضحش کن»" : "«نامرئی‌اش کن»"}</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === "positive" ? "مثال: وقتی لپ‌تاپ را باز کردم و قهوه داغ روی میزم آمد..." : "مثال: گوشی را صبح تا شب خاموش کرده و خارج از دیدرس می‌گذارم..."}
                value={cue}
                onChange={(e) => setCue(e.target.value)}
                className="w-full text-xs rounded-lg p-2.5 bg-[#0F0F12] border border-[#2A2A35] outline-none text-slate-100"
              />
            </div>

            {/* Craving (Stage 2) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 font-bold">مرحله ۲ - اشتیاق (Craving):</label>
                <span className="text-[9px] text-indigo-400">{activeTab === "positive" ? "«جذابش کن»" : "«غیرجذابش کن»"}</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === "positive" ? "مثال: تصور غرق شدن در تخصص و تحسین مربی پیگیرتو..." : "مثال: به این فکر می‌کنم که ۱ ساعت گردش در اینستاگرام چطور مغزم را کرخت می‌کند..."}
                value={craving}
                onChange={(e) => setCraving(e.target.value)}
                className="w-full text-xs rounded-lg p-2.5 bg-[#0F0F12] border border-[#2A2A35] outline-none text-slate-100"
              />
            </div>

            {/* Response (Stage 3) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 font-bold">مرحله ۳ - پاسخ (Response):</label>
                <span className="text-[9px] text-indigo-400">{activeTab === "positive" ? "«ساده‌اش کن»" : "«سختش کن»"}</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === "positive" ? "مثال: فقط ۲ خط کتاب می‌خوانم یا کارم را به اندازه ۵ دقیقه اول خرد می‌کنم..." : "مثال: روی برنامه‌ها قفل رمزدار ۳۰ حرفی طولانی می‌گذارم..."}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full text-xs rounded-lg p-2.5 bg-[#0F0F12] border border-[#2A2A35] outline-none text-slate-100"
              />
            </div>

            {/* Reward (Stage 4) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400 font-bold">مرحله ۴ - پاداش (Reward):</label>
                <span className="text-[9px] text-indigo-400">{activeTab === "positive" ? "«لذت‌بخش کن»" : "«ناخوشایندش کن»"}</span>
              </div>
              <input
                type="text"
                placeholder={activeTab === "positive" ? "مثال: تیک زدن در دیتابیس پیگیرتو و خوردن چای میوه‌ای خوشبو..." : "مثال: اگر خطا کنم، فردا یک ربع پیاده‌روی اجباری سنگین انجام می‌دهم..."}
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="w-full text-xs rounded-lg p-2.5 bg-[#0F0F12] border border-[#2A2A35] outline-none text-slate-100"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-900/60 text-rose-300 text-[10px] rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              ثبت نهایی چرخه اتمی عادت
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* LIST OF CURRENT HABITS */}
      <div className="space-y-4">
        {filteredHabits.length === 0 ? (
          <div className="py-12 bg-[#0F0F12]/60 border border-dashed border-[#2A2A35] rounded-2xl flex flex-col items-center justify-center p-6 text-center select-none">
            <Info className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-bold">جهت ساخت یا ترک عادت، دکمه بالا را کلیک کنید.</p>
            <p className="text-[9px] text-slate-500 mt-1 max-w-xs leading-relaxed">چرخه ۴ مرحله‌ای جیمز کلیر به شما آموزش می‌دهد هر عادتی یک لوپ پیوسته از این مراحل است.</p>
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const isCompletedToday = habit.lastCompleted === new Date().toISOString().split("T")[0];
            return (
              <div
                key={habit.id}
                className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl overflow-hidden relative shadow-md transition-all hover:border-[#2A2A35]/90"
              >
                {/* Decorative Left color bar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  habit.type === "positive" ? "bg-emerald-500" : "bg-rose-500"
                }`}></div>

                {/* Head Card Section */}
                <div className="p-4 border-b border-[#2A2A35]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      habit.type === "positive" 
                        ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" 
                        : "bg-rose-950/20 border-rose-900/30 text-rose-400"
                    }`}>
                      <Star className={`w-4 h-4 ${isCompletedToday ? "fill-current" : ""}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100">{habit.title}</h4>
                      <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">
                        🔥 زنجیره پشتکار عادت: {habit.streak} روز پیاپی
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Tick implementation */}
                    <button
                      type="button"
                      disabled={isCompletedToday}
                      onClick={() => handleCompleteHabitToday(habit.id)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        isCompletedToday
                          ? "bg-emerald-950/40 border border-emerald-900/30 text-emerald-400"
                          : habit.type === "positive"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-rose-500 hover:bg-rose-600 text-white"
                      }`}
                    >
                      {isCompletedToday ? "✓ ثبت امروز" : "انجام دادم"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveHabit(habit.id)}
                      className="p-1 px-2 hover:bg-[#0F0F12] text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Habit Stages Loops */}
                <div className="p-4 bg-[#0F0F12]/30 space-y-3.5 select-text">
                  
                  {/* CUE */}
                  <div className="flex gap-2 text-xs items-start">
                    <span className="text-[9px] w-20 shrink-0 select-none bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded font-bold text-center">
                      ۱. نشانه (Cue)
                    </span>
                    <p className="text-slate-300 leading-relaxed font-semibold text-[11px] pt-0.5">{habit.cue}</p>
                  </div>

                  {/* CRAVING */}
                  <div className="flex gap-2 text-xs items-start">
                    <span className="text-[9px] w-20 shrink-0 select-none bg-teal-950/50 border border-teal-900/40 text-teal-400 px-1.5 py-0.5 rounded font-bold text-center">
                      ۲. اشتیاق
                    </span>
                    <p className="text-slate-300 leading-relaxed font-semibold text-[11px] pt-0.5">{habit.craving}</p>
                  </div>

                  {/* RESPONSE */}
                  <div className="flex gap-2 text-xs items-start">
                    <span className="text-[9px] w-20 shrink-0 select-none bg-amber-950/50 border border-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded font-bold text-center">
                      ۳. پاسخ (Resp)
                    </span>
                    <p className="text-slate-300 leading-relaxed font-semibold text-[11px] pt-0.5">{habit.response}</p>
                  </div>

                  {/* REWARD */}
                  <div className="flex gap-2 text-xs items-start">
                    <span className="text-[9px] w-20 shrink-0 select-none bg-pink-950/50 border border-pink-900/40 text-pink-400 px-1.5 py-0.5 rounded font-bold text-center">
                      ۴. پاداش (Rew)
                    </span>
                    <p className="text-slate-300 leading-relaxed font-semibold text-[11px] pt-0.5">{habit.reward}</p>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
