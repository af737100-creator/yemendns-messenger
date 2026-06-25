import React, { useState } from "react";
import { Mail, Lock, Shield, User, Globe, AlertCircle, Sparkles, Smartphone, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl, getBaseDnsServerUrl, setBaseDnsServerUrl, DEFAULT_DNS_SERVER_URL } from "../utils/api";

interface AuthScreenProps {
  onLogin: (email: string, name: string, fullUser?: any) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // Add optional phone input for WhatsApp authenticity
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(getBaseDnsServerUrl());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("الرجاء إدخال البريد الإلكتروني");
      return;
    }
    if (!password || password.length < 6) {
      setError("الرجاء إدخال كلمة مرور من 6 أحرف على الأقل");
      return;
    }
    if (isRegister && !name) {
      setError("الرجاء إدخال الاسم الشخصي");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Save manually edited server URL if there is any, and sanitize state
      setBaseDnsServerUrl(serverUrl);
      const sanitizedUrl = getBaseDnsServerUrl();
      setServerUrl(sanitizedUrl);

      const endpoint = getApiUrl(isRegister ? "/api/auth/register" : "/api/auth/login");
      const payload = isRegister 
        ? { email, name, password, phone } 
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.user.email, data.user.nickname, data.user);
      } else {
        setError(data.error || "خطأ غير متوقع أثناء معالجة الطلب.");
      }
    } catch (e) {
      setError("فشل الاتصال بالخادم الرئيسي لقاعدة بيانات الـ DNS المشتركة لليمن.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background cyber graphic elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]" />
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Futuristic Gateway Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Glow Top Border Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Connection Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-4 right-4 text-slate-500 hover:text-cyan-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
          title="إعدادات الاتصال بالخادم"
          type="button"
        >
          <Settings className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4 animate-[pulse_3s_infinite]">
            <Globe className="w-9 h-9 text-slate-950" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-normal text-white glow-text">
            YemenDNS Messenger
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            PROTOCOL SECURE V2.1 // OFFLINE BYPASS
          </p>
          <div className="mt-2 bg-slate-950/60 py-1 px-3 rounded-full border border-slate-800 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 tracking-wider">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            نصف قطري مشفر عبر خوادم DNS الدولية
          </div>
        </div>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 overflow-hidden text-right"
              dir="rtl"
            >
              <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 justify-end">
                <span>إعدادات بوابة الاتصال بالخادم الرئيسي</span>
                <Settings className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                إذا كنت تستخدم تطبيق أندرويد وترى خطأ اتصال، يرجى التحقق من رابط خادم الاتصال أدناه أو تعديله يدويًا للربط المباشر:
              </p>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 block">رابط خادم DNS الرئيسي (API URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={serverUrl}
                  onChange={(e) => {
                    setServerUrl(e.target.value);
                    setBaseDnsServerUrl(e.target.value);
                  }}
                  onBlur={() => {
                    setBaseDnsServerUrl(serverUrl);
                    setServerUrl(getBaseDnsServerUrl());
                  }}
                  className="w-full bg-slate-900 border border-slate-850 text-slate-200 text-xs py-2 px-3 rounded-lg focus:border-cyan-500 focus:outline-none transition-all font-mono text-left"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setServerUrl(DEFAULT_DNS_SERVER_URL);
                  setBaseDnsServerUrl(DEFAULT_DNS_SERVER_URL);
                }}
                className="text-[10px] text-emerald-400 hover:underline font-semibold block mr-auto"
              >
                إعادة التعيين للرابط الافتراضي
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2 text-right"
              dir="rtl"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {isRegister && (
            <>
              <div className="space-y-1.5" dir="rtl">
                <label className="text-xs font-semibold text-slate-400">الاسم والكنية (اللقب)</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="محمد الصنعاني"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 pr-11 pl-4 rounded-xl focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/20 text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5" dir="rtl">
                <label className="text-xs font-semibold text-slate-400">رقم الهاتف (اختياري)</label>
                <div className="relative">
                  <Smartphone className="absolute right-3.5 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="مثال: +967771234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 pr-11 pl-4 rounded-xl focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/20 text-right font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5" dir="rtl">
            <label className="text-xs font-semibold text-slate-400">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                placeholder="sdxdxa56@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 pr-11 pl-4 rounded-xl focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/20 text-right font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5" dir="rtl">
            <label className="text-xs font-semibold text-slate-400">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 pr-11 pl-4 rounded-xl focus:border-cyan-500 focus:outline-none transition-all placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/20 text-right font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-300 shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>{isRegister ? "إنشاء حساب ومزامنة" : "تسجيل الدخول الآمن"}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-800 pt-4">
          {isRegister ? (
            <p>
              لديك حساب بالفعل؟{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-cyan-400 hover:underline font-semibold"
              >
                سجل دخولك هنا
              </button>
            </p>
          ) : (
            <p>
              ليس لديك حساب؟{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-emerald-400 hover:underline font-semibold"
              >
                إنشاء حساب جديد الآن
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
