const backendUrl = process.env.FYAG_BACKEND_URL?.trim();
const rewrites = [
  { source: "/login", destination: "/index.html" },
  { source: "/acceso", destination: "/index.html" },
  { source: "/app/:path*", destination: "/index.html" },
];

if (backendUrl) {
  const backend = new URL(backendUrl);
  if (backend.protocol !== "https:" || backend.username || backend.password ||
      backend.pathname !== "/" || backend.search || backend.hash) {
    throw new Error("FYAG_BACKEND_URL debe ser una URL HTTPS base, sin ruta ni credenciales.");
  }
  rewrites.unshift({ source: "/api/:path*", destination: `${backend.origin}/api/:path*` });
}

export const config = { framework: "vite", rewrites };
