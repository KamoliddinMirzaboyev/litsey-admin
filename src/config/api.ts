export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://api.fdtu1al.uz"
).replace(/\/+$/, "");

export const getImageUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Ensure the path starts with /
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${formattedPath}`;
};
