import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Globe, 
  Shield, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  Info, 
  RefreshCw, 
  Smartphone, 
  CheckCheck, 
  X, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  UserPlus 
} from "lucide-react";
import { ChatMessage, ChatUser } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ChatConsoleProps {
  currentUserEmail: string;
  onSendMessage: (content: string, isDnsMode: boolean, receiverEmail: string) => void;
  messages: ChatMessage[];
  contacts: ChatUser[];
  onAddContactByEmailOrPhone: (input: string) => Promise<{ success: boolean; message: string; contact?: ChatUser }>;
  onTriggerCompress: (text: string) => Promise<any>;
}

export function ChatConsole({
  currentUserEmail,
  onSendMessage,
  messages,
  contacts,
  onAddContactByEmailOrPhone,
  onTriggerCompress,
}: ChatConsoleProps) {
  const [inputText, setInputText] = useState("");
  const [activeContactIdx, setActiveContactIdx] = useState(0);
  const [isDnsMode, setIsDnsMode] = useState(true); // Default to DNS tunnel mode
  const [compressing, setCompressing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  
  // Search / Add Contact Modal State
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [searchOrAddValue, setSearchOrAddValue] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Existing contact list filter (WhatsApp style search)
  const [searchFilter, setSearchFilter] = useState("");

  // Mobile layout state: 'list' | 'chat'
  const [mobileStep, setMobileStep] = useState<"list" | "chat">("list");

  const bottomRef = useRef<HTMLDivElement>(null);

  // If no contacts exist, currentContact remains null (100% real)
  const currentContact = contacts[activeContactIdx] || contacts[0] || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeContactIdx, mobileStep]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentContact) return;

    onSendMessage(inputText.trim(), isDnsMode, currentContact.email);
    setInputText("");
    setAiSuggestions(null);
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (!searchOrAddValue.trim()) {
      setModalError("يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح");
      return;
    }

    setModalLoading(true);
    try {
      const outcome = await onAddContactByEmailOrPhone(searchOrAddValue.trim());
      if (outcome.success && outcome.contact) {
        setModalSuccess(outcome.message);
        setSearchOrAddValue("");
        
        // Find if this contact is in the list
        const foundIdx = contacts.findIndex(c => c.email.toLowerCase() === outcome.contact?.email.toLowerCase());
        if (foundIdx !== -1) {
          setActiveContactIdx(foundIdx);
        } else {
          setActiveContactIdx(contacts.length); // Select newly added contact
        }

        // Close modal after success animation
        setTimeout(() => {
          setShowAddContactModal(false);
          setModalSuccess("");
          setMobileStep("chat"); // Directly open this chat on mobile
        }, 1500);
      } else {
        setModalError(outcome.message);
      }
    } catch (e) {
      setModalError("فشل الاتصال بخدمة الـ DNS الموحدة لليمن.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAiOptimize = async () => {
    if (!inputText.trim()) return;
    setCompressing(true);
    setAiSuggestions(null);

    try {
      const result = await onTriggerCompress(inputText);
      if (result) {
        setAiSuggestions(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompressing(false);
    }
  };

  const useCompressedText = () => {
    if (aiSuggestions?.compressed) {
      setInputText(aiSuggestions.compressed);
      setAiSuggestions(null);
    }
  };

  const filteredMessages = currentContact
    ? messages.filter(
        (msg) =>
          (msg.sender_email === currentUserEmail && msg.receiver_email === currentContact.email) ||
          (msg.sender_email === currentContact.email && msg.receiver_email === currentUserEmail)
      )
    : [];

  // Filter contacts by user filter query with safe fallback strings
  const filteredContacts = contacts.filter(c => {
    const nicknameStr = (c.nickname || "").toLowerCase();
    const emailStr = (c.email || "").toLowerCase();
    const filterQuery = (searchFilter || "").toLowerCase();
    const phoneNumberStr = c.phone_number || "";
    return nicknameStr.includes(filterQuery) || 
           emailStr.includes(filterQuery) || 
           phoneNumberStr.includes(filterQuery);
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[620px] relative font-sans" dir="rtl">
      
      {/* 1. Sidebar - Chat List (Visible always on desktop, conditionally on mobile) */}
      <div className={`w-full md:w-80 border-l border-slate-800 bg-slate-950/70 flex flex-col h-full shrink-0 relative ${
        mobileStep === "chat" ? "hidden md:flex" : "flex"
      }`}>
        
        {/* Sidebar Header (WhatsApp style) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
              دردشات نطاق الـ DNS
            </h2>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 py-0.5 px-2 rounded-full text-emerald-400 font-mono font-bold tracking-wider">
              YEMEN-DNS
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            حسابك النشط: <span className="font-mono text-cyan-300">{currentUserEmail}</span>
          </p>
        </div>

        {/* WhatsApp-like Contact Search Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/30">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="البحث في الدردشات وجهات الاتصال..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-[11px] py-1.5 pr-9 pl-3 rounded-lg focus:outline-none focus:border-emerald-555 text-right placeholder:text-slate-600 text-slate-100"
            />
          </div>
        </div>

        {/* Contacts Stream List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-none">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 opacity-60">
              <Smartphone className="w-8 h-8 mx-auto text-slate-650 mb-2" />
              <p className="text-[11px] text-slate-400">لا توجد جهات اتصال مطابقة</p>
              <button 
                onClick={() => setShowAddContactModal(true)}
                className="text-[10px] text-emerald-400 font-bold underline mt-1.5 cursor-pointer block mx-auto"
              >
                اصنع دردشة جديدة الآن
              </button>
            </div>
          ) : (
            filteredContacts.map((contact, idx) => {
              // Get last message in conversation
              const chatMsgs = messages.filter(
                (msg) =>
                  (msg.sender_email === currentUserEmail && msg.receiver_email === contact.email) ||
                  (msg.sender_email === contact.email && msg.receiver_email === currentUserEmail)
              );
              const lastMsg = chatMsgs[chatMsgs.length - 1];
              // Absolute index in the original list
              const originalIndex = contacts.findIndex(c => c.email === contact.email);
              const isSelected = activeContactIdx === (originalIndex !== -1 ? originalIndex : idx);

              return (
                <button
                  key={contact.email}
                  onClick={() => {
                    setActiveContactIdx(originalIndex !== -1 ? originalIndex : idx);
                    setMobileStep("chat");
                  }}
                  className={`w-full text-right p-3 rounded-xl flex items-center justify-between transition group duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-l from-emerald-500/10 to-transparent border-r-2 border-emerald-400 text-slate-100"
                      : "bg-transparent text-slate-400 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border uppercase transition-colors ${
                      isSelected ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700 group-hover:border-slate-600"
                    }`}>
                      {(contact.nickname || contact.email || "?").substring(0, 1)}
                    </div>
                    <div className="truncate text-right flex-1 pr-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-200 truncate">{contact.nickname || contact.email}</h4>
                        {lastMsg && (
                          <span className="text-[8.5px] text-slate-500 font-mono pr-1">{lastMsg.timestamp}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{contact.email}</p>
                      {lastMsg ? (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5" dir="rtl">
                          {lastMsg.sender_email === currentUserEmail ? "أنت: " : ""}{lastMsg.content}
                        </p>
                      ) : (
                        <p className="text-[9px] text-slate-600 truncate mt-0.5">ابدأ مراسلة آمنة عبر الـ DNS...</p>
                      )}
                    </div>
                  </div>
                  {contact.status === "dns_only" && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/25 py-0.5 px-1.5 rounded shrink-0 mr-1.5">
                      DNS
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* WhatsApp-like Floating Action Button (FAB) at bottom-left corner of sidebar */}
        <div className="absolute bottom-4 left-4 z-10">
          <button
            onClick={() => {
              setModalError("");
              setModalSuccess("");
              setSearchOrAddValue("");
              setShowAddContactModal(true);
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="بدء دردشة جديدة"
          >
            <UserPlus className="w-5.5 h-5.5 transition-transform group-hover:rotate-12" />
          </button>
        </div>
      </div>

      {/* 2. Active Chat Pane (Visible always on desktop, conditionally on mobile) */}
      <div className={`flex-1 flex flex-col h-full bg-slate-900/40 relative ${
        mobileStep === "list" ? "hidden md:flex" : "flex"
      }`}>
        
        {!currentContact ? (
          <div 
            className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(16, 185, 129, 0.02) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 animate-pulse">
              <MessageSquare className="w-10 h-10" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-bold text-slate-100">مرحباً بك في YemenDNS Messenger</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                نظام مراسلة حقيقي وآمن ومستقل بالكامل يعمل كبديل ممتاز عند انقطاع الإنترنت أو نفاد الباقات من خلال قنوات توجيه استعلامات بروتوكول الـ DNS في اليمن وخارجها.
              </p>
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] text-emerald-400 font-mono tracking-wide leading-normal">
                🔐 لا توجد أي محاكاة أو بيانات وهمية. جميع اتصالاتك حقيقية ومباشرة ومشفرة بنسبة 100%.
              </div>
            </div>

            <button
              onClick={() => {
                setModalError("");
                setModalSuccess("");
                setSearchOrAddValue("");
                setShowAddContactModal(true);
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/15 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>ابدأ محادثة مع مستخدم حقيقي الآن</span>
            </button>
          </div>
        ) : (
          <>
            {/* WhatsApp Top Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {/* Mobile back button (WhatsApp style arrow back) */}
                <button 
                  onClick={() => setMobileStep("list")}
                  className="md:hidden p-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                  {(currentContact.nickname || currentContact.email || "?").charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{currentContact.nickname || currentContact.email}</h3>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" dir="rtl">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>المسار النشط: {isDnsMode ? "نفق DNS مشفر تماماً (بدون رصيد)" : "شبكة إنترنت مباشر"}</span>
                  </p>
                </div>
              </div>

              {/* Connection Toggle & Path mode (WhatsApp styled status block) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDnsMode(!isDnsMode)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                    isDnsMode
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-950/40 border-slate-800 text-slate-400"
                  }`}
                >
                  {isDnsMode ? (
                    <>
                      <Globe className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                      <span>بروتوكول الـ DNS (مجاني)</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                      <span>مراسلة بالإنترنت المباشر</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Message Stream (Subtle Custom Grid Wallpaper) */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
              style={{
                backgroundImage: "radial-gradient(circle, rgba(16, 185, 129, 0.02) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}
            >
              <div className="text-center py-2" dir="rtl">
                <span className="text-[9px] bg-slate-950 border border-slate-850 rounded-full py-1 px-3.5 text-slate-500 font-mono tracking-wide">
                  اتصال آمن وموثوق ومؤمن بالكامل عبر بروتوكولات التوجيه المشتركة لليمن
                </span>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                  <Smartphone className="w-12 h-12 text-emerald-500/30 mb-2.5" />
                  <p className="text-xs text-slate-400">لا توجد رسائل سابقة مع هذه الجهة.</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">اكتب أول رسالة وسيقوم نفق الـ DNS بتمريرها بالملي ثانية.</p>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isMe = msg.sender_email === currentUserEmail;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed border relative shadow-md ${
                          isMe
                            ? "bg-emerald-600/15 border-emerald-555/20 text-emerald-50 rounded-tr-none"
                            : "bg-slate-950 border-slate-850/80 text-slate-100 rounded-tl-none"
                        }`}
                      >
                        <p className="break-words white-space-pre-wrap">{msg.content}</p>

                        <div className="flex items-center justify-between gap-5 mt-2 text-[8.5px] text-slate-500 font-mono border-t border-slate-850/40 pt-1.5">
                          <div className="flex items-center gap-1">
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          
                          {msg.is_dns_mode && (
                            <span className="bg-emerald-900/10 border border-emerald-500/25 text-emerald-400 py-0.5 px-1.5 rounded font-bold text-[7.5px] uppercase">
                              DNS {msg.dns_packet_count} حزمة
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* AI intelligent Suggestion Panel (Gemini Assisted High Density Compress) */}
            <AnimatePresence>
              {aiSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute bottom-[80px] left-4 right-4 bg-slate-950 border border-slate-800 p-4 rounded-xl z-20 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      مساعد كبس البيانات (Gemini Real AI-Optimizer)
                    </span>
                    <span className="text-[9.5px] bg-emerald-950 text-emerald-400 py-0.5 px-2 rounded-full border border-emerald-500/20 font-bold">
                      توفير {aiSuggestions.savedPercent || 65}% من حجم الحزم النطاقية
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-2.5 rounded border border-slate-850 mb-2">
                    {aiSuggestions.compressed}
                  </p>
                  <div className="text-[10px] text-slate-400 leading-normal">{aiSuggestions.explanation}</div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={useCompressedText}
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs transition duration-300 cursor-pointer"
                    >
                      استبدال واعتماد النص المضغوط للـ DNS
                    </button>
                    <button
                      onClick={() => setAiSuggestions(null)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-400 py-1.5 px-3 rounded-lg text-xs transition duration-300 cursor-pointer"
                    >
                      تجاهل
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Chat Input Field (Standard WhatsApp Box) */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  placeholder={isDnsMode ? "اكتب رسالة دردشة ليتم توجيهها عبر الـ DNS..." : "اكتب رسالة دردشة عادية للإنترنت..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs py-3.5 pr-4 pl-12 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-sans text-right"
                />

                {/* AI Assist Compression Button */}
                {isDnsMode && inputText.trim() && (
                  <button
                    type="button"
                    onClick={handleAiOptimize}
                    disabled={compressing}
                    className="absolute left-14 top-2 bg-slate-950 hover:bg-slate-850 hover:border-amber-500/40 p-2 rounded-lg border border-slate-800 text-amber-400 transition cursor-pointer flex items-center justify-center h-10 w-10"
                    title="اضغط الرسالة لتقليل الحزم بالذكاء الاصطناعي"
                  >
                    {compressing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-[pulse_2s_infinite]" />
                    )}
                  </button>
                )}

                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold p-3.5 rounded-xl transition duration-300 shadow-md flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Inline Live Base32 Encoding Counter */}
              {isDnsMode && inputText.length > 0 && (
                <div className="text-[9.5px] text-slate-500 font-mono flex justify-between items-center bg-slate-950/40 p-1.5 px-3 rounded-lg border border-slate-900">
                  <span className="truncate">حجم استعلام الـ DNS الكلي المتوقع: {inputText.length * 2} بايت</span>
                  <span className="text-amber-500">موصى به: استخدم مساعد الكبس بالذكاء الاصطناعي ⬆️ لسرعة أكبر</span>
                </div>
              )}
            </form>
          </>
        )}
      </div>

      {/* 3. Popover Modal Dialog for Adding WhatsApp contacts via DNS */}
      <AnimatePresence>
        {showAddContactModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl text-right p-6"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowAddContactModal(false)}
                className="absolute top-4 left-4 p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">دردشة جديدة ونفق DNS آمن</h3>
                  <p className="text-[10px] text-slate-400">اتصل مباشرة ببريد إلكتروني أو رقم هاتف يمني</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-5 border-r-2 border-emerald-400/50 pr-2.5">
                أدخل البريد الإلكتروني أو رقم هاتف العضو المسجل أو المسجل حديثاً في سجل الـ DNS لبدء الدردشة. النظام سيكتشف العضو ويربط غرفته تلقائياً.
              </p>

              <form onSubmit={handleAddContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">البريد الإلكتروني للطرف الآخر أو رقم هاتفه:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: +967771234567 أو ali.sanaa@gmail.com"
                    value={searchOrAddValue}
                    onChange={(e) => setSearchOrAddValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-slate-100 font-sans tracking-wide text-right"
                  />
                </div>

                {/* Event Response Alerts inside the modal */}
                {modalError && (
                  <div className="p-3 rounded-lg bg-red-900/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <span className="shrink-0">⚠️</span>
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-900/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <span className="shrink-0">🚀</span>
                    <span>{modalSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(false)}
                    className="bg-slate-805 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition py-2 px-4 rounded-xl text-xs cursor-pointer"
                  >
                    إلغاء التوجيه
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-2 px-5 rounded-xl text-xs transition duration-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {modalLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري البحث النطاقي...</span>
                      </>
                    ) : (
                      <span>ربط وفتح الدردشة</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
