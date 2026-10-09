import { createBrowserRouter, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import { useEffect } from "react";

function safeLazy<T>(importer: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      return await importer();
    } catch (err: any) {
      const msg = err?.message || String(err || "");
      if (
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("error loading dynamically imported module") ||
        msg.includes("Importing a module script failed")
      ) {
        const key = "admin_chunk_reload_timestamp";
        const last = sessionStorage.getItem(key);
        const now = Date.now();
        if (!last || now - parseInt(last, 10) > 10000) {
          sessionStorage.setItem(key, now.toString());
          window.location.reload();
          return new Promise(() => {}) as unknown as T;
        }
      }
      throw err;
    }
  };
}

function RouteErrorBoundary() {
  const error: any = useRouteError();
  const msg = error?.message || String(error || "");
  const isChunkError =
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Importing a module script failed");

  useEffect(() => {
    if (isChunkError) {
      const key = "admin_chunk_reload_timestamp";
      const last = sessionStorage.getItem(key);
      const now = Date.now();
      if (!last || now - parseInt(last, 10) > 10000) {
        sessionStorage.setItem(key, now.toString());
        window.location.reload();
      }
    }
  }, [isChunkError]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
          {isChunkError ? "Tizim yangilandi" : "Xatolik yuz berdi"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">
          {isChunkError
            ? "Yangi versiya yuklanmoqda, iltimos kuting..."
            : "Sahifani yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-[#0d89b1] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#0b7396] transition-all shadow-lg"
        >
          Sahifani yangilash
        </button>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      { index: true, lazy: safeLazy(async () => ({ Component: (await import("./pages/Dashboard")).default })) },
      { path: "yangiliklar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Yangiliklar")).default })) },
      { path: "elonlar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Elonlar")).default })) },
      { path: "oqituvchilar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Oqituvchilar")).default })) },
      { path: "rahbariyat", lazy: safeLazy(async () => ({ Component: (await import("./pages/Rahbariyat")).default })) },
      { path: "kafedralar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Kafedralar")).default })) },
      { path: "savollar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Savollar")).default })) },
      { path: "galereya", lazy: safeLazy(async () => ({ Component: (await import("./pages/Galereya")).default })) },
      { path: "galereya/:slug", lazy: safeLazy(async () => ({ Component: (await import("./pages/AlbomRasmlari")).default })) },
      { path: "videolar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Videolar")).default })) },
      { path: "slayderlar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Slayderlar")).default })) },
      { path: "statistika", lazy: safeLazy(async () => ({ Component: (await import("./pages/Statistika")).default })) },
      { path: "qabul", lazy: safeLazy(async () => ({ Component: (await import("./pages/Qabul")).default })) },
      { path: "xabarlar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Xabarlar")).default })) },
      { path: "sozlamalar", lazy: safeLazy(async () => ({ Component: (await import("./pages/Sozlamalar")).default })) },
      { path: "dars-jadvali", lazy: safeLazy(async () => ({ Component: (await import("./pages/DarsJadvali")).default })) },
    ],
  },
]);
