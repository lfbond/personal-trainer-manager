import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

type ExerciseVariation = {
  id: string;
  exerciseId: string;
  trainerId: string | null;
  code: string;
  name: string;
  category: string;
  level: string;
  equipment: string | null;
  subgroup: string | null;
  description: string | null;
  instructions: string | null;
  safetyNotes: string | null;
  muscleExplanation: string | null;
  imageUrl: string | null;
  imageReviewStatus: string;
  imageReviewNotes: string | null;
  videoUrl: string | null;
  status: string;
  needsEditorialReview: boolean;
  createdAt: string;
  exercise: {
    id: string;
    code: string;
    name: string;
    muscleGroup: string;
  };
  trainer: {
    id: string;
  } | null;
};

type EditorialQueueResponse = {
  total: number;
  take: number;
  skip: number;
  variations: ExerciseVariation[];
};

type ModerationRecord = {
  id: string;
  moderatorId: string;
  action: string;
  status: string;
  reason: string;
  scientificReferences: string | null;
  previousStatus: string;
  newStatus: string;
  createdAt: string;
  resolvedAt: string | null;
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

const actionLabels: Record<string, string> = {
  EDITORIAL_APPROVAL: "Aprovação científica",
  EDITORIAL_REJECTION: "Rejeição científica",
  EDITORIAL_RESUBMISSION: "Reenvio para revisão",
  SAFETY_SUSPENSION: "Suspensão por segurança",
  SAFETY_REINSTATEMENT: "Reativação científica",
};

const inputClass =
  "min-h-11 w-full rounded-lg border border-border-default " +
  "bg-surface px-3 py-2 text-text-primary";

const buttonClass =
  "min-h-11 rounded-lg px-4 py-2 text-sm font-semibold " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

export function AdminExercises() {
  const { signOut } = useAuth();

  const [variations, setVariations] = useState<ExerciseVariation[]>([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selectedVariation, setSelectedVariation] =
    useState<ExerciseVariation | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [scientificReferences, setScientificReferences] = useState("");

  const [history, setHistory] = useState<ModerationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [showHistory, setShowHistory] = useState(false);

  const handleApiError = useCallback(
    (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        return true;
      }

      return false;
    },
    [signOut],
  );

  const loadVariations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<EditorialQueueResponse>(
        "/exercises/editorial/queue",
        {
          params: {
            take: 100,
            skip: 0,
          },
        },
      );

      setVariations(response.data.variations);
      setTotal(response.data.total);
    } catch (err) {
      if (handleApiError(err)) return;

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadVariations();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadVariations]);

  const filteredVariations = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");

    return variations.filter((variation) => {
      const matchesSearch =
        !term ||
        variation.name.toLocaleLowerCase("pt-BR").includes(term) ||
        variation.code.toLocaleLowerCase("pt-BR").includes(term) ||
        variation.exercise.name.toLocaleLowerCase("pt-BR").includes(term);

      const matchesGroup = !group || variation.exercise.muscleGroup === group;

      const matchesCategory = !category || variation.category === category;

      const matchesLevel = !level || variation.level === level;

      return matchesSearch && matchesGroup && matchesCategory && matchesLevel;
    });
  }, [variations, search, group, category, level]);

  function openVariation(variation: ExerciseVariation) {
    setSelectedVariation(variation);
    setRejectionReason("");
    setScientificReferences("");
    setHistory([]);
    setHistoryError("");
    setShowHistory(false);
    setError("");
    setFeedback("");
  }

  function closeVariation() {
    if (processingId !== null) return;

    setSelectedVariation(null);
    setRejectionReason("");
    setScientificReferences("");
    setHistory([]);
    setHistoryError("");
    setShowHistory(false);
  }

  async function handleApproval() {
    if (!selectedVariation || processingId !== null) return;

    const confirmed = window.confirm(
      `Confirma a aprovação científica de "${selectedVariation.name}"?\n\n` +
        "O exercício ficará disponível para prescrição.",
    );

    if (!confirmed) return;

    const variationId = selectedVariation.id;
    const variationName = selectedVariation.name;

    setProcessingId(variationId);
    setError("");
    setFeedback("");

    try {
      await api.patch(`/exercises/editorial/variations/${variationId}/approve`);

      setFeedback(
        `Exercício "${variationName}" aprovado e registrado no histórico.`,
      );

      setSelectedVariation(null);
      await loadVariations();
    } catch (err) {
      if (handleApiError(err)) return;

      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejection() {
    if (!selectedVariation || processingId !== null) return;

    const reason = rejectionReason.trim();

    if (reason.length < 10) {
      setError("Informe uma justificativa com pelo menos 10 caracteres.");
      return;
    }

    const confirmed = window.confirm(
      `Confirma a rejeição científica de "${selectedVariation.name}"?\n\n` +
        "O exercício permanecerá indisponível para prescrição.",
    );

    if (!confirmed) return;

    const variationId = selectedVariation.id;
    const variationName = selectedVariation.name;

    setProcessingId(variationId);
    setError("");
    setFeedback("");

    try {
      await api.post(`/exercises/editorial/variations/${variationId}/reject`, {
        reason,
        scientificReferences: scientificReferences.trim() || null,
      });

      setFeedback(
        `Exercício "${variationName}" rejeitado e devolvido para correção.`,
      );

      setSelectedVariation(null);
      await loadVariations();
    } catch (err) {
      if (handleApiError(err)) return;

      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  async function loadHistory(variationId: string) {
    setHistoryLoading(true);
    setHistoryError("");
    setShowHistory(true);

    try {
      const response = await api.get<ModerationRecord[]>(
        `/exercises/editorial/variations/${variationId}/history`,
      );

      setHistory(response.data);
    } catch (err) {
      if (handleApiError(err)) return;

      setHistoryError(getErrorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title="Auditoria científica de exercícios"
        description="Revise individualmente as variações do catálogo, registre decisões e consulte o histórico científico."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-default bg-surface p-5">
          <p className="text-sm text-text-secondary">
            Pendentes de revisão científica
          </p>

          <p className="mt-2 text-3xl font-bold text-text-primary">
            {loading ? "—" : total}
          </p>
        </div>

        <div className="rounded-xl border border-border-default bg-surface p-5">
          <p className="text-sm text-text-secondary">
            Exercícios carregados nesta página
          </p>

          <p className="mt-2 text-3xl font-bold text-text-primary">
            {loading ? "—" : variations.length}
          </p>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-border-default bg-surface p-4">
        <h2 className="font-semibold text-text-primary">
          Revisão técnica obrigatória
        </h2>

        <p className="mt-2 text-sm text-text-secondary">
          A aprovação e a rejeição devem ser realizadas somente por um
          profissional autorizado. Nenhum exercício será aprovado
          automaticamente ou em lote nesta página.
        </p>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input
          type="search"
          aria-label="Pesquisar exercícios"
          placeholder="Pesquisar nome ou código..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />

        <select
          aria-label="Filtrar por grupo muscular"
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          className={inputClass}
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
          className={inputClass}
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
          className={inputClass}
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
            : `${filteredVariations.length} de ${variations.length} exercícios carregados`}
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
            Não existem exercícios correspondentes aos filtros.
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
                    Código: {variation.code}
                  </p>

                  <p className="mt-1 text-sm text-text-secondary">
                    {groupLabels[variation.exercise.muscleGroup] ??
                      variation.exercise.muscleGroup}
                    {" • "}
                    {categoryLabels[variation.category] ?? variation.category}
                    {" • "}
                    {levelLabels[variation.level] ?? variation.level}
                  </p>
                </div>

                <span className="rounded-full border border-border-default px-3 py-1 text-xs font-semibold text-text-secondary">
                  Aguardando revisão
                </span>
              </div>

              {variation.equipment && (
                <p className="mt-3 text-sm text-text-secondary">
                  <strong>Equipamento: </strong>
                  {variation.equipment}
                </p>
              )}

              {variation.instructions && (
                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-text-secondary">
                  <strong>Execução: </strong>
                  {variation.instructions}
                </p>
              )}

              <div className="mt-5 border-t border-border-default pt-4">
                <button
                  type="button"
                  onClick={() => openVariation(variation)}
                  disabled={processingId !== null}
                  className={`${buttonClass} border border-border-default text-text-primary`}
                >
                  Abrir revisão científica
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedVariation && (
        <section
          aria-label="Detalhes da revisão científica"
          className="mt-8 rounded-xl border border-border-default bg-surface p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Revisão: {selectedVariation.name}
              </h2>

              <p className="mt-1 text-sm text-text-secondary">
                {selectedVariation.code}
                {" • "}
                {selectedVariation.exercise.name}
              </p>
            </div>

            <button
              type="button"
              onClick={closeVariation}
              disabled={processingId !== null}
              className={`${buttonClass} border border-border-default text-text-primary`}
            >
              Fechar
            </button>
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <h3 className="font-semibold text-text-primary">Descrição</h3>

              <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                {selectedVariation.description || "Não informada."}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary">Execução</h3>

              <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                {selectedVariation.instructions || "Não informada."}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary">
                Cuidados e segurança
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                {selectedVariation.safetyNotes || "Não informados."}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary">
                Explicação muscular
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                {selectedVariation.muscleExplanation || "Não informada."}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-text-primary">
                Revisão da imagem
              </h3>

              <p className="mt-2 text-sm text-text-secondary">
                Status: {selectedVariation.imageReviewStatus}
              </p>

              <p className="mt-1 text-sm text-text-secondary">
                {selectedVariation.imageReviewNotes ||
                  "Sem observações sobre a imagem."}
              </p>

              {selectedVariation.imageUrl && (
                <p className="mt-2 break-all text-sm text-text-secondary">
                  Arquivo: {selectedVariation.imageUrl}
                </p>
              )}

              <p className="mt-2 text-xs text-text-secondary">
                A aprovação científica do exercício não aprova automaticamente
                sua imagem.
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border-default pt-5">
            <h3 className="text-lg font-semibold text-text-primary">
              Decisão científica
            </h3>

            <p className="mt-2 text-sm text-text-secondary">
              Para rejeitar um exercício, informe uma justificativa. Ela ficará
              registrada no histórico de auditoria.
            </p>

            <label
              htmlFor="rejection-reason"
              className="mt-4 block text-sm font-medium text-text-primary"
            >
              Justificativa da rejeição
            </label>

            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              maxLength={3000}
              rows={4}
              placeholder="Descreva o problema identificado e a correção necessária..."
              className={`${inputClass} mt-2`}
            />

            <label
              htmlFor="scientific-references"
              className="mt-4 block text-sm font-medium text-text-primary"
            >
              Referências científicas (opcional)
            </label>

            <textarea
              id="scientific-references"
              value={scientificReferences}
              onChange={(event) => setScientificReferences(event.target.value)}
              maxLength={5000}
              rows={3}
              placeholder="Referências utilizadas na avaliação..."
              className={`${inputClass} mt-2`}
            />

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleApproval()}
                disabled={processingId !== null}
                className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}
              >
                {processingId === selectedVariation.id
                  ? "Processando..."
                  : "Aprovar exercício"}
              </button>

              <button
                type="button"
                onClick={() => void handleRejection()}
                disabled={
                  processingId !== null || rejectionReason.trim().length < 10
                }
                className={`${buttonClass} border border-danger text-danger`}
              >
                Rejeitar e solicitar correção
              </button>

              <button
                type="button"
                onClick={() => void loadHistory(selectedVariation.id)}
                disabled={historyLoading}
                className={`${buttonClass} border border-border-default text-text-primary`}
              >
                Consultar histórico
              </button>
            </div>
          </div>

          {showHistory && (
            <div className="mt-6 border-t border-border-default pt-5">
              <h3 className="text-lg font-semibold text-text-primary">
                Histórico de auditoria
              </h3>

              {historyLoading ? (
                <p className="mt-3 text-sm text-text-secondary">
                  Carregando histórico...
                </p>
              ) : historyError ? (
                <p role="alert" className="mt-3 text-sm text-danger">
                  {historyError}
                </p>
              ) : history.length === 0 ? (
                <p className="mt-3 text-sm text-text-secondary">
                  Nenhuma decisão registrada para esta variação.
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {history.map((record) => (
                    <article
                      key={record.id}
                      className="rounded-lg border border-border-default p-4"
                    >
                      <p className="font-semibold text-text-primary">
                        {actionLabels[record.action] ?? record.action}
                      </p>

                      <p className="mt-1 text-xs text-text-secondary">
                        {formatDate(record.createdAt)}
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                        {record.reason}
                      </p>

                      {record.scientificReferences && (
                        <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                          <strong>Referências: </strong>
                          {record.scientificReferences}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-text-secondary">
                        Responsável (ID): {record.moderatorId}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
