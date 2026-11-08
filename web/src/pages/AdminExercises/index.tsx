import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import {
  getPendingExerciseVariations,
  getBulkApprovalPreview,
  approveBulkExerciseVariations,
  type BulkApprovalPreview,
  reviewExerciseVariation,
  type ReviewDecision,
} from "../../services/admin-exercises";

import type { ExerciseVariation } from "../../types/exercise";

type AdminVariation = ExerciseVariation & {
  exercise: {
    id: string;
    name: string;
    muscleGroup: string;
  };
};

const groupLabels: Record<string, string> = {
  CHEST: "Peitoral",
  BACK: "Costas",
  SHOULDERS: "Ombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  LEGS: "Pernas",
  GLUTES: "Glúteos",
  CALVES: "Panturrilhas",
  CORE: "Abdômen / Core",
  CARDIO: "Cardio",
  FULL_BODY: "Corpo inteiro",
  OTHER: "Outros",
};

const categoryLabels: Record<string, string> = {
  MACHINE_CABLE: "Máquinas / Cabos",
  FREE_WEIGHT: "Pesos livres",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

const buttonClass =
  "min-h-11 rounded-lg px-4 py-2 text-sm font-semibold " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function AdminExercises() {
  const { signOut } = useAuth();

  const [variations, setVariations] = useState<AdminVariation[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [bulkPreview, setBulkPreview] = useState<BulkApprovalPreview | null>(
    null,
  );
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const loadVariations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [data, preview] = await Promise.all([
        getPendingExerciseVariations(),
        getBulkApprovalPreview(),
      ]);

      setVariations(data as AdminVariation[]);
      setBulkPreview(preview);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        return;
      }

      setError("Não foi possível carregar os exercícios pendentes.");
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadVariations();
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadVariations]);

  const filteredVariations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return variations.filter((variation) => {
      const matchesSearch =
        !term ||
        variation.name.toLocaleLowerCase("pt-BR").includes(term) ||
        variation.exercise.name.toLocaleLowerCase("pt-BR").includes(term);

      const matchesGroup = !group || variation.exercise.muscleGroup === group;

      const matchesCategory = !category || variation.category === category;

      const matchesLevel = !level || variation.level === level;

      return matchesSearch && matchesGroup && matchesCategory && matchesLevel;
    });
  }, [variations, search, group, category, level]);

  async function handleReview(
    variation: AdminVariation,
    decision: ReviewDecision,
  ) {
    if (processingId || bulkProcessing) return;

    const action = decision === "APPROVE" ? "aprovar" : "rejeitar";

    const confirmed = window.confirm(
      `Deseja realmente ${action} o exercício "${variation.name}"?`,
    );

    if (!confirmed) return;

    setProcessingId(variation.id);
    setError("");
    setFeedback("");

    try {
      await reviewExerciseVariation(variation.id, decision);

      setVariations((current) =>
        current.filter((item) => item.id !== variation.id),
      );

      setFeedback(
        `Exercício "${variation.name}" ${
          decision === "APPROVE" ? "aprovado" : "rejeitado"
        } com sucesso.`,
      );
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        return;
      }

      setError(
        "Não foi possível concluir a revisão. Atualize a lista e tente novamente.",
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleBulkApproval() {
    if (
      bulkProcessing ||
      processingId !== null ||
      loading ||
      !bulkPreview ||
      bulkPreview.eligible === 0
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Deseja aprovar ${bulkPreview.eligible} variações elegíveis?\n\n` +
        `${bulkPreview.editorialPending} variações sinalizadas para revisão editorial não serão aprovadas.\n\n` +
        "Esta operação atualizará os registros no PostgreSQL.",
    );

    if (!confirmed) return;

    setBulkProcessing(true);
    setError("");
    setFeedback("");

    try {
      const result = await approveBulkExerciseVariations();

      setFeedback(
        `${result.approved} variações aprovadas em lote com sucesso.`,
      );

      await loadVariations();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        return;
      }

      setError(
        "Não foi possível concluir a aprovação em lote. Atualize a lista e tente novamente.",
      );
    } finally {
      setBulkProcessing(false);
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title="Administração de exercícios"
        description="Revise e gerencie as variações do catálogo global."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-default bg-surface p-5">
          <p className="text-sm text-text-secondary">
            Elegíveis para aprovação em lote
          </p>

          <p className="mt-2 text-3xl font-bold text-text-primary">
            {bulkPreview?.eligible ?? "—"}
          </p>
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-5">
          <p className="text-sm text-text-secondary">
            Pendentes de revisão editorial
          </p>

          <p className="mt-2 text-3xl font-bold text-text-primary">
            {bulkPreview?.editorialPending ?? "—"}
          </p>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleBulkApproval()}
          disabled={
            loading ||
            bulkProcessing ||
            processingId !== null ||
            !bulkPreview ||
            bulkPreview.eligible === 0
          }
          className="min-h-11 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bulkProcessing
            ? "Aprovando exercícios..."
            : `Aprovar ${bulkPreview?.eligible ?? 0} elegíveis em lote`}
        </button>

        <p className="text-sm text-text-secondary">
          Exercícios sinalizados para revisão editorial ficam de fora.
        </p>
      </div>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input
          type="search"
          aria-label="Pesquisar exercícios pendentes"
          placeholder="Pesquisar exercício..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-3 text-text-primary"
        />

        <select
          aria-label="Filtrar por grupo muscular"
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-3 text-text-primary"
        >
          <option value="">Todos os grupos</option>
          {Object.entries(groupLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por categoria"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-3 text-text-primary"
        >
          <option value="">Todas as categorias</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por nível"
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-3 text-text-primary"
        >
          <option value="">Todos os níveis</option>
          {Object.entries(levelLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {loading
            ? "Carregando..."
            : `${filteredVariations.length} de ${variations.length} variações pendentes`}
        </p>

        <button
          type="button"
          onClick={() => void loadVariations()}
          disabled={loading || processingId !== null}
          className={`${buttonClass} border border-border-default text-text-primary`}
        >
          Atualizar lista
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger p-4 text-danger"
        >
          {error}
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-green-600 p-4 text-text-primary"
        >
          {feedback}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-6 text-text-secondary">
          Carregando exercícios pendentes...
        </p>
      ) : filteredVariations.length === 0 && !error ? (
        <div className="rounded-xl border border-border-default bg-surface p-8 text-center">
          <h2 className="font-semibold text-text-primary">
            Nenhum exercício encontrado
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Não há variações pendentes correspondentes aos filtros.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVariations.map((variation) => (
            <article
              key={variation.id}
              className="min-w-0 rounded-xl border border-border-default bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {variation.name}
                  </h2>

                  <p className="mt-1 text-sm text-text-secondary">
                    {variation.exercise.name}
                    {" • "}
                    {groupLabels[variation.exercise.muscleGroup] ??
                      variation.exercise.muscleGroup}
                  </p>

                  <p className="mt-1 text-sm text-text-secondary">
                    {categoryLabels[variation.category] ?? variation.category}
                    {" • "}
                    {levelLabels[variation.level] ?? variation.level}
                  </p>
                </div>

                <span className="rounded-full border border-border-default px-3 py-1 text-xs font-semibold text-text-secondary">
                  Pendente
                </span>
              </div>

              {variation.equipment && (
                <p className="mt-3 text-sm text-text-secondary">
                  <strong>Equipamento: </strong>
                  {variation.equipment}
                </p>
              )}

              {variation.instructions && (
                <p className="mt-3 whitespace-pre-line text-sm text-text-secondary">
                  <strong>Execução: </strong>
                  {variation.instructions}
                </p>
              )}

              {variation.safetyNotes && (
                <p className="mt-3 whitespace-pre-line text-sm text-text-secondary">
                  <strong>Cuidados: </strong>
                  {variation.safetyNotes}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3 border-t border-border-default pt-4">
                <button
                  type="button"
                  disabled={processingId !== null || bulkProcessing}
                  onClick={() => void handleReview(variation, "APPROVE")}
                  className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}
                >
                  {processingId === variation.id ? "Processando..." : "Aprovar"}
                </button>

                <button
                  type="button"
                  disabled={processingId !== null || bulkProcessing}
                  onClick={() => void handleReview(variation, "REJECT")}
                  className={`${buttonClass} border border-danger text-danger`}
                >
                  Rejeitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
