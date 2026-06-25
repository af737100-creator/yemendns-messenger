import React, { useState } from "react";
import { User, Phone, Shield, FileText, CheckCircle2, Sparkles, Globe, Key } from "lucide-react";
import { motion } from "motion/react";
import { ChatUser } from "../types";

interface UserProfileProps {
  currentUser: { email: string; name: string; phone_number?: string; bio?: string };
  onUpdateProfile: (name: string, phone_number: string, bio: string) => void;
}

export function UserProfile({ currentUser, onUpdateProfile }: UserProfileProps) {
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone_number || "");
  const [bio, setBio] = useState(currentUser?.bio || "متصل حالياً عبر نفق DNS آمن.");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name, phone, bio);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden" dir="rtl">
      {/* Glow Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_200px_200px_at_15%_15%,rgba(6,182,212,0.06),transparent)] pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shadow-cyan-500/10">
            {(name || "").substring(0, 1).toUpperCase() || "?"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
              <span>الملف الشخصي والترميز</span>
              <Sparkles className="w-4.5 h-4.5 text-amber-400" />
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        <div className="bg-slate-950 py-1.5 px-3.5 rounded-xl border border-slate-800/80 flex items-center gap-2 text-xs text-cyan-300 font-mono">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>توجيه المفتاح النطاقي: Active v2.1</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl flex items-center gap-2 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>تم حفظ معلومات الملف الشخصي ومزامنتها مع قاعدة البيانت بنجاح!</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nickname input */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-cyan-400" />
              <span>الاسم أو اللقب</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ذو البأس اليماني"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 px-4 rounded-xl focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans text-right"
              required
            />
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-cyan-400" />
              <span>رقم الهاتف (لمراسلتك المباشرة)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: +967 777 777 777"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 px-4 rounded-xl focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono text-right"
            />
          </div>
        </div>

        {/* User description / Bio */}
        <div className="space-y-1.5 text-right">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>الحالة ووصف التراسل (Bio)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="مثال: أراسل عبر الـ DNS والاتصال المجاني الآمن."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-sm py-2.5 px-4 rounded-xl focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all font-sans text-right resize-none"
          />
        </div>

        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-1.5">
          <div className="font-bold text-slate-300 flex items-center gap-1.5 mb-1">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>نظام الحماية المدمج لتخزين المراسلات</span>
          </div>
          <p>
            حسابك مسجل ومرتبط ببوابة <strong className="text-cyan-400 font-mono">yemendns.zapto.org</strong>. عند قيام أي شخص بالبحث عن بريدك الإلكتروني أو رقم هاتفك لإضافتك، سيقوم النظام بمطابقتك مباشرة لتمكين اتصال الـ DNS فورا وبدون تأخير.
          </p>
        </div>

        <button
          type="submit"
          className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-8 rounded-xl text-xs transition duration-300 shadow-md cursor-pointer text-center"
        >
          حفظ وتحديث معلومات الملف الشخصي
        </button>
      </form>
    </div>
  );
}
