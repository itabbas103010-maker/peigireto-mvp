import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialize Gemini API to handle missing keys gracefully
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Clean JSON response Helper to handle possible markdown wrapper syntax
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?/i, "");
    cleaned = cleaned.replace(/```$/, "");
    cleaned = cleaned.trim();
  }
  return cleaned;
}

// Memory store for SMS OTP codes (PhoneNumber -> { code, expiresAt })
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// API: Send SMS OTP via Meli Payamak REST API
app.post("/api/auth/otp/send", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return res.status(400).json({ error: "شماره موبایل وارد شده معتبر نیست." });
    }

    // Sanitize and validate Iranian phone formats (e.g. 09121234567 or +989121234567 or 9121234567)
    let sanitizedPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (sanitizedPhone.startsWith("+98")) {
      sanitizedPhone = "0" + sanitizedPhone.slice(3);
    } else if (sanitizedPhone.startsWith("98") && sanitizedPhone.length === 12) {
      sanitizedPhone = "0" + sanitizedPhone.slice(2);
    } else if (sanitizedPhone.length === 10 && !sanitizedPhone.startsWith("0")) {
      sanitizedPhone = "0" + sanitizedPhone;
    }

    if (!/^09\d{9}$/.test(sanitizedPhone)) {
      return res.status(400).json({ error: "لطفاً شماره موبایل ۱۱ رقمی معتبر لایو (مانند 09123456789) وارد کنید." });
    }

    // Generate a secure 5-digit numerical verification code
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes expiration

    otpStore.set(sanitizedPhone, { code: otpCode, expiresAt });

    const username = process.env.MELIPAYAMAK_USERNAME;
    const password = process.env.MELIPAYAMAK_PASSWORD;
    const bodyId = process.env.MELIPAYAMAK_OTP_BODY_ID;
    const fromNumber = process.env.MELIPAYAMAK_FROM_NUMBER;

    console.log(`[OTP] Generated code ${otpCode} for ${sanitizedPhone}`);

    // If Melipayamak credentials are not configured, use the safe testing pipeline
    if (!username || !password || username === "your_username_here") {
      return res.json({
        success: true,
        simulated: true,
        code: otpCode,
        message: "حالت تست: جزئیات سامانه ملی پیامک وارد نشده است. کد تأیید شما صادر شد."
      });
    }

    // Connect to external Meli Payamak SMS gateway
    try {
      let meliResponse;
      if (bodyId) {
        // Fast Pattern-based web API delivery
        const payload = {
          username,
          password,
          text: otpCode,
          to: sanitizedPhone,
          bodyId: parseInt(bodyId, 10)
        };
        console.log("[OTP] Sending pattern SMS via Meli Payamak...", payload);
        const resObj = await fetch("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        meliResponse = await resObj.json();
      } else {
        // Regular standard SMS delivery
        const payload = {
          username,
          password,
          text: `کد تایید ورود به پیگیرتو (Peigireto):\n${otpCode}`,
          to: sanitizedPhone,
          from: fromNumber || "50001"
        };
        console.log("[OTP] Sending standard SMS via Meli Payamak...", payload);
        const resObj = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        meliResponse = await resObj.json();
      }

      console.log("[OTP] Meli Payamak API Response:", meliResponse);
      return res.json({
        success: true,
        message: "کد تأیید با موفقیت ارسال شد."
      });
    } catch (smsErr: any) {
      console.error("[OTP] Failed to request Meli Payamak service:", smsErr);
      // Fail gracefully to simulation mode so preview is never blocked
      return res.json({
        success: true,
        simulated: true,
        code: otpCode,
        message: `خطای سامانه پیامک (${smsErr.message || "اتصال"}). کد تست تولید شد.`
      });
    }

  } catch (err: any) {
    console.error("OTP Send error:", err);
    res.status(505).json({ error: "خطا در پردازش درخواست ارسال پیامک" });
  }
});

// API: Verify OTP SMS Code
app.post("/api/auth/otp/verify", (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: "شماره موبایل و کد ورود الزامی است." });
    }

    let sanitizedPhone = phoneNumber.trim().replace(/\s+/g, "");
    if (sanitizedPhone.startsWith("+98")) {
      sanitizedPhone = "0" + sanitizedPhone.slice(3);
    } else if (sanitizedPhone.startsWith("98") && sanitizedPhone.length === 12) {
      sanitizedPhone = "0" + sanitizedPhone.slice(2);
    } else if (sanitizedPhone.length === 10 && !sanitizedPhone.startsWith("0")) {
      sanitizedPhone = "0" + sanitizedPhone;
    }

    const savedRecord = otpStore.get(sanitizedPhone);
    if (!savedRecord) {
      return res.status(400).json({ error: "کد تأیید صادر نشده یا منقضی شده است. مجدداً تلاش کنید." });
    }

    if (Date.now() > savedRecord.expiresAt) {
      otpStore.delete(sanitizedPhone);
      return res.status(400).json({ error: "کد تأیید شما منقضی شده است. لطفا مجددا درخواست دهید (۳ دقیقه)." });
    }

    if (savedRecord.code !== code.trim()) {
      return res.status(400).json({ error: "کد تأیید وارد شده اشتباه است." });
    }

    // Clear verification session post-auth
    otpStore.delete(sanitizedPhone);

    res.json({ success: true, message: "شماره موبایل با موفقیت تایید شد." });
  } catch (err: any) {
    console.error("OTP Verify error:", err);
    res.status(500).json({ error: "خطایی از سمت سرور رخ داد" });
  }
});

// 1. API: Analyze Onboarding responses to build "Productivity DNA"
app.post("/api/onboard", async (req, res) => {
  try {
    const ai = getAI();
    const { goal, why, failConsequence, distractions, procrastinationCauses, peakEnergyTime, dailyHours } = req.body;

    const prompt = `
تو مربی اول روانشناسی و تغییر رفتار هستی. بر اساس پاسخ‌های کاربر در شروع برنامه، یک "شناسنامه رفتارگرایی نهایی" و "دی‌ان‌ای بهره‌وری" برایش ایجاد کن. اطلاعات کاربر:
هدف ۹۰ روزه: ${goal || "ثبت نشده"}
علت اهمیت هدف: ${why || "ثبت نشده"}
پیامدهای شکست و انجام ندادن: ${failConsequence || "ثبت نشده"}
بزرگترینعوامل حواس‌پرتی: ${distractions || "ثبت نشده"}
علت معمول اهمال‌کاری: ${procrastinationCauses || "ثبت نشده"}
بهترین زمان انرژی در طول روز: ${peakEnergyTime || "ثبت نشده"}
ساعات کار واقع‌بینانه در روز: ${dailyHours || "ثبت نشده"}

پاسخ را در ساختار JSON استاندارد با فیلدهای زیر برگردان. تمام متن‌ها باید به فارسی روان، عمیق و بر اساس اصول کتاب خرده‌عادت‌ها (Atomic Habits) باشند:
{
  "procrastinationType": "نوع دقیق اهمال‌کاری با توصیف فارسی جذاب",
  "motivationStyle": "سبک انگیزش و محرک اصلی کاربر",
  "bestFocusHours": "تحلیل بهترین ساعات تمرکز طلایی کاربر",
  "attentionSpan": "بازه زمانی پیشنهادی برای یادگیری/کار متمرکز (مثلاً ۲۵ یا ۵۰ دقیقه)",
  "distractionTriggers": "لیست تحلیل ریشه‌ای محرک‌های انحراف ذهنی او",
  "consistencyScore":Score as single number between 40 and 75 representing initial estimated score,
  "profileAnalysis": "یک تحلیل شخصیتی فوق‌العاده صمیمانه و روان‌شناختی به فارسی درباره شیوه غلبه این فرد بر عادات بد."
}
پاسخ فقط و فقط حاوی کدهای JSON معتبر باشد و هیچ متنی قبل یا بعد از آن فرستاده نشود.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error: any) {
    console.error("Onboard Error:", error);
    res.status(500).json({ error: error.message || "خطای سرور" });
  }
});

