import { motion } from "motion/react";
import { UserProfile } from "../types";
import { 
  Zap, 
  Brain, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Heart,
  UserCheck,
  Award
} from "lucide-react";

interface DnaDisplayProps {
  profile: UserProfile;
}

export default function DnaDisplay({ profile }: DnaDisplayProps) {
  const dna = profile.dna;

  if (!dna) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center" style={{ direction: "rtl" }}>
        <div className="w-12 h-12 rounded-xl bg-[#0F0F12] border border-[#2A2A35] flex items-center justify-center animate-spin mb-4">
          <Activity className="w-6 h-6 text-cyan-400" />
        </div>
        <p className="text-xs text-slate-500 font-bold">در حال دریافت داده‌های هویتی و پردازش ساختار عاطفی...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24 overflow-y-auto px-4 pt-4 select-none text-right font-sans" style={{ direction: "rtl" }}>
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">شناسنامه بهره‌وری شما (DNA)</h1>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">تحلیل ریشه‌ای رفتارها، عادات و روان‌شناختی مبارزه شخصی شما بر علیه تعلل.</p>
      </div>

      {/* Grid Layout of DNA metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        
        {/* Procrastination Type */}
        <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl relative overflow-hidden group shadow-md text-right">
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-rose-500"></div>
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">ریشه عاطفی تعلل (تیپولوژی)</span>
              <h3 className="text-sm font-bold text-rose-300 mt-1">{dna.procrastinationType}</h3>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mt-2 font-semibold">شناخت این الگو اولین قدم غلبه بر مقاومت است. این رفتار برای فرار از اضطراب است، نه از سر تنبلی.</p>
            </div>
          </div>
        </div>

        {/* Golden Focus Hours */}
        <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl relative overflow-hidden group shadow-md text-right">
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-amber-500"></div>
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">ساعات طلایی تمرکز</span>
              <h3 className="text-sm font-bold text-amber-300 mt-1">{dna.bestFocusHours}</h3>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mt-2 font-semibold">مربی در این ساعات اولویت‌های فرعی شما را کاملاً لغو کرده و روی مهم‌ترین هدف ۹۰ روزه جفت می‌کند.</p>
            </div>
          </div>
        </div>

        {/* Motivation Style */}
        <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl relative overflow-hidden group shadow-md text-right">
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-cyan-500"></div>
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">سبک انگیختگی رفتاری</span>
              <h3 className="text-sm font-bold text-cyan-300 mt-1">{dna.motivationStyle}</h3>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mt-2 font-semibold">محرک‌هایی که سیستم غشایی مغز شما را تحریک می‌کنند تا از مغلوب شدن پشت میز فرار کنید.</p>
            </div>
          </div>
        </div>

        {/* Attention Span */}
        <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl relative overflow-hidden group shadow-md text-right">
          <div className="absolute top-0 right-0 bottom-0 w-1 bg-blue-500"></div>
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/20 border border-blue-900/40 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider">طول بازه تمرکز عمیق (دیپ‌کار)</span>
              <h3 className="text-sm font-bold text-blue-300 mt-1">{dna.attentionSpan} دقیقه کار مداوم</h3>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mt-2 font-semibold">بازه متمرکز بهینه شما پیش از انزوا و خستگی مغزی. بعد از این مدت حتماً ۵ دقیقه استراحت ملو کنید.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Distraction Triggers */}
      <div className="p-4 bg-[#0F0F12] border border-[#2A2A35] rounded-2xl mb-6 text-right">
        <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>محرک‌های انحراف ذهن و تله‌های تمرکز شما</span>
        </h3>
        <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#1E1E28] border border-[#2A2A35]/50 rounded-xl p-3 font-semibold">
          {dna.distractionTriggers}
        </p>
      </div>

      {/* Extended Personality Analysis Card */}
      <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-5 relative overflow-hidden mb-6 shadow-md text-right">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0F0F12] border border-[#2A2A35] flex items-center justify-center">
            <Award className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block font-bold tracking-wider">تحلیل عمیق شخصیتی مربی روانشناختی</span>
            <h4 className="text-xs font-bold text-[#E2E8F0] mt-0.5">پروفایل رفتاری بر بال‌های اصول Atomic Habits</h4>
          </div>
        </div>

        <p className="text-xs text-[#CBD5E1] leading-relaxed tracking-wide text-justify whitespace-pre-line font-semibold bg-[#0F0F12] border border-[#2A2A35]/65 rounded-xl p-4">
          {dna.profileAnalysis}
        </p>
      </div>

      {/* Quotes section */}
      <div className="text-center py-4 bg-[#0F0F12] rounded-xl border border-dashed border-[#2A2A35] p-4">
        <p className="font-sans text-[10px] text-cyan-400 font-bold">«ما به اندازه اهدافمان رشد نمی‌کنیم؛ ما تا سطح سیستم‌هایمان سقوط می‌کنیم.»</p>
        <span className="text-[9px] text-slate-600 block mt-1 font-semibold">— جیمز کلیر، کتاب خرده‌عادت‌ها</span>
      </div>

    </div>
  );
}
