import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Loader2, FileText, Download, Save, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL, getImageUrl } from "../../config/api";
import { PageSkeleton as SkeletonLoader } from "../components/PageSkeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";

interface TranslationField {
  title: string;
}

interface TimetableItem {
  id: number;
  translations: {
    uz: TranslationField;
    ru?: TranslationField;
    en?: TranslationField;
    uz_cyrl?: TranslationField;
  };
  file: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function DarsJadvali() {
  const [timetables, setTimetables] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimetableItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"uz" | "ru">("uz");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    translations: {
      uz: { title: "" },
      ru: { title: "" },
    },
    file: null as File | string | null,
    sort_order: 0,
    is_active: true,
  });

  const languages = [
    { id: "uz", label: "O'zbekcha" },
    { id: "ru", label: "Русский" },
  ] as const;

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/dars-jadvali/`, { headers });
      if (response.ok) {
        const data = await response.json();
        const results = Array.isArray(data) ? data : data.results || [];
        setTimetables(results);
      } else {
        toast.error("Dars jadvallarini yuklashda xatolik");
      }
    } catch (error) {
      toast.error("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      translations: {
        uz: { title: "" },
        ru: { title: "" },
      },
      file: null,
      sort_order: timetables.length,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: TimetableItem) => {
    setEditingItem(item);
    setFormData({
      translations: {
        uz: item.translations?.uz || { title: "" },
        ru: item.translations?.ru || { title: "" },
      },
      file: item.file ? getImageUrl(item.file) : null,
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const token = sessionStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/dars-jadvali/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Dars jadvali o'chirildi");
        fetchTimetables();
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.detail || "O'chirishda xatolik yuz berdi");
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);

    const token = sessionStorage.getItem("auth_token");
    const data = new FormData();
    data.append("sort_order", String(formData.sort_order));
    data.append("is_active", formData.is_active ? "true" : "false");

    // Title fields for backend DarsJadvali model
    const uzTitle = formData.translations.uz.title || "Dars jadvali";
    const ruTitle = formData.translations.ru.title || uzTitle;
    data.append("title_uz", uzTitle);
    data.append("title_ru", ruTitle);
    data.append("title_en", uzTitle);
    data.append("title_uz_cyrl", uzTitle);

    if (formData.file instanceof File) {
      data.append("file", formData.file);
    }

    const uploadWithXHR = () => {
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let errMsg = "Server xatosi";
            try {
              const errorData = JSON.parse(xhr.responseText || "{}");
              errMsg = errorData.detail || JSON.stringify(errorData);
            } catch (_) {}
            reject(new Error(errMsg));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Tarmoq xatosi")));

        const url = editingItem
          ? `${API_BASE_URL}/dars-jadvali/${editingItem.id}/`
          : `${API_BASE_URL}/dars-jadvali/`;
        const method = editingItem ? "PATCH" : "POST";

        xhr.open(method, url);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(data);
      });
    };

    try {
      await uploadWithXHR();
      setUploadProgress(100);
      toast.success(editingItem ? "Dars jadvali tahrirlandi" : "Dars jadvali qo'shildi");
      setTimeout(() => {
        setIsModalOpen(false);
        setUploadProgress(0);
      }, 500);
      fetchTimetables();
    } catch (error: any) {
      toast.error(error.message || "Server bilan bog'lanishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = timetables.filter((t) => {
    const titleUz = t.translations?.uz?.title?.toLowerCase() || "";
    const titleRu = t.translations?.ru?.title?.toLowerCase() || "";
    const q = searchQuery.toLowerCase();
    return titleUz.includes(q) || titleRu.includes(q);
  });

  if (loading) {
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Dars jadvali</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Guruhlar va kurslar uchun dars jadvallarini boshqarish</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0d89b1] text-white font-bold rounded-lg hover:bg-[#0a6d8f] transition-all shadow-lg shadow-[#0d89b1]/20 active:scale-[0.98] w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Yangi jadval
        </button>
      </div>

      {/* Filter / Search */}
      <div className="bg-white dark:bg-[#1f2937] p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Jadval nomi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d89b1]"
          />
        </div>
      </div>

      {/* Grid of Timetables */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1f2937] rounded-lg border border-gray-100 dark:border-gray-800">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dars jadvali topilmadi</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yangi jadval qo'shish uchun yuqoridagi tugmani bosing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const title = item.translations?.uz?.title || item.translations?.ru?.title || "Dars jadvali";
            const fileUrl = item.file ? getImageUrl(item.file) : "";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#1f2937] rounded-xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 bg-[#0d89b1]/10 rounded-lg text-[#0d89b1]">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        item.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {item.is_active ? "Faol" : "Nofaol"}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-2">
                    {title}
                  </h3>

                  {item.translations?.ru?.title && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                      RU: {item.translations.ru.title}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d89b1] hover:underline"
                    >
                      <Download className="w-4 h-4" />
                      Faylni ko'rish
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Fayl yo'q</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-gray-500 hover:text-[#0d89b1] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Jadvalni o'chirishni tasdiqlaysizmi?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu amal ortga qaytarilmaydi. "{title}" dars jadvali butunlay o'chiriladi.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            O'chirish
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1f2937] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? "Dars jadvalini tahrirlash" : "Yangi dars jadvali qo'shish"}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setActiveTab(lang.id)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        activeTab === lang.id
                          ? "bg-white dark:bg-gray-700 text-[#0d89b1] shadow-sm"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                <h4 className="text-xs font-bold text-[#0d89b1] uppercase tracking-wider">
                  {languages.find((l) => l.id === activeTab)?.label} tilidagi ma'lumotlar
                </h4>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Jadval nomi ({activeTab.toUpperCase()}) {activeTab === "uz" && "*"}
                  </label>
                  <input
                    type="text"
                    value={
                      activeTab === "uz"
                        ? formData.translations.uz.title
                        : formData.translations.ru.title
                    }
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          [activeTab]: {
                            ...formData.translations[activeTab],
                            title: e.target.value,
                          },
                        },
                      });
                    }}
                    placeholder={`Masalan: 1-kurs aniq fanlar dars jadvali (${activeTab})`}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#0d89b1] outline-none text-sm"
                    required={activeTab === "uz"}
                  />
                </div>
              </div>

              {/* File and Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Jadval fayli (PDF, DOCX, XLSX) {!editingItem && "*"}
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="w-full text-xs md:text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs md:file:text-sm file:font-bold file:bg-[#0d89b1]/10 file:text-[#0d89b1] hover:file:bg-[#0d89b1]/20 cursor-pointer"
                    required={!editingItem}
                  />
                  {editingItem && editingItem.file && (
                    <p className="text-xs text-gray-500 mt-1">Joriy fayl saqlanadi agar yangisi tanlanmasa.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Tartib raqami
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active_cb"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded text-[#0d89b1] focus:ring-[#0d89b1]"
                    />
                    <label htmlFor="is_active_cb" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Saytda ko'rsatish (Faol)
                    </label>
                  </div>
                </div>
              </div>

              {isSubmitting && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-[#0d89b1]">
                    <span>Yuklanmoqda...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#0d89b1] rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#0d89b1] text-white font-bold rounded-lg hover:bg-[#0a6d8f] transition-all shadow-xl shadow-[#0d89b1]/20 active:scale-[0.98] disabled:opacity-50 text-sm"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
