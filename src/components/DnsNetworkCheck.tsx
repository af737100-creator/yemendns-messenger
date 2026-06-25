import React, { useState } from "react";
import { Shield, CheckCircle2, AlertCircle, RefreshCw, Server, Wifi, Globe, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";

export function DnsNetworkCheck() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const performCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const response = await fetch(getApiUrl("/api/dns-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error("خطأ في الاتصال بالبوابة الرئيسية");
      }
    } catch (e: any) {
      setResult({
        success: false,
        report: "فشل الاتصال بالبوابة الرئيسية لـ DNS. تأكد من إعدادات الخادم yemendns.zapto.org",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4.5">
        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          مستشعر وحماية توافق الـ DNS
        </h4>
        <span className="text-[9px] bg-slate-950 border border-slate-800 py-0.5 px-2 rounded-md font-mono text-emerald-400">
          PRO-CHECK
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-normal mb-4">
        تفحص هذه الأداة بشكل حي ومستمر توافق شبكة الاتصال المحلية (يمن موبايل، يو، يمن نت...) مع خوادم الـ DNS العالمية لضمان سلامة العبور والتراسل الفوري للبيانات المشفرة.
      </p>

      {/* Action Check button */}
      <button
        onClick={performCheck}
        disabled={checking}
        className="w-full bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-97 transition duration-305 cursor-pointer disabled:opacity-50"
      >
        {checking ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>جاري تحليل الشبكة وحزم الـ DNS...</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>بدء فحص توافقية شبكة الـ DNS</span>
          </>
        )}
      </button>

      {/* Results panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 space-y-3.5 border-t border-slate-800 pt-4"
          >
            {result.success ? (
              <>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-xl flex items-start gap-2.5 text-[11px] leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{result.report}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block mb-0.5">معدل التأخير (Latency):</span>
                    <span className="text-cyan-400 font-bold">{result.latencyMs} ms</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                    <span className="text-slate-500 block mb-0.5">الخادم النطاقي:</span>
                    <span className="text-slate-300 truncate block text-[9.5px]" title={result.domain}>{result.domain}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>خوادم الـ Resolver المفعلة بالشبكة:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                    {(result.activeResolvers || []).map((ip: string, i: number) => (
                      <span key={i} className="bg-slate-905 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[9.5px]">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono mb-1">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تكوين واستجابة TXT الأساسية:</span>
                  </div>
                  <span className="text-emerald-400 font-mono break-all">{result.txtConfig}</span>
                </div>
              </>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{result.report}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
