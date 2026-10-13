export const env = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/+$/, ""),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
