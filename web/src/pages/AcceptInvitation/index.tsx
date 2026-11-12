import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";

type Invitation = {
  email: string;
  role: "TRAINER" | "ADMIN";
  organization: string;
  expiresAt: string;
};

type ApiError = {
  message?: string;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3333"
).replace(/\/$/, "");

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      (data as ApiError).message || "Não foi possível concluir a operação.",
    );
  }

  return data;
}

function HostingNotice() {
  return (
    <aside style={styles.notice}>
      <p style={styles.noticeTitle}>ⓘ Ambiente de testes</p>

      <p style={styles.noticeText}>
        O Personal Trainer Manager utiliza serviços gratuitos de hospedagem. Por
        isso, o primeiro acesso ou algumas operações podem levar alguns
        instantes enquanto o servidor é iniciado. Agradecemos sua paciência!
      </p>
    </aside>
  );
}

export function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();

    async function loadInvitation() {
      try {
        const response = await fetch(`${API_URL}/auth/invitations/${token}`, {
          signal: controller.signal,
        });

        const data = (await readResponse(response)) as Invitation;

        if (!controller.signal.aborted) {
          setInvitation(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o convite.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => controller.abort();
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token || !invitation) {
      setError("Convite inválido.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 12 || password.length > 72) {
      setError("A senha deve conter entre 12 e 72 caracteres.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/invitations/${token}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            password,
          }),
        },
      );

      await readResponse(response);

      setCompleted(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível criar a conta.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.container}>
        <section style={styles.card}>
          <h1>Personal Trainer Manager</h1>
          <p>Verificando seu convite...</p>
          <HostingNotice />
        </section>
      </main>
    );
  }

  if (completed) {
    return (
      <main style={styles.container}>
        <section style={styles.card}>
          <h1>Conta criada com sucesso!</h1>

          <p>
            Seu cadastro foi concluído. Agora você pode entrar no Personal
            Trainer Manager.
          </p>

          <Link to="/login" style={styles.buttonLink}>
            Ir para o login
          </Link>

          <HostingNotice />
        </section>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main style={styles.container}>
        <section style={styles.card}>
          <h1>Convite indisponível</h1>

          <p role="alert">{error || "Este convite não está disponível."}</p>

          <Link to="/login">Voltar ao login</Link>

          <HostingNotice />
        </section>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h1>Personal Trainer Manager</h1>
        <h2>Você foi convidada!</h2>

        <p>
          Organização: <strong>{invitation.organization}</strong>
        </p>

        <p>
          Perfil:{" "}
          <strong>
            {invitation.role === "ADMIN" ? "Administradora" : "Treinadora"}
          </strong>
        </p>

        <p>
          E-mail: <strong>{invitation.email}</strong>
        </p>

        <p style={styles.helper}>
          Crie sua conta para começar a utilizar a plataforma. Sua senha é
          pessoal e não deve ser compartilhada.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label htmlFor="name">Nome completo</label>

          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={styles.input}
          />

          <label htmlFor="password">Senha</label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={styles.input}
          />

          <p style={styles.helper}>
            Use de 12 a 72 caracteres, com letra maiúscula, minúscula, número e
            caractere especial. Não use seu nome, e-mail ou sequências
            previsíveis.
          </p>

          <label htmlFor="confirmPassword">Confirmar senha</label>

          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            style={styles.input}
          />

          {error && (
            <p role="alert" style={styles.error}>
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting ? "Criando conta..." : "Criar minha conta"}
          </button>
        </form>

        <p style={styles.helper}>
          Já possui uma conta? <Link to="/login">Entrar</Link>
        </p>

        <HostingNotice />
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "#f1f5f9",
    color: "#0f172a",
  },
  card: {
    width: "100%",
    maxWidth: "480px",
    padding: "32px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "24px",
  },
  input: {
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "16px",
  },
  helper: {
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  error: {
    color: "#b91c1c",
    fontSize: "14px",
  },
  button: {
    padding: "14px",
    border: 0,
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  buttonLink: {
    display: "inline-block",
    marginTop: "12px",
    padding: "14px",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 700,
  },
  notice: {
    marginTop: "24px",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
  },
  noticeTitle: {
    margin: 0,
    color: "#1d4ed8",
    fontWeight: 700,
    fontSize: "14px",
  },
  noticeText: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#334155",
    fontSize: "13px",
    lineHeight: 1.6,
  },
};
