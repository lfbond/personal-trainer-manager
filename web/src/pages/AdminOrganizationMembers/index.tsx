import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AxiosError } from "axios";
import { Link, useParams } from "react-router-dom";

import {
  getOrganizationMembers,
  updateOrganizationMember,
  type OrganizationMember,
} from "../../services/organization-management.service";

import {
  buildInvitationUrl,
  createOrganizationInvitation,
} from "../../services/organization-invitations.service";

type EditableRole = "ADMIN" | "TRAINER";

interface GeneratedInvitation {
  email: string;
  organization: string;
  role: EditableRole;
  expiresAt: string;
  url: string;
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

    const validationMessages = data?.issues ?? data?.errors;

    if (validationMessages?.length) {
      const messages = validationMessages
        .map((issue) => issue.message)
        .filter(Boolean)
        .join(" ");

      if (messages) {
        return messages;
      }
    }

    if (data?.message) {
      return data.message;
    }

    if (error.response?.status === 403) {
      return "Você não possui permissão para realizar esta operação.";
    }

    if (error.response?.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }

    return "Não foi possível concluir a operação.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

function roleLabel(role: OrganizationMember["role"]): string {
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

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<EditableRole>("TRAINER");

  const [generatedInvitation, setGeneratedInvitation] =
    useState<GeneratedInvitation | null>(null);

  const [pendingStatusMember, setPendingStatusMember] =
    useState<OrganizationMember | null>(null);

  const canSubmit =
    Boolean(organizationId) && email.trim().length > 0 && !saving && !loading;

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

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || saving) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Informe o e-mail do profissional.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setGeneratedInvitation(null);

      const invitation = await createOrganizationInvitation({
        organizationId,
        email: normalizedEmail,
        role,
      });

      const invitationUrl = buildInvitationUrl(invitation.token);

      setGeneratedInvitation({
        email: invitation.email,
        organization: invitation.organization,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        url: invitationUrl,
      });

      setEmail("");
      setRole("TRAINER");

      setSuccess(
        "Convite gerado com sucesso. " +
          "Compartilhe o link de forma privada com o destinatário. " +
          "O convite ainda não foi enviado por e-mail.",
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyInvitation() {
    if (!generatedInvitation) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedInvitation.url);

      setError("");
      setSuccess("Link copiado para a área de transferência.");
    } catch {
      setError(
        "Não foi possível copiar automaticamente. " +
          "Selecione o link exibido e copie manualmente.",
      );
    }
  }

  async function handleChangeRole(
    member: OrganizationMember,
    nextRole: EditableRole,
  ) {
    if (
      !organizationId ||
      member.role === "OWNER" ||
      member.role === nextRole ||
      updatingId
    ) {
      return;
    }

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

  function handleToggleStatus(member: OrganizationMember) {
    if (!organizationId || member.role === "OWNER" || updatingId) {
      return;
    }

    setError("");
    setSuccess("");
    setPendingStatusMember(member);
  }

  async function handleConfirmStatusChange() {
    if (!organizationId || !pendingStatusMember || updatingId) {
      return;
    }

    const member = pendingStatusMember;

    try {
      setUpdatingId(member.id);
      setError("");
      setSuccess("");

      await updateOrganizationMember(organizationId, member.id, {
        isActive: !member.isActive,
      });

      setPendingStatusMember(null);

      await loadMembers();

      setSuccess(
        member.isActive
          ? "Vínculo desativado com sucesso."
          : "Vínculo ativado com sucesso.",
      );
    } catch (requestError) {
      setPendingStatusMember(null);
      setError(getErrorMessage(requestError));
    } finally {
      setUpdatingId(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white p-3 " +
    "text-sm text-slate-900 outline-none focus:border-blue-500 " +
    "dark:border-slate-700 dark:bg-slate-800 dark:text-white";

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
            Gerencie profissionais, convites de primeiro acesso e vínculos desta
            organização.
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
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              Convidar profissional
            </h2>

            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              O profissional definirá seu próprio nome e sua senha na página de
              ativação. Você não precisa conhecer nem criar a senha dele.
            </p>

            <form
              onSubmit={handleCreateInvitation}
              className="grid gap-4 md:grid-cols-2"
            >
              <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <span>E-mail do profissional</span>

                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="professor@exemplo.com"
                  autoComplete="email"
                  maxLength={254}
                />
              </label>

              <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                <span>Perfil na organização</span>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as EditableRole)
                  }
                  className={inputClass}
                >
                  <option value="TRAINER">Professor</option>
                  <option value="ADMIN">Administrador da organização</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Gerando convite..."
                    : "Gerar convite de primeiro acesso"}
                </button>
              </div>
            </form>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Proprietários e gestores globais podem emitir convites
              administrativos. Administradores locais podem convidar professores
              da própria organização. O link expira em 48 horas e permite uma
              única ativação.
            </p>
          </section>

          {generatedInvitation && (
            <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-900 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Convite gerado
              </h2>

              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  <strong>Destinatário:</strong> {generatedInvitation.email}
                </p>

                <p>
                  <strong>Organização:</strong>{" "}
                  {generatedInvitation.organization}
                </p>

                <p>
                  <strong>Perfil:</strong>{" "}
                  {generatedInvitation.role === "ADMIN"
                    ? "Administrador da organização"
                    : "Professor"}
                </p>

                <p>
                  <strong>Validade:</strong>{" "}
                  {new Date(generatedInvitation.expiresAt).toLocaleString(
                    "pt-BR",
                  )}
                </p>
              </div>

              <label className="mt-5 block space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Link privado de ativação
                </span>

                <textarea
                  readOnly
                  rows={3}
                  value={generatedInvitation.url}
                  onFocus={(event) => event.target.select()}
                  className={`${inputClass} resize-none break-all`}
                  aria-label="Link privado de ativação"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleCopyInvitation()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Copiar link
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedInvitation(null);
                    setSuccess("");
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Ocultar link
                </button>
              </div>

              <p className="mt-4 text-xs text-amber-800 dark:text-amber-300">
                Atenção: qualquer pessoa com esse link poderá ativar a conta
                enquanto o convite estiver válido. Compartilhe-o apenas por um
                canal privado e confiável. O sistema ainda não envia o convite
                automaticamente por e-mail.
              </p>
            </section>
          )}

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
                disabled={loading || Boolean(updatingId)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
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
                                disabled={
                                  isUpdating || Boolean(updatingId) || loading
                                }
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
                              disabled={
                                isUpdating || Boolean(updatingId) || loading
                              }
                              onClick={() => handleToggleStatus(member)}
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

      {pendingStatusMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-status-title"
            aria-describedby="confirm-status-description"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
          >
            <h2
              id="confirm-status-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              Confirmar alteração de acesso
            </h2>

            <p
              id="confirm-status-description"
              className="mt-3 text-sm text-slate-600 dark:text-slate-300"
            >
              Deseja realmente{" "}
              <strong>
                {pendingStatusMember.isActive ? "desativar" : "ativar"}
              </strong>{" "}
              o vínculo de <strong>{pendingStatusMember.user.name}</strong>?
            </p>

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Esta operação altera o acesso do profissional somente nesta
              organização.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => setPendingStatusMember(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() => void handleConfirmStatusChange()}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  pendingStatusMember.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {updatingId
                  ? "Salvando..."
                  : pendingStatusMember.isActive
                    ? "Confirmar desativação"
                    : "Confirmar ativação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
