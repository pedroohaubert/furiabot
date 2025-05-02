'use client';

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Home() {
  const { isAuthenticated, user, isLoading, logout } = useAuth(); // Import logout
  const [mounted, setMounted] = useState(false);

  // Este efeito garante que a hidratação esteja completa antes de renderizar conteúdo dependente de autenticação
  useEffect(() => {
    setMounted(true);
  }, []);

  // Não mostra conteúdo dependente de autenticação até a hidratação estar completa
  if (!mounted) {
    return null;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <div className="flex flex-col items-center text-center space-y-4">
          <Image
            src="/furia.png"
            alt="FuriaBotSuperFã3000"
            width={180}
            height={38}
            priority
          />
          
          <h1 className="text-3xl font-bold">Bem-vindo ao <br /> FuriaBotSuperFã3000</h1>
          
          {isLoading ? (
            <p>Carregando...</p>
          ) : isAuthenticated ? (
            <div className="space-y-6">
              <p className="text-xl">
                Olá, <span className="font-bold">{user?.username}</span>
              </p>
              <div className="flex flex-col items-center justify-center sm:flex-row gap-4">
                <Button asChild>
                  <Link href="/chat">Começar a conversar</Link>
                </Button>
                {/* Add Logout Button */}
                <Button variant="outline" onClick={logout}> 
                  Sair
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p>Por favor, faça login ou registre-se para poder conversar.</p>
              <div className="flex flex-col items-center justify-center sm:flex-row gap-4">
                <Button asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">Registrar</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-sm text-gray-500">
        <p>© 2025 Furia Bot. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
