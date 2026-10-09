import { createRoot } from "react-dom/client";
import App from "./app/App";
import { AuthProvider } from "./app/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import "./styles/index.css";

// Auto-reload on deployment chunk update
if (typeof window !== "undefined") {
  const reloadOnChunkError = () => {
    const key = "admin_chunk_reload_timestamp";
    const last = sessionStorage.getItem(key);
    const now = Date.now();
    if (!last || now - parseInt(last, 10) > 10000) {
      sessionStorage.setItem(key, now.toString());
      window.location.reload();
    }
  };

  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnChunkError();
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason?.message || String(e.reason || "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("error loading dynamically imported module") ||
      msg.includes("Importing a module script failed")
    ) {
      e.preventDefault();
      reloadOnChunkError();
    }
  });

  window.addEventListener("error", (e) => {
    const msg = e.message || "";
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("error loading dynamically imported module") ||
      msg.includes("Importing a module script failed")
    ) {
      e.preventDefault();
      reloadOnChunkError();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </HelmetProvider>
);