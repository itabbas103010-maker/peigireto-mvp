import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, DailyLog, AnalyticsReport } from "../types";
import DnaDisplay from "./DnaDisplay";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from "recharts";
import { 
  TrendingUp, 
  HelpCircle, 
  Sparkles, 
  AlertCircle, 
  Heart, 
  Clock, 
  Cpu, 
  ChevronDown, 
  RefreshCw, 
  Activity, 
  BookOpen, 
  CheckCircle2, 
  Crosshair,
  TrendingDown
} from "lucide-react";

interface ReportsViewProps {
  profile: UserProfile;
  dailyLogs: DailyLog[];
}

export default function ReportsView({ profile, dailyLogs }: ReportsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"analysis" | "dna">("analysis");

  // Generate Recharts data for the last 7 days of completed tasks
  const getRechartsData = () => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      
      const weekdayName = d.toLocaleDateString("fa-IR", { weekday: "short" });
      const dayOfMonth = d.toLocaleDateString("fa-IR", { day: "numeric", month: "numeric" });
      
      const log = dailyLogs.find(l => l.date === dateStr);
      const total = log ? log.tasks.length : 0;
      const completed = log ? log.tasks.filter(t => t.status === "completed").length : 0;
      
      return {
        label: `${weekdayName} (${dayOfMonth})`,
        completed: completed,
        total: total,
        date: dateStr
      };
    });
  };

  const rechartsData = getRechartsData();

  const [report, setReport] = useState<AnalyticsReport | null>(() => {
    // Attempt local storage recall of last saved report
    const lastSaved = localStorage.getItem("peigireto_last_saved_report");
    if (lastSaved) {
      try {
        return JSON.parse(lastSaved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerGenerateReport = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/coach/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          history: [],
          profile: profile,
          dailyLogs: dailyLogs
        })
      });

      if (!response.ok) {
        throw new Error("خطا در پاسخ هوش ذکاوت بالا در مربی");
      }

      const generated: AnalyticsReport = await response.json();
      generated.generatedAt = new Date().toISOString();

      setReport(generated);
      localStorage.setItem("peigireto_last_saved_report", JSON.stringify(generated));

    } catch (e: any) {
      console.error(e);
      setError("کارت تولید گزارش عمیق به علت اختلال موقت با خطا مواجه شد. بارگذاری مجدد فرمایید.");
    } finally {
      setGenerating(false);
    }
  };

  // Generate generic charts data based on logs
  const renderSVGChart = () => {
    // Generate a simple area gradient for the last 7 logged days
    const last7Logs = [...dailyLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    if (last7Logs.length < 2) {
      // Fallback data if user hasn't logged anything yet
      return (
        <div className="h-32 flex items-center justify-center border border-[#2A2A35]/60 bg-[#0F0F12] rounded-xl">
          <p className="text-[10px] text-slate-500 font-sans font-bold">اطلاعات روزهای متوالی پس از ثبت چک‌این‌ها در چارت به نمایش در خواهد آمد.</p>
        </div>
      );
    }

    const valuePoints = last7Logs.map((log) => {
      if (log.tasks.length === 0) return 0;
      const completed = log.tasks.filter(t => t.status === "completed").length;
      return (completed / log.tasks.length) * 100;
    });

    // Translate points into classic SVG path
    const chartHeight = 80;
    const chartWidth = 320;
    const padding = 15;
    const stepX = (chartWidth - padding * 2) / (valuePoints.length - 1);
    
    let pathD = "";
    let areaD = "";

    valuePoints.forEach((val, i) => {
      const x = padding + i * stepX;
      // SVG 0,0 is top-left, so subtract the val height
      const y = chartHeight - (val / 100) * (chartHeight - padding * 2) - padding;
      
      if (i === 0) {
        pathD = `M ${x} ${y}`;
        areaD = `M ${x} ${chartHeight} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }

      if (i === valuePoints.length - 1) {
        areaD += ` L ${x} ${chartHeight} Z`;
      }
    });

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={padding} x2={chartWidth} y2={padding} stroke="#2A2A35" strokeWidth="0.5" strokeDasharray="3" />
          <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#2A2A35" strokeWidth="0.5" strokeDasharray="3" />
          <line x1="0" y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="#2A2A35" strokeWidth="0.5" strokeDasharray="3" />

          {/* Area under curve */}
          <path d={areaD} fill="url(#chartGlow)" />

          {/* Clean line stroke */}
          <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots on data */}
          {valuePoints.map((val, i) => {
            const x = padding + i * stepX;
            const y = chartHeight - (val / 100) * (chartHeight - padding * 2) - padding;
            return (
              <circle key={i} cx={x} cy={y} r="3.5" fill="#0F0F12" stroke="#22d3ee" strokeWidth="2" />
            );
          })}
        </svg>

        <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1 px-1">
          <span>روایت روز اول</span>
          <span>امروز</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto px-4 pt-4 relative select-none text-right" style={{ direction: "rtl" }}>
      
      {/* Top title */}
      <div className="mb-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
          <span>آنالیز ۳۰ روزه عملکرد</span>
          <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
        </h1>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">گزارشات رفتاری دقیق، صادر شده توسط هوش معتمد با تفکر عمیق روان‌شناختی.</p>
      </div>

      {/* Sub-tab switcher */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0F0F12] border border-[#2A2A35]/60 rounded-xl mb-6 select-none max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab("analysis")}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "analysis"
              ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-extrabold shadow-sm"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          گزارش و آنالیز رفتار
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("dna")}
          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "dna"
              ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-extrabold shadow-sm"
              : "text-slate-500 hover:text-slate-400"
          }`}
        >
          شناسنامه بهره‌وری (DNA)
        </button>
      </div>

      {activeSubTab === "analysis" ? (
        <>
          {/* SVG Performance Progress Chart Card */}
          <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl mb-6 shadow-md relative overflow-hidden">
        <h3 className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>روند تمایل و نرخ اجرای تعهدات اخیر</span>
        </h3>
        
        {renderSVGChart()}
      </div>

      {/* Recharts Bar Chart Card */}
      <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl mb-6 shadow-md relative overflow-hidden text-right">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-2 select-none">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>تعداد اولویت‌های تکمیل‌شده در ۷ روز گذشته</span>
        </h3>

        <div className="h-44 w-full select-none" style={{ direction: "ltr" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rechartsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#64748B" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="#64748B" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
                domain={[0, 'maxData + 1']}
              />
              <Tooltip
                cursor={{ fill: '#2A2A35', opacity: 0.15 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#16161C] border border-[#2A2A35] p-3 rounded-xl text-right text-[10px] shadow-xl">
                        <p className="font-bold text-slate-100 mb-1">{data.label}</p>
                        <p className="text-emerald-400 font-bold mb-0.5">✓ تکمیل شده: {data.completed}</p>
                        <p className="text-slate-400 font-semibold">کل اولویت‌ها: {data.total}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="completed" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                barSize={16}
              >
                {rechartsData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completed > 0 ? "url(#emeraldGradient)" : "#2A2A35"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <svg width="0" height="0" className="hidden">
            <defs>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* RENDER REPORT OR GENERATOR BUTTON */}
      {generating ? (
        <div className="py-20 text-center bg-[#0F0F12] border border-[#2A2A35] rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#16161C] border border-[#2A2A35] flex items-center justify-center mb-4 relative">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <Sparkles className="w-4 h-4 text-yellow-400 absolute animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">کوشش برای تفکر فوق‌العاده عمیق...</h3>
          <p className="text-[11px] text-slate-500 max-w-xs mt-2 leading-relaxed">ما در حال استفاده از مدل نسل جدید <span className="font-mono text-cyan-400">gemini-3.1-pro-preview</span> با مکانیزم تفکر عمیق روان‌پزشکی هستیم. این کار ریشه‌های استرس، عادات، خودتخریبی و روندها را به فارسی تحلیل می‌کند و ممکن است تالیف آن ۳۰ الی ۴۵ ثانیه زمان ببرد.</p>
        </div>
      ) : !report ? (
        <div className="py-12 bg-[#1E1E28]/45 border border-[#2A2A35] border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center">
          <Activity className="w-10 h-10 text-slate-700 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-200">گزارش جامع فعالیتی صادر نشده است</h3>
          <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">برای استخراج الگوهای رفتاری خودتخریبی، تحلیل ریشه‌ای اهمال‌کاری و دریافت نسخه پزشک معالج، دکمه زیر را کلیک کنید.</p>
          
          <button
            type="button"
            onClick={triggerGenerateReport}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-500/10 hover:scale-[1.02] transition-all cursor-pointer font-bold"
          >
            تولید و تحلیل عمیق گزارش مربی
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Action indicator button to regenerate */}
          <div className="flex justify-end select-none">
            <button
              type="button"
              onClick={triggerGenerateReport}
              className="px-3 py-1.5 bg-[#1E1E28] hover:bg-[#16161C] border border-[#2A2A35] text-slate-400 rounded-full text-[10px] font-bold flex items-center gap-1.5 cursor-pointer select-none"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>به‌روزرسانی و واکاوی عمیق‌تر روی عادات جدید</span>
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-4 flex flex-col justify-between h-28 relative shadow-md">
              <span className="text-[9px] text-slate-500 font-bold block">تله بزرگ حواس‌پرتی</span>
              <p className="text-xs text-rose-300 font-bold leading-relaxed line-clamp-2 mt-2">{report.biggestDistraction}</p>
              <div className="absolute bottom-2 left-2 text-[9px] text-slate-600 font-mono">DISTRACTOR • 01</div>
            </div>

            <div className="bg-[#1E1E28] border border-[#2A2A35] rounded-2xl p-4 flex flex-col justify-between h-28 relative shadow-md">
              <span className="text-[9px] text-slate-500 font-bold block">احتمال دستیابی به هدف</span>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-1">٪{report.goalCompletionProbability}</p>
              <div className="absolute bottom-2 left-2 text-[9px] text-slate-600 font-mono">PROBABILITY • 02</div>
            </div>
          </div>

          {/* Most Common Procrastination Reason */}
          <div className="p-4 bg-[#0F0F12] border border-[#2A2A35] rounded-2xl">
            <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider mb-1.5">علت تکراری به تعویق انداختن اولویت‌ها</span>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
              <p className="text-xs text-rose-300 font-semibold">{report.mostCommonProcrastinationReason}</p>
            </div>
          </div>

          {/* Recommendations list */}
          <div className="p-4 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl">
            <h3 className="text-xs font-bold text-[#E2E8F0] mb-4 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              <span>توصیه‌های اضطراری روان‌شناختی بهینه</span>
            </h3>

            <div className="space-y-3">
              {report.personalizedRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-[#0F0F12] p-2.5 border border-[#2A2A35]/40 rounded-xl">
                  <div className="w-5 h-5 rounded-md bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center shrink-0 text-[10px] text-cyan-400 font-mono font-bold">
                    {i + 1}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Psychiatric Core Expertise */}
          <div className="p-5 bg-[#1E1E28] border border-[#2A2A35] rounded-2xl relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-xs font-bold text-cyan-400 mb-3 flex items-center gap-2 select-none">
              <BookOpen className="w-4.5 h-4.5 text-cyan-400" />
              <span>کالبدشکافی درمان تعلل و خودتخریبی شما</span>
            </h3>

            <p className="text-xs text-[#CBD5E1] leading-relaxed tracking-wide text-justify whitespace-pre-line font-semibold bg-[#0F0F12] p-4 border border-[#2A2A35]/60 rounded-xl">
              {report.fullPsychologicalExpertise}
            </p>
          </div>

          {/* Dynamic trend summary */}
          <div className="p-4 bg-[#0F0F12] rounded-xl border border-dashed border-[#2A2A35] text-center">
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-wider mb-1">خلاصه روند رفتاری صادر شده در مربی</span>
            <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">{report.productivityTrend}</p>
          </div>

        </div>
      )}
        </>
      ) : (
        <DnaDisplay profile={profile} />
      )}

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 text-rose-300 text-xs rounded-xl mt-4 leading-relaxed font-medium">
          {error}
        </div>
      )}

    </div>
  );
}
