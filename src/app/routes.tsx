import { createBrowserRouter, useRouteError } from "react-router";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Yangiliklar from "./pages/Yangiliklar";
import Elonlar from "./pages/Elonlar";
import Oqituvchilar from "./pages/Oqituvchilar";
import Rahbariyat from "./pages/Rahbariyat";
import Kafedralar from "./pages/Kafedralar";
import Savollar from "./pages/Savollar";
import Galereya from "./pages/Galereya";
import AlbomRasmlari from "./pages/AlbomRasmlari";
import Videolar from "./pages/Videolar";
import Slayderlar from "./pages/Slayderlar";
import Statistika from "./pages/Statistika";
import Qabul from "./pages/Qabul";
import Xabarlar from "./pages/Xabarlar";
import Sozlamalar from "./pages/Sozlamalar";
import DarsJadvali from "./pages/DarsJadvali";

function RouteErrorBoundary() {
  const error: any = useRouteError();
  console.error("Admin route error:", error);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
          Xatolik yuz berdi
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">
          Sahifani yuklashda xatolik yuz berdi. Iltimos, sahifani yangilang.
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
      { index: true, Component: Dashboard },
      { path: "yangiliklar", Component: Yangiliklar },
      { path: "elonlar", Component: Elonlar },
      { path: "oqituvchilar", Component: Oqituvchilar },
      { path: "rahbariyat", Component: Rahbariyat },
      { path: "kafedralar", Component: Kafedralar },
      { path: "savollar", Component: Savollar },
      { path: "galereya", Component: Galereya },
      { path: "galereya/:slug", Component: AlbomRasmlari },
      { path: "videolar", Component: Videolar },
      { path: "slayderlar", Component: Slayderlar },
      { path: "statistika", Component: Statistika },
      { path: "qabul", Component: Qabul },
      { path: "xabarlar", Component: Xabarlar },
      { path: "sozlamalar", Component: Sozlamalar },
      { path: "dars-jadvali", Component: DarsJadvali },
    ],
  },
]);