// 2. API: Coach Chat - Interactive conversation and active interventions
app.post("/api/coach/chat", async (req, res) => {
  try {
    const ai = getAI();
    const { history, profile, personality, checkInType, priorityTasks, customAction } = req.body;

    // Build system instructions based on chosen personality and profile
    let personalityStylePrompt = "";
    if (personality === "Commander") {
      personalityStylePrompt = `
تو مربی با نام مستعار "فرمانده (Commander)" هستی:
- بسیار قاطع، جدی، مستقیم و متمرکز بر مسئولیت‌پذیری بالا.
- بهانه‌ها را به هیچ وجه نمی‌پذیری.
- جملات کوتاه، کوبنده، اثرگذار و با لحن محکم و مقتدرانه می‌گویی.
- کاربر را وادار می‌کنی که فوراً وارد عمل شود. به او بگو که برنامه‌ریزی کافی است و باید همین الان اقدام کند!
`;
    } else if (personality === "Mentor") {
      personalityStylePrompt = `
تو مربی با نام مستعار "مرشد و مربی (Mentor)" هستی:
- تحلیلی، استراتژیک، دانا، با‌تجربه و صبور.
- ریشه اهمال‌کاری را از منظر روان‌شناختی تحلیل می‌کنی.
- راهکارهای عمیق، علمی و گام‌به‌گام برای شکستن کارهای بزرگ به بخش‌های کوچک ارائه می‌دهی.
- با لحنی وزین، حکیمانه و حمایتی صحبت می‌کنی.
`;
    } else {
      // Default to Friend
      personalityStylePrompt = `
تو مربی با نام مستعار "رفیق صمیمی (Friend)" هستی:
- بسیار انگیزه‌دهنده، دوست‌داشتنی، تاییدکننده و سرشار از انرژی مثبت و تشویق.
- با لحنی کاملاً دوستانه، دلسوزانه و صمیمی صحبت می‌کنی.
- به کاربر یادآوری می‌کنی که جاده تغییر سخت است، اما تو در کنارش هستی و به تواناهایی‌های او ایمان داری.
`;
    }

    const goal = profile?.goal || "هدف ۹۰ روزه";
    const userWhy = profile?.why || "علت اهمیت هدف";
    const userFail = profile?.failConsequence || "پیامد عدم دستیابی";
    
    const userDna = profile ? `
- نوع اهمال کاری: ${profile.procrastinationType}
- مانع اصلی: ${profile.procrastinationCauses}
- علت اهمیت هدف (چرا): ${userWhy}
- عواقب شکست (پیامد عدم دستیابی): ${userFail}
` : "در حال بارگذاری";

    let contextPrompt = `
تو سیستم هوش مصنوعی "پیگیرتو" (Peigireto) مربی شخصی، روان‌شناختی، هوشمند مسئولیت‌پذیری و غلبه بر اهمال‌کاری (پاسخ‌دهی پیوسته) برای کاربران ایرانی هستی.
شعار و ماموریت تو این است: "نمیذاریم از قولی که به خودت دادی فرار کنی." (We don't let people escape the promises they make to themselves.)

قوانین بسیار مهم لحن مربی:
۱. تو باید با کاربر همواره به صورت مفرد («تو»، «کردی»، «بگو»، «برات» به جای «شما») صحبت کنی.
۲. صمیمیت تو نباید شکل لاتی یا لوده مثل «رفیق»، «داداش»، «رفقا» بگیرد. تو یک مربی کاملاً علمی، جدی، دلسوز، مقتدر و متخصص روان‌شناسی رفتار هستی که مستقیماً مغز کاربر را کالبدشکافی می‌کند. 
۳. برای رفتارهای او مثال‌های علمی عصب‌شناسی و روان‌شناسی بزن؛ مثلاً بگو: «مغز تو وقتی با حجم کار زیاد مواجه میشه، واکنش فرار و اجتناب نشون میده و قفل می‌کنه تا با کارهای فرعی مثل اینستاگرام به آرامش موقت برسه.» یا «کورتکس پیش‌پیشانی تو وقتی خسته میشه، سیستم لیمبیک کنترل تصمیم‌گیری‌هات رو به عهده می‌گیره.»

زبان تو باید ۱۰۰٪ فارسی روان، بااقتدار، عمیق، روان‌شناختی و تأثیرگذار باشد و از کلمات انگلیسی بپرهیزی.
تمام اعداد را به خط یا عدد فارسی بنویس. خود را مربی جدی، پیگیر و دلسوز واقعی نشان بده.

مشخصات کاربر:
- هدف ۹۰ روزه کاربر: ${goal}
- علت اصلی اهمیت هدف (چرا): ${userWhy}
- پیامدهای دردناک شکست یا نرسیدن: ${userFail}
- دی‌ان‌ای بهره‌وری یا شناسنامه رفتاری کاربر: ${userDna}

${personalityStylePrompt}

قوانین طلایی مربی پیگیرتو:
1. در تعاملات روزانه روی "اقدام و عمل" به شدت تمرکز کن. بهانه‌تراشی و تفکر طولانی را محترم اما بی‌نتیجه بدان.
2. با توجه به حافظه هوشمندت، به طور گاه‌وبیگاه و هدفمند به کاربر یادآوری کن: "تو به من گفتی این هدف برات مهمه چون [علت اهمیت هدف (چرا)]..." یا "خودت گفتی اگه به این هدف نرسی [عواقب شکست (پیامد عدم دستیابی)] رخ میده..." تا انگیزه عمیق درونی‌اش مجدداً فایر شود.
3. اگر کاربر تمایل به فرار از کار داشت یا دکمه "فرار از کار" فعال شده باشد، صریح و دلسوزانه مربی‌گری کن و بگو:
"تو تنبل نیستی.
تو داری از این کار فرار می‌کنی.
بیا دلیل واقعی اون رو پیدا کنیم."
سپس او را راهنمایی کن کار را به یک گام بسیار کوچک (کارت در ۵ دقیقه اول) خرد و متوقف کند.
4. در بررسی صبحگاهی (Morning Check-in) کاربر حداکثر ۱ تا ۳ اولویت مجاز است اعلام کند. بیش از آن ذهن را گیج کرده و تله پنهان اهمال‌کاری است.
`;

    if (checkInType === "morning") {
      contextPrompt += "\nالان بررسی صبحگاهی (Morning Check-in) است. از کاربر بخواه که مهم‌ترین کار و اولویت‌های امروز را مشخص کند. یادآوری کن که تمرکز روی عمل است.";
    } else if (checkInType === "midday") {
      contextPrompt += `
الان بررسی نیم‌روزی (Midday Check-in) است. از او بپرس: "آیا کار را شروع کردی؟"
اگر شروع نکرده، علت روان‌شناختی آن را ریشه‌یابی کن (مثل: ترس از شکست، کمال‌گرایی، خستگی، ابهام، حواس‌پرتی). متناسب با آن راهکارهای زیر ۵ دقیقه‌ای عملی و بسیار سریع بده.
`;
    } else if (checkInType === "evening") {
      contextPrompt += "\nالان بررسی عصرگاهی (Evening Check-in) است. از او بپرس: 'آیا انجامش دادی؟' اگر گفت نه، بپرس 'چه چیزی مانعت شد؟' و علت را به یکی از این موارد بخش‌بندی کن: ترس (Fear)، کمال‌گرایی (Perfectionism)، خستگی (Fatigue)، حواس‌پرتی (Distraction)، ابهام (Ambiguity). سپس یک گام کوچک برای فردا توصیه کن.";
    } else if (checkInType === "confession") {
      contextPrompt += "\nاین بخش 'اعتراف شبانه (Night Confession)' است. بپرس: 'چرا امروز کاری که به خودت قول داده بودی رو کامل انجام ندادی؟' اجازه بده کاربر اعتراف کند تا پیگیرتو او را تحلیل روان‌شناختی کند و پیامد شکستش را به او یادآوری کند تا فردا طوفانی شروع نماید.";
    }

    if (customAction === "escape") {
      contextPrompt += `
کاربر سیستم فرار از کار را فعال کرده است. تو باید به عنوان مربی پیگیرتو این متن دقیق فارسی را بفرستی:
"تو تنبل نیستی.
تو داری از این کار فرار می‌کنی.
بیا دلیل واقعی اون رو پیدا کنیم."
سپس یک راهکار زنده برای غلبه بر این توجیه یا سد روانی بده.
`;
    }

    // Call Gemini to generate message
    const formattedContents: any[] = [];
    
    // Add system instructions
    formattedContents.push({ role: "user", parts: [{ text: contextPrompt }] });
    formattedContents.push({ role: "model", parts: [{ text: `متوجه شدم. من مربی پاسخگویی "پیگیرتو (Peigireto)" با شخصیت انتخاب شده هستم و با لحن عمیق و صمیمی روانشناختی با کاربر گفتگو می‌کنم.` }] });

    // Append conversation history
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      });
    }

    // Append the last message which may not be in history yet, or if history contains everything.
    const lastMsg = history && history.length > 0 ? history[history.length - 1] : null;
    
    // Fallback if empty history
    if (formattedContents.length <= 2) {
      formattedContents.push({ role: "user", parts: [{ text: "سلام مربی، من آماده‌ام." }] });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: formattedContents,
    });

    res.json({ text: response.text || "متاسفانه پاسخی دریافت نشد." });

  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error.message || "خطای سرور در ارتباط با مربی" });
  }
});

