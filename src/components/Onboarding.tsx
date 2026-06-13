import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, ProductivityDna } from "../types";
import { 
  Target, 
  HelpCircle, 
  Sparkles, 
  ShieldAlert, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  Brain,
  Lock
} from "lucide-react";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification States
  const [phone, setPhone] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<UserProfile, "hasCompletedOnboarding">>({
    fullName: "",
    goal: "",
    why: "",
    failConsequence: "",
    distractions: "حواس‌پرتی",
    procrastinationCauses: "",
    peakEnergyTime: "طول روز",
    dailyHours: "۲ الی ۳ ساعت",
    personality: "Friend"
  });

  // SMS OTP Handlers for Meli Payamak REST API integration
  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 10) {
      setError("لطفاً شماره موبایل ۱۱ رقمی معتبری وارد کنید.");
      return;
    }
    setOtpLoading(true);
    setError(null);
    setSimulationCode(null);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phoneNumber: phone })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "خطا در ارسال پیامک فعال‌ساز");
      }

      setIsOtpSent(true);
      if (data.simulated && data.code) {
        setSimulationCode(data.code);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "خطایی در فرآیند ارسال پیامک رخ داد. اتصال را بررسی کنید.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!code || code.trim().length < 4) {
      setError("لطفاً کد تأیید دریافتی را کامل وارد کنید.");
      return;
    }
    setOtpLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phoneNumber: phone, code })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "کد تأیید وارد شده نامعتبر است.");
      }

      setIsOtpVerified(true);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "کد تأیید نادرست است یا زمان اعتبار آن به پایان رسیده است.");
    } finally {
      setOtpLoading(false);
    }
  };

  // 4 Target MVP Questions + Style Choice Screen
  const questions = [
    {
      id: "fullName",
      icon: <UserCheck className="w-8 h-8 text-cyan-400" />,
      title: "نام و نام خانوادگی شما چیست؟",
      subtitle: "برای اینکه صنیمانه‌تر و شخصی‌سازی شده‌تر مربی‌گری رو آغاز کنیم.",
      placeholder: "مثال: علی عباسی...",
      hint: "مربی تو رو با اسم خودت به چالش خواهد کشید تا تعهدت شخصی‌تر باشه."
    },
    {
      id: "goal",
      icon: <Target className="w-8 h-8 text-emerald-400" />,
      title: "هدف بزرگ ۹۰ روزه شما چیست؟",
      subtitle: "یک هدف چالش‌برانگیز اما واقع‌بینانه گام اول حرکت است.",
      placeholder: "مثال: اتمام فاز اول طراحی محصول، دوره‌ی زبان انگلیسی، توسعه بک‌اند ایده کاری خودم...",
      hint: "هدف‌های متمرکز با زمان کوتاه‌مدت، ساده‌تر به ثروت غلبه بر تنبلی تبدیل می‌شوند."
    },
    {
      id: "why",
      icon: <HelpCircle className="w-8 h-8 text-indigo-400" />,
      title: "چرا این هدف تا این حد برایتان حیاتی است؟",
      subtitle: "انگیزه واقعی، سوخت حرکت شما در لحظه‌های دشوار خستگی است.",
      placeholder: "مثال: می‌خواهم درآمد مستقل داشته باشم، مهاجرت کنم و به کارهای تکراری کنونی‌ام پایان بدم...",
      hint: "دلیلی برای صبح برخاستن بنویسید که قلب شما را به وجد بیاورد."
    },
    {
      id: "failConsequence",
      icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
      title: "اگر به این هدف نرسید چه اتفاقی خواهد افتاد؟",
      subtitle: "روبرو شدن با هزینه رکود و شکست، یک نیروی محرکه بی‌نظیر صوتی است.",
      placeholder: "مثال: یک سال دیگر هم همینجا بدون پیشرفت مالی و شخصی درجا می‌زنم و اعتماد به نفسم را از دست می‌دهم...",
      hint: "پیامد پشیمانیِ فردا، بسیار کشنده‌تر و سنگین‌تر از رنج شروع کار امروز است."
    },
    {
      id: "procrastinationCauses",
      icon: <Brain className="w-8 h-8 text-purple-400" />,
      title: "کدام مانع بیشترین تأثیر منفی را روی شما می‌گذارد؟",
      subtitle: "بزرگترین سنگ پنهانی جلو پا که شما را به تله انفعال می‌اندازد.",
      placeholder: "",
      hint: "یکی از موانع کلیدی بالا را با ضربه روی دکمه متناظر مشخص کنید."
    },
    {
      id: "personality",
      icon: <UserCheck className="w-8 h-8 text-cyan-400" />,
      title: "لحن و شخصیت مربی پیگیرتو را انتخاب کنید:",
      subtitle: "این مربی با رفتار منتخب بر اجرای روزانه اولویت‌های شما نظارت دارد.",
      placeholder: "",
      hint: "شخصیت انتخابی شما تمام تحلیل‌ها و گفتگوها را با همان حس و حال به انجام می‌رساند."
    }
  ];

  const obstaclesList = [
    { key: "Fear of failure", label: "ترس از شکست (Fear of failure)" },
    { key: "Perfectionism", label: "کمال‌گرایی (Perfectionism)" },
    { key: "Distraction", label: "حواس‌پرتی (Distraction)" },
    { key: "Fatigue", label: "خستگی و فرسودگی (Fatigue)" },
    { key: "I don't know where to start", label: "نمی‌دانم از کجا شروع کنم (Ambiguity)" }
  ];

  const handleNext = () => {
    const currentQ = questions[step];
    const field = currentQ.id as keyof typeof formData;
    if (!formData[field] && field !== "personality") {
      setError("لطفاً این بخش را کامل کنید تا پیگیرتو بتواند تحلیل دقیقی انجام دهد.");
      return;
    }
    setError(null);

    if (step < questions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setError(null);
      setStep(prev => prev - 1);
    }
  };

  const updateField = (val: string) => {
    const field = questions[step].id as keyof typeof formData;
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        distractions: formData.procrastinationCauses === "Distraction" ? "شبکه‌های اجتماعی و گوشی" : "عوامل بیرونی",
        peakEnergyTime: "طول روز بر اساس زمان انرژی شخصی",
        dailyHours: "۲ ساعت کار متمرکز"
      };

      const response = await fetch("/api/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("خطا در برقراری ارتباط با مربی پیگیرتو. مجدداً تلاش کنید.");
      }

      const dnaResult: ProductivityDna = await response.json();

      const finalProfile: UserProfile = {
        hasCompletedOnboarding: true,
        phoneNumber: phone,
        remindersEnabled: true,
        reminderTimes: {
          morning: "08:30",
          midday: "13:00",
          evening: "18:00",
          night: "22:00"
        },
        ...formData,
        distractions: payload.distractions,
        dna: dnaResult
      };

      onComplete(finalProfile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "خطایی رخ داد. اتصال اینترنت خود را چک کنید و مجدداً تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[step];

  if (!isOtpVerified) {
    return (
      <div className="min-h-screen bg-[#0F0F12] text-slate-100 flex flex-col items-center justify-center p-4 relative antialiased" style={{ direction: "rtl" }}>
        {/* Background radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#16161C] border border-[#2A2A35]/90 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative">
          
          {/* App Logo branding */}
          <div className="flex flex-col items-center justify-center mb-8 select-none text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10 mb-3 animate-pulse">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">پیگیرتو (Peigireto)</h1>
              <span className="text-xs text-rose-400 block mt-1 font-semibold leading-relaxed">
                نمیذاریم از قولی که به خودت دادی فرار کنی.
              </span>
            </div>
          </div>

          <div className="flex flex-col min-h-[300px]">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[#1E1E28] border border-[#2A2A35]/60 rounded-xl">
                <Sparkles className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-mono mb-1 font-bold uppercase">احراز هویت پیامکی</span>
                <h2 className="text-base font-bold text-white tracking-tight leading-relaxed">ورود به مربی مسئولیت‌پذیری</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  برای طراحی دی‌ان‌ای بهره‌وری و دریافت یادآورهای منظم مربی در گوشی خود، شماره همراهتان را تایید کنید.
                </p>
              </div>
            </div>

            <div className="flex-1 mb-6 space-y-4">
              {!isOtpSent ? (
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5 font-bold">شماره موبایل همراه شما:</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 09123456789"
                    className="w-full bg-[#0F0F12] border border-[#2A2A35] focus:border-rose-500 outline-none rounded-xl p-4 text-center text-sm tracking-widest text-slate-100 placeholder:text-slate-600 leading-relaxed focus:ring-1 focus:ring-rose-500 transition-all font-sans font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed text-right">
                    کد فعال‌سازی با سامانه ملی پیامک برای شماره شما ارسال خواهد گردید.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1.5 font-bold">کد ۵ رقمی تایید پیامکی:</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={5}
                      placeholder="• • • • •"
                      className="w-full bg-[#0F0F12] border border-[#2A2A35] focus:border-rose-500 outline-none rounded-xl p-4 text-center text-lg tracking-widest text-[#F43F5E] placeholder:text-slate-600 font-extrabold focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                    />
                    <div className="flex justify-between items-center mt-2.5">
                      <button
                        type="button"
                        onClick={() => { setIsOtpSent(false); setSimulationCode(null); }}
                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                      >
                        تغییر شماره موبایل ({phone})
                      </button>
                      <span className="text-[10px] text-slate-500 font-sans">کد معتبر برای ۳ دقیقه</span>
                    </div>
                  </div>

                  {simulationCode && (
                    <div className="p-3.5 bg-yellow-950/20 border border-yellow-850/40 rounded-xl">
                      <span className="text-[10px] text-yellow-500 font-extrabold block">💡 راهنما شبیه‌ساز (سامانه تست):</span>
                      <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                        کد صادر شده فرضی: <strong className="text-yellow-400 font-mono text-xs">{simulationCode}</strong> می‌باشد. لطفاً آن را وارد کنید تا ادامه دهیم.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl mb-4 leading-relaxed">
                {error}
              </div>
            )}

            <div className="mt-auto">
              {!isOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white hover:shadow-lg hover:shadow-rose-500/10 transition-all rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {otpLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-sans text-xs">در حال ارسال...</span>
                    </div>
                  ) : (
                    <>
                      <span>ارسال کد تایید پیامک</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white hover:shadow-lg hover:shadow-emerald-500/10 transition-all rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {otpLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">درحال بررسی کد...</span>
                    </div>
                  ) : (
                    <>
                      <span>تایید و ورود به پیگیرتو</span>
                      <ChevronLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-600 mt-6 font-mono tracking-wider select-none text-center uppercase">
          PEIGIRETO ACCOUNTABILITY ENGINE • BCT THERAPY MODEL
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F12] text-slate-100 flex flex-col items-center justify-center p-4 relative antialiased" style={{ direction: "rtl" }}>
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#16161C] border border-[#2A2A35]/90 rounded-[32px] p-6 md:p-8 backdrop-blur-xl shadow-2xl relative">
        
        {/* App Logo branding */}
        <div className="flex items-center gap-2.5 mb-8 select-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg border border-white/10">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-wide">پیگیرتو</span>
            <span className="text-[9px] text-rose-400 block -mt-0.5 font-sans font-medium">مربی صوتی غلبه بر تنبلی</span>
          </div>
        </div>

        {/* Step Progress bar */}
        <div className="w-full bg-[#0F0F12] h-1 rounded-full mb-8 overflow-hidden flex flex-row-reverse">
          <div 
            className="bg-gradient-to-l from-rose-500 to-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col min-h-[320px]"
          >
            {/* Question Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-[#1E1E28] border border-[#2A2A35]/60 rounded-xl">
                {currentQuestion.icon}
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block font-mono mb-0.5 font-bold">سوال {step + 1} از {questions.length}</span>
                <h2 className="text-base font-bold text-white tracking-tight leading-relaxed">{currentQuestion.title}</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{currentQuestion.subtitle}</p>
              </div>
            </div>

            {/* Input Content Area */}
            <div className="flex-1 mb-6">
              {currentQuestion.id === "procrastinationCauses" ? (
                <div className="grid grid-cols-1 gap-2.5 mt-2">
                  {obstaclesList.map((ob) => (
                    <button
                      key={ob.key}
                      type="button"
                      onClick={() => updateField(ob.key)}
                      className={`p-3.5 rounded-xl border text-right text-xs transition-all flex items-center justify-between cursor-pointer ${
                        formData.procrastinationCauses === ob.key
                          ? "bg-[#1E1E28] border-rose-500 text-rose-300 font-bold"
                          : "bg-[#0F0F12] border-[#2A2A35] hover:bg-[#1E1E28]/40 text-slate-300"
                      }`}
                    >
                      <span>{ob.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        formData.procrastinationCauses === ob.key ? "border-rose-500 bg-rose-500/20" : "border-slate-600"
                      }`}>
                        {formData.procrastinationCauses === ob.key && <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : currentQuestion.id === "personality" ? (
                <div className="grid grid-cols-1 gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => updateField("Commander")}
                    className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formData.personality === "Commander"
                        ? "bg-[#1E1E28] border-rose-500 text-rose-300 font-bold"
                        : "bg-[#0F0F12] border-[#2A2A35] hover:bg-[#1E1E28]/40 text-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                      formData.personality === "Commander" ? "border-rose-500 bg-rose-500/20" : "border-slate-600"
                    }`}>
                      {formData.personality === "Commander" && <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>مربی فرمانده (Commander)</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-850 text-rose-300 font-bold">سرسخت و مستقیم</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        بسیار مستقیم، مقتدر، بدون پذیرش کوچک‌ترین بهانه‌ای و با نگاه جدی مسئولیت‌پذیری بالا.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField("Friend")}
                    className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formData.personality === "Friend"
                        ? "bg-[#1E1E28] border-rose-500 text-rose-300 font-bold"
                        : "bg-[#0F0F12] border-[#2A2A35] hover:bg-[#1E1E28]/40 text-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                      formData.personality === "Friend" ? "border-rose-500 bg-rose-500/20" : "border-slate-600"
                    }`}>
                      {formData.personality === "Friend" && <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>مربی رفیق صمیمی (Friend)</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-900 text-emerald-300 font-bold">صمیمی و صبور</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        بسیار انگیزه‌دهنده، دوست‌داشتنی، تاییدکننده، همراه همیشگی و مربی صمیمی روزهای سخت تغییر.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField("Mentor")}
                    className={`p-4 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      formData.personality === "Mentor"
                        ? "bg-[#1E1E28] border-rose-500 text-rose-300 font-bold"
                        : "bg-[#0F0F12] border-[#2A2A35] hover:bg-[#1E1E28]/40 text-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 shrink-0 ${
                      formData.personality === "Mentor" ? "border-rose-500 bg-rose-500/20" : "border-slate-600"
                    }`}>
                      {formData.personality === "Mentor" && <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>}
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>مربی مرشد و راهنما (Mentor)</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1E1E28] border border-blue-900/60 text-blue-300 font-bold">تحلیلی و صبور</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        تحلیلی، اهل تامل عمیق روانشناختی، کمک‌کننده به مهندسی عادت‌ها و شکستن سدهای رعب‌آور کار.
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selectable click chips for ease of onboarding */}
                  {currentQuestion.id === "goal" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#A1A1AA] block font-bold">💡 پیشنهادهای آماده (روی هر کدام مایل بودی کلیک کن):</span>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "کامل کردن دوره برنامه‌نویسی و طراحی پروژه‌ی شخصی",
                          "یادگیری زبان جدید (مثلاً انگلیسی/آلمانی) برای ارتقا علمی یا مهاجرت",
                          "توسعه رژیم سلامت، ورزش منظم روزانه و کاهش وزن مداوم",
                          "شروع یا توسعه فاز اول مینی‌استارت‌آپ شخصی من"
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => updateField(suggestion)}
                            className={`p-2.5 rounded-xl border text-right text-[11px] leading-relaxed transition-all cursor-pointer ${
                              formData.goal === suggestion
                                ? "bg-rose-950/40 border-rose-500 text-rose-300 font-bold"
                                : "bg-[#1C1C24] border-[#2A2A35]/60 hover:bg-[#1E1E28] text-slate-300"
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.id === "why" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#A1A1AA] block font-bold">💡 دغدغه‌های تکرار شونده (روی هر کدام مایل بودی کلیک کن):</span>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "از وضعیت تکراری و درجا زدن بدون رشد خسته شده‌ام و استقلال مالی می‌خواهم.",
                          "می‌خواهم به قولی که به خود دادم پایبند بمانم و انضباط فردی‌ام را بازیابی کنم.",
                          "برای رسیدن به اهداف بزرگ زندگی و عقب نماندن از هم‌ سن و سال‌هایم به آن نیاز دارم.",
                          "میخواهم از پتانسیل واقعی مغزم استفاده کنم و کلاف سردرگم روزمرگی را پاره کنم."
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => updateField(suggestion)}
                            className={`p-2.5 rounded-xl border text-right text-[11px] leading-relaxed transition-all cursor-pointer ${
                              formData.why === suggestion
                                ? "bg-rose-950/40 border-rose-500 text-rose-300 font-bold"
                                : "bg-[#1C1C24] border-[#2A2A35]/60 hover:bg-[#1E1E28] text-slate-300"
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.id === "failConsequence" && (
                    <div className="space-y-2">
                      <span className="text-[10px] text-[#A1A1AA] block font-bold">💡 عواقب بدقولی به خود (روی هر کدام مایل بودی کلیک کن):</span>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          "یک سال دیگر در همین نقطه کلافه، بدون رشد مالی و مهارت کافی درجا خواهم زد.",
                          "اعتمادبه‌نفس شروع مجدد و عزت‌نفس تعهد به آینده‌ام به کلی از بین می‌رود.",
                          "رویای رسیدگی به استقلال شخصی و پیشرفت آینده برای همیشه به تعویق می‌افتد.",
                          "حسرت تماشا کردن موفقیت کسانی که امروز استارت زدند تا ابد با من می‌ماند."
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => updateField(suggestion)}
                            className={`p-2.5 rounded-xl border text-right text-[11px] leading-relaxed transition-all cursor-pointer ${
                              formData.failConsequence === suggestion
                                ? "bg-rose-950/40 border-rose-500 text-rose-300 font-bold"
                                : "bg-[#1C1C24] border-[#2A2A35]/60 hover:bg-[#1E1E28] text-slate-300"
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentQuestion.id === "fullName" ? (
                    <input
                      type="text"
                      value={(formData[currentQuestion.id as keyof typeof formData] as string) || ""}
                      onChange={(e) => updateField(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full bg-[#0F0F12] border border-[#2A2A35] focus:border-rose-500 outline-none rounded-xl p-4 text-xs text-slate-100 placeholder:text-slate-600 leading-relaxed focus:ring-1 focus:ring-rose-500 transition-all font-sans"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      value={(formData[currentQuestion.id as keyof typeof formData] as string) || ""}
                      onChange={(e) => updateField(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full bg-[#0F0F12] border border-[#2A2A35] focus:border-rose-500 outline-none rounded-xl p-4 text-xs text-slate-100 placeholder:text-slate-600 leading-relaxed resize-none focus:ring-1 focus:ring-rose-500 transition-all font-sans"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl mb-4 leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            {/* Hint Box */}
            {currentQuestion.hint && (
              <div className="p-3 bg-[#0F0F12]/60 border border-[#2A2A35]/80 rounded-xl mb-6 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">{currentQuestion.hint}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="py-3 px-4 rounded-xl border border-[#2A2A35] hover:bg-[#1E1E28]/40 text-slate-400 hover:text-slate-200 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 font-sans"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>قبلی</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white hover:shadow-lg hover:shadow-rose-500/10 transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-sans text-[11px]">تحلیل بیومتری روانشناختی دی‌ان‌ای...</span>
                  </div>
                ) : (
                  <>
                    <span>{step === questions.length - 1 ? "ایجاد دی‌ان‌ای و فعال‌سازی مربی پیگیرتو" : "ادامه مسیر"}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>

      <div className="text-[9px] text-slate-600 mt-6 font-mono tracking-wider select-none text-center">
        PEIGIRETO ACCOUNTABILITY ENGINE • SECURED BY SCIENTIFIC BEHAVIORAL COGNITIVE THERAPY
      </div>
    </div>
  );
}
