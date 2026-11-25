// src/components/Header.tsx
import ThemeToggle from "@/components/ThemeToggle"; // Asegúrate de tener este componente creado
import { useAppStore } from "@/store/useAppStore";

export default function Header() {
  const usuario = useAppStore((s) => s.usuario);
  const logout = useAppStore((s) => s.logout);

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b bg-background">
      <h1 className="font-bold text-lg">FYAG</h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {usuario && (
          <>
            <span className="text-sm text-muted-foreground">
              {usuario.nombre} ({usuario.rol})
            </span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">
              Salir
            </button>
          </>
        )}
      </div>
    </header>
  );
}