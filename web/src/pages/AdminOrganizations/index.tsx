import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AxiosError } from "axios";
import { Link } from "react-router-dom";

import {
  createOrganization,
  getOrganizations,
  getEligibleOwners,
  type Organization,
  type EligibleOwner,
} from "../../services/organization-management.service";

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;

    if (error.response?.status === 401) {
      return "Sua sessão expirou. Faça login novamente.";
    }

    if (error.response?.status === 403) {
      return "Você não possui permissão para realizar esta operação.";
    }

    return data?.message ?? "Não foi possível concluir a operação.";
  }

  return "Ocorreu um erro inesperado.";
}

export function AdminOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [eligibleOwners, setEligibleOwners] = useState<EligibleOwner[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");

  const inputClassName = [
    "w-full rounded-lg border border-slate-300",
    "bg-white px-3 py-3 text-sm text-slate-900",
    "outline-none transition-colors",
    "focus:border-green-500 focus:ring-2 focus:ring-green-500/20",
    "dark:border-slate-700 dark:bg-slate-800 dark:text-white",
    "dark:focus:border-green-500",
  ].join(" ");

  const primaryButtonClassName = [
    "inline-flex min-h-11 items-center justify-center",
    "rounded-lg px-5 py-3",
    "!bg-green-600 !text-white !no-underline",
    "text-sm font-semibold",
    "shadow-sm transition-all duration-200",
    "hover:!bg-green-700 hover:shadow-md",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-green-500",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");

  const secondaryButtonClassName = [
    "rounded-lg border border-slate-300",
    "bg-white px-4 py-2 text-sm font-medium",
    "text-slate-700 transition-colors",
    "hover:bg-slate-100",
    "dark:border-slate-700 dark:bg-slate-800",
    "dark:text-slate-200 dark:hover:bg-slate-700",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ].join(" ");

  // Atualização manual da listagem de organizações.
  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrganizations();

      setOrganizations(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregamento inicial dos dados.
  useEffect(() => {
    let cancelled = false;

    async function initializeOrganizations() {
      const [organizationsResult, ownersResult] = await Promise.allSettled([
        getOrganizations(),
        getEligibleOwners(),
      ]);

      if (cancelled) {
        return;
      }

      const errors: string[] = [];

      if (organizationsResult.status === "fulfilled") {
        setOrganizations(organizationsResult.value);
      } else {
        errors.push(getErrorMessage(organizationsResult.reason));
      }

      if (ownersResult.status === "fulfilled") {
        setEligibleOwners(ownersResult.value);
      } else {
        errors.push(getErrorMessage(ownersResult.reason));
      }

      if (errors.length > 0) {
        setError([...new Set(errors)].join(" "));
      }

      setLoading(false);
      setLoadingOwners(false);
    }

    void initializeOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ownerUserId) {
      setError("Selecione o proprietário da organização.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createOrganization({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        ownerUserId,
      });

      setName("");
      setSlug("");
      setOwnerUserId("");

      await loadOrganizations();

      setSuccess("Organização cadastrada com sucesso!");
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Administração de empresas
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Cadastre academias, estúdios e organizações da plataforma.
        </p>
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

      {/* Cadastro de organizações */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-white">
          Nova organização
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <span>Nome da empresa</span>

            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              placeholder="Ex.: Academia Movimento"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <span>Identificador (slug)</span>

            <input
              required
              minLength={3}
              maxLength={80}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => setSlug(event.target.value.toLowerCase())}
              className={inputClassName}
              placeholder="academia-movimento"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700 dark:text-slate-300 md:col-span-2">
            <span>Proprietário da organização</span>

            <select
              required
              value={ownerUserId}
              onChange={(event) => setOwnerUserId(event.target.value)}
              disabled={loadingOwners || eligibleOwners.length === 0}
              className={inputClassName}
            >
              <option value="">
                {loadingOwners
                  ? "Carregando proprietários..."
                  : eligibleOwners.length === 0
                    ? "Nenhum treinador ativo disponível"
                    : "Selecione um proprietário"}
              </option>

              {eligibleOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} — {owner.email}
                </option>
              ))}
            </select>

            <span className="block text-xs text-slate-500 dark:text-slate-400">
              São exibidos usuários treinadores com contas ativas.
            </span>
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || loadingOwners || eligibleOwners.length === 0}
              className={primaryButtonClassName}
            >
              {saving ? "Salvando..." : "Cadastrar organização"}
            </button>
          </div>
        </form>
      </section>

      {/* Listagem de organizações */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Organizações cadastradas
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {organizations.length} organização(ões)
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrganizations()}
            disabled={loading}
            className={secondaryButtonClassName}
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Carregando organizações...
          </p>
        ) : organizations.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma organização cadastrada.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {organizations.map((organization) => (
              <article
                key={organization.id}
                className={[
                  "rounded-xl border border-slate-200",
                  "bg-white p-5 transition-colors",
                  "dark:border-slate-700 dark:bg-slate-800",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-slate-900 dark:text-white">
                      {organization.name}
                    </h3>

                    <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                      {organization.slug}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      organization.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
                    ].join(" ")}
                  >
                    {organization.isActive ? "Ativa" : "Inativa"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Membros
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {organization._count.members}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Alunos
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {organization._count.students}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/admin/organizations/${organization.id}`}
                  className={primaryButtonClassName + " mt-5"}
                >
                  Gerenciar professores
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
