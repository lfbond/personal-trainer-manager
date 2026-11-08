import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AxiosError } from "axios";
import { Link, useParams } from "react-router-dom";

import {
  createTrainer,
  getOrganizationMembers,
  updateOrganizationMember,
  type OrganizationMember,
} from "../../services/organization-management.service";

type EditableRole = "ADMIN" | "TRAINER";

const weakSequences = [
  "123456",
  "234567",
  "345678",
  "456789",
  "987654",
  "876543",
  "765432",
  "654321",
  "abcdef",
  "bcdefg",
  "fedcba",
  "qwerty",
  "asdfgh",
  "zxcvbn",
  "password",
  "senha123",
  "admin123",
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function validatePassword(password: string, name: string, email: string) {
  const normalizedPassword = normalizeText(password);

  const nameParts = normalizeText(name)
    .trim()
    .split(/\s+/)
    .filter((part) => part.length >= 3);

  const emailLocalPart = email.trim().toLowerCase().split("@")[0];

  const forbiddenTerms = [...nameParts, emailLocalPart].filter(
    (term) => term.length >= 3,
  );

  return [
    {
      label: "Entre 12 e 72 caracteres",
      valid: password.length >= 12 && password.length <= 72,
    },
    {
      label: "Pelo menos uma letra maiúscula",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Pelo menos uma letra minúscula",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Pelo menos um número",
      valid: /[0-9]/.test(password),
    },
    {
      label: "Pelo menos um caractere especial",
      valid: /[^A-Za-z0-9]/.test(password),
    },
    {
      label: "Sem sequências ou senhas previsíveis",
      valid: !weakSequences.some((sequence) =>
        normalizedPassword.includes(sequence),
      ),
    },
    {
      label: "Sem partes do nome ou e-mail",
      valid: !forbiddenTerms.some((term) => normalizedPassword.includes(term)),
    },
  ];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | {
          message?: string;
          issues?: Array<{ message?: string }>;
          errors?: Array<{ message?: string }>;
        }
      | undefined;

    if (error.response?.status === 403) {
      return "Você não possui permissão para realizar esta operação.";
    }

    const validationMessages = data?.issues ?? data?.errors;

    if (validationMessages?.length) {
      return validationMessages
        .map((issue) => issue.message)
        .filter(Boolean)
        .join(" ");
    }

    return data?.message ?? "Não foi possível concluir a operação.";
  }

  return "Ocorreu um erro inesperado.";
}

function roleLabel(role: OrganizationMember["role"]) {
  const labels = {
    OWNER: "Proprietário",
    ADMIN: "Administrador",
    TRAINER: "Professor",
  };

  return labels[role];
}

