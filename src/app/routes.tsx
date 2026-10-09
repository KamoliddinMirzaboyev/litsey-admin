import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, lazy: async () => ({ Component: (await import("./pages/Dashboard")).default }) },
      { path: "yangiliklar", lazy: async () => ({ Component: (await import("./pages/Yangiliklar")).default }) },
      { path: "elonlar", lazy: async () => ({ Component: (await import("./pages/Elonlar")).default }) },
      { path: "oqituvchilar", lazy: async () => ({ Component: (await import("./pages/Oqituvchilar")).default }) },
      { path: "rahbariyat", lazy: async () => ({ Component: (await import("./pages/Rahbariyat")).default }) },
      { path: "kafedralar", lazy: async () => ({ Component: (await import("./pages/Kafedralar")).default }) },
      { path: "savollar", lazy: async () => ({ Component: (await import("./pages/Savollar")).default }) },
      { path: "galereya", lazy: async () => ({ Component: (await import("./pages/Galereya")).default }) },
      { path: "galereya/:slug", lazy: async () => ({ Component: (await import("./pages/AlbomRasmlari")).default }) },
      { path: "videolar", lazy: async () => ({ Component: (await import("./pages/Videolar")).default }) },
      { path: "slayderlar", lazy: async () => ({ Component: (await import("./pages/Slayderlar")).default }) },
      { path: "statistika", lazy: async () => ({ Component: (await import("./pages/Statistika")).default }) },
      { path: "qabul", lazy: async () => ({ Component: (await import("./pages/Qabul")).default }) },
      { path: "xabarlar", lazy: async () => ({ Component: (await import("./pages/Xabarlar")).default }) },
      { path: "sozlamalar", lazy: async () => ({ Component: (await import("./pages/Sozlamalar")).default }) },
      { path: "dars-jadvali", lazy: async () => ({ Component: (await import("./pages/DarsJadvali")).default }) },
    ],
  },
]);
