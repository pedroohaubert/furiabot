/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import Image from "next/image";

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();

  // Função para lidar com o envio do formulário de registro
  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await register(username, email, password);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro durante o registro.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Image
        src="/furia_sem_letras.png"
        alt="Logo Furia"
        width={64}
        height={64}
        className="mb-6"
        priority
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Registrar</CardTitle>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Escolha um nome de usuário"
                required
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex mt-4 flex-col items-center">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="underline ml-1">
                Entrar
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 