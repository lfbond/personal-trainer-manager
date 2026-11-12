import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";

import { useAuth } from "../../hooks/useAuth";

export function Login() {
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/students" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError("Não foi possível entrar. Verifique a conexão.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClassName = [
    "w-full rounded-lg border border-border-default",
    "bg-page px-4 py-3 text-text-primary",
    "outline-none transition-colors duration-200",
    "focus:border-primary focus:ring-2 focus:ring-primary/20",
    "disabled:cursor-not-allowed disabled:opacity-60",
  ].join(" ");

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-8">
      <div className="grid w-full max-w-[420px] gap-5 rounded-xl border border-border-default bg-surface p-6 shadow-lg sm:p-8">
        <header>
          <h1 className="text-2xl leading-tight font-bold text-text-primary">
            Personal Trainer Manager
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Entre com sua conta para gerenciar seus alunos, treinos e
            organizações.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-text-primary"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName}
              placeholder="seuemail@exemplo.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-text-primary"
            >
              Senha
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={[
              "w-full rounded-lg bg-primary px-4 py-3",
              "font-semibold text-white transition-colors duration-200",
              "hover:bg-primary-hover",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-primary",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {loading ? "Entrando..." : "Entrar na minha conta"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border-default" />

          <span className="text-xs font-medium text-text-secondary">OU</span>

          <div className="h-px flex-1 bg-border-default" />
        </div>

        <section aria-labelledby="demo-title" className="grid gap-3">
          <div className="text-center">
            <h2
              id="demo-title"
              className="text-base font-semibold text-text-primary"
            >
              Quer conhecer a plataforma?
            </h2>

            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Explore o sistema gratuitamente, sem cadastro e com dados
              fictícios.
            </p>
          </div>

          <Link
            to="/demo"
            className={[
              "flex w-full items-center justify-center gap-2",
              "rounded-lg border border-primary px-4 py-3",
              "font-semibold text-primary no-underline",
              "transition-colors duration-200",
              "hover:bg-primary/10",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-primary",
            ].join(" ")}
          >
            <span aria-hidden="true">◉</span>
            Conhecer demonstração
          </Link>
        </section>

        <aside
          aria-label="Informações sobre a hospedagem"
          className="rounded-lg border border-border-default bg-page p-4"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-primary">
              ⓘ
            </span>

            <div>
              <p className="text-sm font-semibold text-text-primary">
                Ambiente de testes
              </p>

              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                O Personal Trainer Manager utiliza serviços gratuitos de
                hospedagem. Por isso, o primeiro acesso ou algumas operações
                podem levar alguns instantes enquanto o servidor é iniciado.
                Agradecemos sua paciência!
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
