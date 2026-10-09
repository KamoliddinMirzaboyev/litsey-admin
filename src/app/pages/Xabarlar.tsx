import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Mail, MessageSquare, Search, Trash2, CheckCircle2, 
  Clock, Eye, Reply, Send, AlertCircle, RefreshCw, Filter
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "../../config/api";
import { PageSkeleton as SkeletonLoader } from "../components/PageSkeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

interface ContactMessageItem {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  subject: string;
  subject_display?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  status_display?: string;
  reply?: string;
  created_at: string;
}

export default function Xabarlar() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let url = `${API_BASE_URL}/messages/`;
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        setMessages(results);
      } else {
        toast.error("Xabarlarni yuklashda xatolik");
      }
    } catch (error) {
      toast.error("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (msg: ContactMessageItem) => {
    setSelectedMessage(msg);
    setReplyText(msg.reply || "");

    // Mark as read if status is 'new'
    if (msg.status === "new") {
      try {
        const token = sessionStorage.getItem("auth_token");
        await fetch(`${API_BASE_URL}/messages/${msg.id}/status/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "read" }),
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status: "read" } : m))
        );
      } catch (_) {}
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setIsReplying(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/messages/${selectedMessage.id}/reply/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: replyText }),
      });
      if (response.ok) {
        toast.success("Javob saqlandi");
        setSelectedMessage({ ...selectedMessage, reply: replyText, status: "replied" });
        fetchMessages();
      } else {
        toast.error("Javob yuborishda xatolik");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/messages/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Xabar o'chirildi");
        if (selectedMessage?.id === id) setSelectedMessage(null);
        fetchMessages();
      } else {
        toast.error("O'chirishda xatolik yuz berdi");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Yangi</span>;
      case "read":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">O'qilgan</span>;
      case "replied":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Javob berilgan</span>;
      case "archived":
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Arxiv</span>;
      default:
        return null;
    }
  };

  if (loading && messages.length === 0) {
    return <SkeletonLoader type="grid" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#1f2937] p-5 md:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Foydalanuvchilar xabarlari</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sayt orqali kelib tushgan murojaatlar va savollar</p>
        </div>
        <button
          onClick={fetchMessages}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Yangilash
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-[#1f2937] p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, email yoki telefon bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d89b1]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d89b1]"
          >
            <option value="all">Barcha holatlar</option>
            <option value="new">Yangi</option>
            <option value="read">O'qilgan</option>
            <option value="replied">Javob berilgan</option>
            <option value="archived">Arxivlangan</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#1f2937] rounded-lg border border-gray-100 dark:border-gray-800">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Xabarlar topilmadi</h3>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleOpenDetail(msg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedMessage?.id === msg.id
                    ? "border-[#0d89b1] bg-[#0d89b1]/5 dark:bg-[#0d89b1]/10"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f2937] hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                    {msg.full_name}
                  </h4>
                  {getStatusBadge(msg.status)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                  {msg.message}
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{msg.phone}</span>
                  <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Detail Card */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6 shadow-sm">
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedMessage.full_name}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    <span>Email: <a href={`mailto:${selectedMessage.email}`} className="text-[#0d89b1] hover:underline">{selectedMessage.email}</a></span>
                    <span>•</span>
                    <span>Tel: <a href={`tel:${selectedMessage.phone}`} className="text-[#0d89b1] hover:underline">{selectedMessage.phone}</a></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedMessage.status)}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xabarni o'chirish</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ushbu xabar butunlay o'chiriladi. Rozimisiz?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(selectedMessage.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          O'chirish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Message text */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Xabar matni:</h4>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Reply section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Reply className="w-4 h-4" />
                  Administrator javobi:
                </h4>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Xabarga javob yozing..."
                  rows={4}
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-[#0d89b1] outline-none resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSendReply}
                    disabled={isReplying || !replyText.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#0d89b1] text-white font-bold rounded-lg hover:bg-[#0a6d8f] transition-all disabled:opacity-50 text-sm shadow-md shadow-[#0d89b1]/20"
                  >
                    <Send className="w-4 h-4" />
                    {isReplying ? "Saqlanmoqda..." : "Javobni saqlash"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-[#1f2937] rounded-xl border border-gray-100 dark:border-gray-800">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">Tafsilotlarni ko'rish uchun chap tomondan xabarni tanlang</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
