import React, { useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { ChatConsole } from "./components/ChatConsole";
import { DnsNetworkCheck } from "./components/DnsNetworkCheck";
import { DeployDashboard } from "./components/DeployDashboard";
import { Globe, Shield, Terminal, Settings, MessageSquare, Compass, LogOut, CheckCircle2, Cloud, Sparkles } from "lucide-react";
import { ChatMessage, ChatUser, DNSLog } from "./types";
import { UserProfile } from "./components/UserProfile";
import { motion, AnimatePresence } from "motion/react";
import { triggerDnsTunnel } from "./utils/dns";
import { getApiUrl } from "./utils/api";
import { App as CapacitorApp } from "@capacitor/app";

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; phone_number?: string; bio?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "profile" | "deploy">("chat");
  const [contacts, setContacts] = useState<ChatUser[]>([]);

  // Capacitor Android Hardware Back Button Protection
  React.useEffect(() => {
    let listenerHandle: any = null;
    const setupAndroidBackHandler = async () => {
      try {
        listenerHandle = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            // Prevent accidental app exit by going to chat tab first if in another tab
            setActiveTab(prev => {
              if (prev !== "chat") return "chat";
              return prev;
            });
          }
        });
      } catch (e) {
        // Not running in mobile Capacitor environment
      }
    };
    setupAndroidBackHandler();
    return () => {
      if (listenerHandle && typeof listenerHandle.remove === "function") {
        listenerHandle.remove();
      }
    };
  }, []);

  const [dnsLogs, setDnsLogs] = useState<DNSLog[]>([
    {
      id: "1",
      timestamp: "15:00:03",
      query_type: "RAW",
      domain: "dns-resolver.yemendns.zapto.org",
      bytes_transferred: 32,
      direction: "RX",
      status: "SUCCESS",
      payload: "Initial handshake successfully established with Yemen-USA DNS Bridge.",
    }
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Auto-sync current user and pull contacts & messages on login
  React.useEffect(() => {
    if (!currentUser) return;

    // 1. Sync & register user profile in the database
    fetch(getApiUrl("/api/users/profile"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone_number || "",
        bio: currentUser.bio || "متصل حالياً عبر نفق DNS آمن."
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        // Match state representation with phone number if any
        setCurrentUser({
          email: data.user.email,
          name: data.user.nickname || data.user.name,
          phone_number: data.user.phone_number || data.user.phone,
          bio: data.user.bio
        });
      }
    })
    .catch(err => {
      console.warn("Failed to sync user profile:", err);
    });

    // 2. Fetch contacts
    fetchContacts();

    // 3. Keep pulling messages periodically
    fetchMessages();
    const timer = setInterval(() => {
      fetchMessages();
    }, 4500);

    return () => clearInterval(timer);
  }, [currentUser?.email]);

  const fetchContacts = () => {
    if (!currentUser) return;
    fetch(getApiUrl(`/api/contacts?exclude=${encodeURIComponent(currentUser.email)}`))
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setContacts(data.contacts);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch contacts:", err);
      });
  };

  const fetchMessages = () => {
    if (!currentUser) return;
    // We can pull all messages for simplicity, and filter client-side, or pull by pairs
    fetch(getApiUrl(`/api/contacts?exclude=${encodeURIComponent(currentUser.email)}`))
      .then(res => res.json())
      .then(contactData => {
        if (contactData.success) {
          const peers = contactData.contacts;
          // Fetch messages for each peer or simply fetch all logs
          Promise.all(
            peers.map((peer: any) =>
              fetch(getApiUrl(`/api/messages?sender=${encodeURIComponent(currentUser.email)}&receiver=${encodeURIComponent(peer.email)}`))
                .then(res => {
                  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                  return res.json();
                })
                .then(m => m.success ? m.messages : [])
                .catch(err => {
                  console.warn(`Failed to fetch messages for peer ${peer.email}:`, err);
                  return [];
                })
            )
          )
          .then((results) => {
            const flattened = results.flat() as ChatMessage[];
            // Sort by Date/Time
            setMessages(flattened);
          })
          .catch(err => {
            console.warn("Failed resolving all message promises:", err);
          });
        }
      })
      .catch(err => {
        console.warn("Failed fetching contacts for messages:", err);
      });
  };

  const handleLogin = (email: string, name: string, fullUserData?: any) => {
    if (fullUserData) {
      setCurrentUser({
        email: fullUserData.email,
        name: fullUserData.nickname || fullUserData.name || name,
        phone_number: fullUserData.phone_number || fullUserData.phone,
        bio: fullUserData.bio
      });
    } else {
      setCurrentUser({ email, name });
    }
  };

  const handleUpdateProfile = async (name: string, phone_number: string, bio: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(getApiUrl("/api/users/profile"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser.email,
          name,
          phone: phone_number,
          bio
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentUser({
            email: data.user.email,
            name: data.user.nickname || data.user.name,
            phone_number: data.user.phone_number || data.user.phone,
            bio: data.user.bio
          });
        }
      }
    } catch (e) {
      console.error("Failed to update profile", e);
    }
  };

  const handleAddContactByEmailOrPhone = async (input: string) => {
    if (!currentUser) return { success: false, message: "يجب تسجيل الدخول أولاً" };

    try {
      const response = await fetch(getApiUrl("/api/users/search"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          activeUserEmail: currentUser.email
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Re-fetch contact list
          fetchContacts();
          return {
            success: true,
            message: `تم العثور على العضو "${data.user.nickname}" بقاعدة البيانات وربطه بنجاح.`,
            contact: data.user
          };
        } else {
          return { success: false, message: data.error || "لم يتم العثور على العضو المطلوبة بنظام تسجيل الـ DNS" };
        }
      }
      return { success: false, message: "خطأ في الاتصال بالشبكة" };
    } catch (e) {
      return { success: false, message: "خطأ غير متوقع أثناء معالجة الطلب" };
    }
  };

  const handleSendMessage = (content: string, isDnsMode: boolean, receiverEmail: string) => {
    if (!currentUser) return;

    let packetsCount = Math.ceil(content.length / 32);
    let mainSubdomain = `msg-${Math.floor(100 + Math.random() * 900)}-${packetsCount}.yemendns.zapto.org`;

    if (isDnsMode) {
      const outcome = triggerDnsTunnel(currentUser.email, receiverEmail, content, (log) => {
        setDnsLogs((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            query_type: log.type as any,
            domain: log.domain,
            bytes_transferred: log.bytes,
            direction: "TX",
            status: "SUCCESS",
            payload: log.info,
          }
        ]);
      });
      packetsCount = outcome.packets;
      mainSubdomain = `${outcome.messageId}.yemendns.zapto.org`;
    }

    // Persist sent message to real server backend database
    fetch(getApiUrl("/api/messages/send"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: currentUser.email,
        receiver: receiverEmail,
        content,
        isDnsMode,
        packets: packetsCount,
        subdomain: isDnsMode ? mainSubdomain : undefined
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
      }
    })
    .catch(err => {
      console.warn("Failed sending message to backend:", err);
    });

    if (isDnsMode) {
      setDnsLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          query_type: "TXT",
          domain: mainSubdomain,
          bytes_transferred: content.length,
          direction: "TX",
          status: "SUCCESS",
          payload: `تم إرسال الرسالة بنجاح عبر ${packetsCount} حزم DNS مشفرة تماماً. جاري استقبالها وفك تشفيرها وتخزينها في Supabase.`,
        }
      ]);
    }
  };

  const triggerCompress = async (text: string) => {
    try {
      const response = await fetch(getApiUrl("/api/dns-compress"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.error("DNS compression trigger error:", e);
      return null;
    }
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Cyber Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/10">
              <Globe className="w-5.5 h-5.5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-normal glow-text text-white">YemenDNS Platform</h1>
              <p className="text-[9px] text-slate-400 font-mono">ENCRYPTED INTER-DOMAIN PROTOCOL</p>
            </div>
          </div>

          {/* Connected Server info / Quick indicators */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-850 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-[10px]">الخادم الرئيسي: <strong className="text-cyan-400">yemendns.zapto.org</strong></span>
            </div>
          </div>

          {/* User info & Logout */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-200">{currentUser.name}</div>
              <div className="text-[9px] text-slate-500 font-mono tracking-wide">{currentUser.email}</div>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              title="خروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Console Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar Card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5 pr-1">القائمة الرئيسية</h3>
            
            <nav className="space-y-1.5">
              <button
                onClick={() => setActiveTab("chat")}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-gradient-to-r from-cyan-500/10 to-transparent border-r-2 border-cyan-400 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span>لوحة الدردشة الفورية</span>
                </span>
                <span className="text-[10px] bg-slate-950 border border-slate-850 py-0.5 px-1.5 rounded-full font-mono text-cyan-400">
                  LIVE
                </span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-cyan-500/10 to-transparent border-r-2 border-cyan-400 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Terminal className="w-4.5 h-4.5" />
                  <span>ملفي الشخصي والترميز</span>
                </span>
                <span className="text-[10px] bg-slate-950 border border-slate-850 py-0.5 px-1.5 rounded-full font-mono text-amber-400">
                  ME
                </span>
              </button>

              <button
                onClick={() => setActiveTab("deploy")}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                  activeTab === "deploy"
                    ? "bg-gradient-to-r from-cyan-500/10 to-transparent border-r-2 border-cyan-400 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="w-4.5 h-4.5" />
                  <span>النشر الفوري والتخزين</span>
                </span>
                <span className="text-[10px] bg-slate-950 border border-slate-850 py-0.5 px-1.5 rounded-full font-mono text-emerald-400">
                  AUTO
                </span>
              </button>
            </nav>
          </div>

          {/* Real Live Local Network DNS Resolver Check Panel */}
          <DnsNetworkCheck />

          {/* Secure DNS Shield Info details */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 mb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              لماذا نراسل عبر الـ DNS؟
            </h4>
            <p className="text-[11px] text-slate-400 leading-normal mb-2.5">
              عند نفاد رصيد باقة الـ 4G أو الإنترنت، يظل بروتوكول طلب النطاقات DNS مفتوحاً ومجانياً عادة. يقوم تطبيقنا بتحويل رسالتك إلى أكواد Base32 ويطلبها كحل تكنولوجي متطور ومقاوم للفلترة للوصول لأي مكان في العالم.
            </p>
            <div className="text-[10px] text-slate-500 font-mono tracking-tight flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" />
              <span>Domain: yemendns.zapto.org</span>
            </div>
          </div>
        </div>

        {/* Dynamic Center Work Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === "chat" && (
              <motion.div
                key="chat_tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <ChatConsole
                  currentUserEmail={currentUser.email}
                  onSendMessage={handleSendMessage}
                  messages={messages}
                  contacts={contacts}
                  onAddContactByEmailOrPhone={handleAddContactByEmailOrPhone}
                  onTriggerCompress={triggerCompress}
                />
              </motion.div>
            )}

            {activeTab === "profile" && (
              <motion.div
                key="profile_tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <UserProfile
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                />
              </motion.div>
            )}

            {activeTab === "deploy" && (
              <motion.div
                key="deploy_tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <DeployDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Bottom Footer Info */}
      <footer className="bg-slate-900 border-t border-slate-850 p-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          <span>YEMENDNS INTEGRATED NETWORK GATEWAY SECURITIES CO // © 2026</span>
          <span className="text-[10px] text-cyan-400/80">Developed for sdxdxa56 — High Tech bypass messaging router</span>
        </div>
      </footer>
    </div>
  );
}