// 3. API: Generate 30-Day Analysis Report using Thinking Level HIGH (gemini-3.1-pro-preview)
app.post("/api/coach/report", async (req, res) => {
  try {
    const ai = getAI();
    const { history, profile, dailyLogs } = req.body;

    const dataPrompt = `
تو تحلیل‌گر ارشد روانشناسی اهمال‌کاری و مربی مجهز به هوش مصنوعی مقتدر هستی. بر اساس تاریخچه کامل فعالیت‌ها و گزارش‌های روزانه کاربر، گزارش ۳۰ روزه پیشرفت و شخصیت‌شناسی بهره‌وری او را تولید کن.

اطلاعات بهره‌وری کاربر:
- هدف ۹۰ روزه: ${profile?.goal || "نامعلوم"}
- علت اهمیت: ${profile?.why || "نامعلوم"}
- پیامد شکست: ${profile?.failConsequence || "نامعلوم"}
- خروجی شناسنامه اولیه (دی‌ان‌ای بهره‌وری):
  ${JSON.stringify(profile || {})}

سیاهه ورود روزانه کاربر (logs) شامل ارزیابی‌های موفقیت، حواس‌پرتی‌ها، ساعات شروع و اعترافات شبانه:
${JSON.stringify(dailyLogs || [])}

یک گزارش فارسی فوق‌العاده دقیق، روان‌شناختی و کاربردی بساز. تمام جملات باید به فارسی روان و با کلاس بالا نوشته شوند.
بدون ذکر هیچ کلمه انگلیسی در گزارش، خروجی را دقیقاً در ساختار JSON زیر قالب‌بندی کن:
{
  "bestFocusHours": "بهترین ساعات واقعی تمرکز کاربر برپایه تحلیل روزها",
  "biggestDistraction": "بزرگترین عامل حواسپ‌رتی کشف‌شده و راه‌کار قطع آن",
  "mostCommonProcrastinationReason": "شایع‌ترین دلیل اهمال‌کاری او (کمال‌گرایی، ترس، ابهام و...)",
  "motivationProfile": "تحلیل سبک محرک بقا یا پیشرفت او",
  "consistencyScore":Score out of 100 representing dynamic consistency,
  "productivityTrend": "توصیف روند کلی افت و صعود او در این دوره زمان‌بندی",
  "goalCompletionProbability": "درصد احتمال تکمیل هدف ۹۰ روزه به صورت عدد مابین زمان کنونی با توجه به رفتارها (مثلاً 68)",
  "personalizedRecommendations": [
    "توصیه اول بسیار کاربردی و متناسب با چالش ریشه‌ای",
    "توصیه دوم بر اساسAtomic Habits",
    "توصیه سوم برای شروع اولین گام فردا"
  ],
  "fullPsychologicalExpertise": "یک تحلیل روان‌پزشکی عمیق و شفابخش در ۳ تا ۴ پاراگراف فارسی درباره الگوهای خودتخریبی و درمان اهمال‌کاری این کاربر خاص."
}

خروجی باید فقط و فقط کدهای JSON معتبر باشد و متنی خارج از JSON ارسال نشود.
`;

    // Changed model to gemini-3.1-flash-lite to bypass resource limitations on pro models under standard free keys
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: dataPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error: any) {
    console.error("Report Generation Error:", error);
    res.status(500).json({ error: error.message || "خطای سرور در تولید گزارش عمیق" });
  }
});

// Bootstrap server and handle Vite middleware asynchronously to bypass CJS top-level await limits
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Peigireto full-stack server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.log("Failed to start Peigireto server:", err);
});
