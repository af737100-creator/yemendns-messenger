import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2, ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public props!: Readonly<Props>;
  public state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorMsg: ""
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message || "حدث خطأ غير متوقع في واجهة التطبيق" };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Android WebView Error Caught:", error, errorInfo);
  }

  private handleSelfHealAndRestart = () => {
    try {
      // Clear potentially corrupted session storage or stale tokens
      localStorage.removeItem("auth_token");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage during recovery:", e);
    }
    window.location.reload();
  };

  private handleFullReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-right" dir="rtl">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 space-x-reverse text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">نظام التصليح الذاتي (Self-Healing)</h2>
                <p className="text-xs text-red-300/80">تم رصد تعثر في واجهة التطبيق</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono text-xs text-red-400 break-all">
              {this.state.errorMsg}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              لا تقلق، قام نظام الحماية بعزل الخطأ لمنع الانهيار الكامل. يمكنك محاولة الإصلاح التلقائي وإعادة التشغيل.
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleSelfHealAndRestart}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                إصلاح تلقائي وإعادة تشغيل
              </button>

              <button
                onClick={this.handleFullReset}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-normal text-xs flex items-center justify-center gap-2 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                إعادة ضبط الذاكرة المؤقتة بالكامل
              </button>
            </div>

            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>نظام الحماية المدمج لتطبيقات أندرويد النشطة</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