export function AdminOrganizationMembers() {
  const { organizationId } = useParams<{
    organizationId: string;
  }>();

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<EditableRole>("TRAINER");

  const passwordRules = validatePassword(password, name, email);
  const passwordValid = passwordRules.every((rule) => rule.valid);

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const canSubmit =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    passwordValid &&
    passwordsMatch &&
    !saving &&
    !loading;

  const loadMembers = useCallback(async () => {
    if (!organizationId) {
      setError("Organização não informada.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getOrganizationMembers(organizationId);

      setMembers(data);
      setAccessDenied(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));

      if (
        requestError instanceof AxiosError &&
        requestError.response?.status === 403
      ) {
        setAccessDenied(true);
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) {
      return;
    }

    const currentOrganizationId = organizationId;
    let active = true;

    async function fetchInitialMembers() {
      try {
        const data = await getOrganizationMembers(currentOrganizationId);

        if (!active) return;

        setMembers(data);
        setAccessDenied(false);
        setError("");
      } catch (requestError) {
        if (!active) return;

        setMembers([]);
        setError(getErrorMessage(requestError));

        setAccessDenied(
          requestError instanceof AxiosError &&
            requestError.response?.status === 403,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchInitialMembers();

    return () => {
      active = false;
    };
  }, [organizationId]);

  async function handleCreateTrainer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || saving) return;

    if (!passwordValid) {
      setError("A senha não atende aos requisitos de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createTrainer(organizationId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setRole("TRAINER");

      await loadMembers();

      setSuccess("Profissional cadastrado com sucesso.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(
    member: OrganizationMember,
    nextRole: EditableRole,
  ) {
    if (!organizationId || member.role === "OWNER") return;
    if (member.role === nextRole) return;

    try {
      setUpdatingId(member.id);
      setError("");
      setSuccess("");

      await updateOrganizationMember(organizationId, member.id, {
        role: nextRole,
      });

      await loadMembers();

      setSuccess("Permissão atualizada com sucesso.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleStatus(member: OrganizationMember) {
    if (!organizationId || member.role === "OWNER") return;

    const action = member.isActive ? "desativar" : "ativar";

    if (
      !window.confirm(
        `Deseja realmente ${action} o vínculo de ${member.user.name}?`,
      )
    ) {
      return;
    }

    try {
      setUpdatingId(member.id);
      setError("");
      setSuccess("");

      await updateOrganizationMember(organizationId, member.id, {
        isActive: !member.isActive,
      });

      await loadMembers();

      setSuccess("Situação do vínculo atualizada.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUpdatingId(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header className="space-y-3">
        <Link
          to="/admin/organizations"
          className="inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Voltar para empresas
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Professores e permissões
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie os profissionais e os vínculos desta organização.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          {success}
        </div>
      )}

      {!accessDenied && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Cadastrar profissional
            </h2>

            <form
              onSubmit={handleCreateTrainer}
              className="grid gap-4 md:grid-cols-2"
            >
              <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <span>Nome completo</span>

                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Nome do profissional"
                  autoComplete="name"
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <span>E-mail</span>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="professor@exemplo.com"
                  autoComplete="email"
                />
              </label>

              <div className="space-y-3 md:col-span-2">
                <label
                  htmlFor="new-professional-password"
                  className="block text-sm text-slate-700 dark:text-slate-300"
                >
                  Senha inicial
                </label>

                <div className="flex gap-2">
                  <input
                    id="new-professional-password"
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={12}
                    maxLength={72}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                    placeholder="Crie uma senha forte"
                    aria-describedby="password-requirements"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>

                <div
                  id="password-requirements"
                  className="rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                >
                  <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Requisitos de segurança
                  </p>

                  <ul className="grid gap-2 sm:grid-cols-2">
                    {passwordRules.map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-start gap-2 text-xs ${
                          password.length === 0
                            ? "text-slate-500 dark:text-slate-400"
                            : rule.valid
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        <span aria-hidden="true">
                          {password.length === 0 ? "○" : rule.valid ? "✓" : "×"}
                        </span>

                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <span>Confirmar senha</span>

                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={12}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                  placeholder="Repita a senha"
                  aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
                />

                {confirmPassword.length > 0 && (
                  <p
                    className={`text-xs ${
                      passwordsMatch
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {passwordsMatch
                      ? "As senhas coincidem."
                      : "As senhas não coincidem."}
                  </p>
                )}
              </label>

              <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <span>Perfil de acesso</span>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as EditableRole)
                  }
                  className={inputClass}
                >
                  <option value="TRAINER">Professor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Cadastrando..." : "Cadastrar profissional"}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Equipe cadastrada
                </h2>

                <p className="text-sm text-slate-500">
                  {members.length} membro(s)
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadMembers()}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Atualizar
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">
                Carregando profissionais...
              </p>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum membro encontrado.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const isOwner = member.role === "OWNER";
                  const isUpdating = updatingId === member.id;

                  return (
                    <article
                      key={member.id}
                      className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <h3 className="break-words font-semibold text-slate-900 dark:text-white">
                          {member.user.name}
                        </h3>

                        <p className="break-all text-sm text-slate-500 dark:text-slate-400">
                          {member.user.email}
                        </p>

                        <p className="text-xs text-slate-500">
                          {roleLabel(member.role)}
                          {" · "}
                          {member.isActive && member.user.isActive
                            ? "Acesso ativo"
                            : "Acesso inativo"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {isOwner ? (
                          <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            Proprietário
                          </span>
                        ) : (
                          <>
                            <label className="text-sm text-slate-600 dark:text-slate-300">
                              <span className="sr-only">
                                Permissão de {member.user.name}
                              </span>

                              <select
                                value={member.role}
                                disabled={isUpdating}
                                onChange={(event) =>
                                  void handleChangeRole(
                                    member,
                                    event.target.value as EditableRole,
                                  )
                                }
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              >
                                <option value="TRAINER">Professor</option>
                                <option value="ADMIN">Administrador</option>
                              </select>
                            </label>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => void handleToggleStatus(member)}
                              className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                                member.isActive
                                  ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
                                  : "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300"
                              }`}
                            >
                              {isUpdating
                                ? "Salvando..."
                                : member.isActive
                                  ? "Desativar"
                                  : "Ativar"}
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
