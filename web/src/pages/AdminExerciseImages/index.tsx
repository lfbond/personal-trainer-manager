import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";

import {
  getExerciseImageReviews,
  reviewExerciseImage,
  reviewExerciseImagesBatch,
  type ImageReviewVariation,
} from "../../services/exercise-images";

import type { ExerciseImageStatus } from "../../types/exercise";

const PAGE_SIZE = 50;

const buttonClass =
  "min-h-11 rounded-lg px-4 py-2 text-sm font-semibold " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const statusLabels: Record<ExerciseImageStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data: unknown = error.response?.data;

    let apiMessage: string | undefined;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      apiMessage = data.message;
    }

    if (!error.response) {
      return (
        "Não foi possível conectar ao backend. " +
        "Verifique se a API está iniciada."
      );
    }

    if (status === 401) {
      return (
        "Erro 401 — A API não reconheceu a autenticação. " +
        (apiMessage ?? "Verifique o envio do token JWT.")
      );
    }

    if (status === 403) {
      return (
        "Erro 403 — Seu usuário não possui permissão " +
        "para revisar imagens. " +
        (apiMessage ?? "")
      );
    }

    if (status === 404) {
      return "Erro 404 — Endpoint não encontrado. " + (apiMessage ?? "");
    }

    return (
      `Erro HTTP ${status ?? "desconhecido"} — ` + (apiMessage ?? error.message)
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocorreu um erro inesperado.";
}

function ImagePreview({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const failed = Boolean(imageUrl) && failedUrl === imageUrl;

  return (
    <div className="mb-3 flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border-default bg-page">
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={`Demonstração: ${name}`}
          loading="lazy"
          onError={() => setFailedUrl(imageUrl)}
          className="h-full w-full object-contain"
        />
      ) : (
        <p className="p-3 text-center text-sm text-text-secondary">
          {failed
            ? "Não foi possível carregar a imagem."
            : "Imagem não cadastrada."}
        </p>
      )}
    </div>
  );
}

export function AdminExerciseImages() {
  const [variations, setVariations] = useState<ImageReviewVariation[]>([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExerciseImageStatus | "">("PENDING");

  const [skip, setSkip] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getExerciseImageReviews({
        status: status || undefined,
        search: search.trim() || undefined,
        take: PAGE_SIZE,
        skip,
      });

      setVariations(result.variations);
      setTotal(result.total);
      setSelectedIds([]);
    } catch (err) {
      setVariations([]);
      setTotal(0);
      setSelectedIds([]);

      // Não encerramos a sessão automaticamente.
      // Exibimos a resposta real da API.
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, search, skip]);

  useEffect(() => {
    // Inicia o carregamento após a execução do efeito,
    // evitando atualização síncrona de estado nele.
    const controller = new AbortController();

    async function fetchImages() {
      try {
        const result = await getExerciseImageReviews({
          status: status || undefined,
          search: search.trim() || undefined,
          take: PAGE_SIZE,
          skip,
        });

        if (controller.signal.aborted) return;

        setVariations(result.variations);
        setTotal(result.total);
        setSelectedIds([]);
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;

        setVariations([]);
        setTotal(0);
        setSelectedIds([]);
        setError(getErrorMessage(err));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchImages();

    return () => {
      controller.abort();
    };
  }, [status, search, skip]);

  function resetPagination() {
    setSkip(0);
    setSelectedIds([]);
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectAllVisible() {
    const eligibleIds = variations
      .filter((item) => Boolean(item.imageUrl))
      .map((item) => item.id);

    if (eligibleIds.length === 0) {
      return;
    }

    const allSelected = eligibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds(allSelected ? [] : eligibleIds);
  }

  async function handleReview(
    variation: ImageReviewVariation,
    decision: ExerciseImageStatus,
  ) {
    if (processing) return;

    let notes: string | null = null;

    if (decision === "REJECTED") {
      const input = window.prompt(`Motivo da rejeição de "${variation.name}":`);

      if (input === null) return;

      notes = input.trim();

      if (!notes) {
        setError("Informe uma justificativa para rejeitar.");
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Alterar a imagem de "${variation.name}" ` +
          `para ${statusLabels[decision]}?`,
      );

      if (!confirmed) return;
    }

    setProcessing(true);
    setError("");
    setFeedback("");

    try {
      await reviewExerciseImage(variation.id, {
        status: decision,
        notes,
      });

      setFeedback(`Imagem de "${variation.name}" atualizada com sucesso.`);

      await loadImages();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  }

  async function handleBatchReview(decision: ExerciseImageStatus) {
    if (processing || selectedIds.length === 0) return;

    let notes: string | null = null;

    if (decision === "REJECTED") {
      const input = window.prompt(
        "Informe a justificativa da rejeição em lote:",
      );

      if (input === null) return;

      notes = input.trim();

      if (!notes) {
        setError("A rejeição em lote exige justificativa.");
        return;
      }
    }

    const confirmed = window.confirm(
      `Confirmar ${statusLabels[decision].toLowerCase()} ` +
        `para ${selectedIds.length} imagens?\n\n` +
        "Aprove apenas imagens verificadas visualmente.",
    );

    if (!confirmed) return;

    setProcessing(true);
    setError("");
    setFeedback("");

    try {
      const result = await reviewExerciseImagesBatch({
        variationIds: selectedIds,
        status: decision,
        notes,
      });

      setFeedback(`${result.updated} imagens atualizadas com sucesso.`);

      await loadImages();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  }

  const selectableIds = variations
    .filter((variation) => Boolean(variation.imageUrl))
    .map((variation) => variation.id);

  const allVisibleSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  return (
    <div className="min-w-0">
      <PageHeader
        title="Revisão de imagens"
        description="Verifique e aprove imagens do catálogo global."
      />

      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <input
          type="search"
          aria-label="Pesquisar imagens"
          placeholder="Pesquisar código ou nome..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            resetPagination();
          }}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-3 text-text-primary"
        />

        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExerciseImageStatus | "");
            resetPagination();
          }}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-3 text-text-primary"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovadas</option>
          <option value="REJECTED">Rejeitadas</option>
        </select>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {total} registros encontrados
        </p>

        <button
          type="button"
          onClick={() => void loadImages()}
          disabled={loading || processing}
          className={`${buttonClass} border border-border-default text-text-primary`}
        >
          Atualizar lista
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500 p-4">
          <p className="mb-3 text-sm text-red-400">{error}</p>

          <button
            type="button"
            onClick={() => void loadImages()}
            disabled={loading || processing}
            className={`${buttonClass} border border-border-default text-text-primary`}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {feedback && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-green-600 p-4 text-text-primary"
        >
          {feedback}
        </p>
      )}

      <section className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={selectAllVisible}
          disabled={loading || processing || selectableIds.length === 0}
          className={`${buttonClass} border border-border-default text-text-primary`}
        >
          {allVisibleSelected
            ? "Desmarcar imagens"
            : "Selecionar imagens da página"}
        </button>

        <span className="text-sm text-text-secondary">
          {selectedIds.length} selecionadas
        </span>

        <button
          type="button"
          disabled={loading || processing || selectedIds.length === 0}
          onClick={() => void handleBatchReview("APPROVED")}
          className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}
        >
          Aprovar selecionadas
        </button>

        <button
          type="button"
          disabled={loading || processing || selectedIds.length === 0}
          onClick={() => void handleBatchReview("REJECTED")}
          className={`${buttonClass} border border-red-500 text-red-400`}
        >
          Rejeitar selecionadas
        </button>
      </section>

      {loading ? (
        <p role="status" className="py-6 text-text-secondary">
          Carregando imagens...
        </p>
      ) : variations.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface p-8 text-center text-text-secondary">
          {error
            ? "Não foi possível carregar a listagem."
            : "Nenhuma imagem encontrada para os filtros selecionados."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {variations.map((variation) => (
            <article
              key={variation.id}
              className="min-w-0 rounded-xl border border-border-default bg-surface p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Selecionar ${variation.name}`}
                  checked={selectedIds.includes(variation.id)}
                  disabled={!variation.imageUrl || processing}
                  onChange={() => toggleSelection(variation.id)}
                  className="mt-1 h-5 w-5"
                />

                <div className="min-w-0">
                  <p className="text-xs text-text-secondary">
                    {variation.code}
                  </p>

                  <h2 className="font-semibold text-text-primary">
                    {variation.name}
                  </h2>

                  <p className="text-xs text-text-secondary">
                    {variation.exercise.name}
                  </p>
                </div>
              </div>

              <ImagePreview
                imageUrl={variation.imageUrl}
                name={variation.name}
              />

              <p className="mb-3 text-sm text-text-secondary">
                Status: {statusLabels[variation.imageReviewStatus]}
              </p>

              {variation.imageReviewNotes && (
                <p className="mb-3 text-sm text-text-secondary">
                  Observação: {variation.imageReviewNotes}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={processing || !variation.imageUrl}
                  onClick={() => void handleReview(variation, "APPROVED")}
                  className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}
                >
                  Aprovar
                </button>

                <button
                  type="button"
                  disabled={processing || !variation.imageUrl}
                  onClick={() => void handleReview(variation, "REJECTED")}
                  className={`${buttonClass} border border-red-500 text-red-400`}
                >
                  Rejeitar
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => void handleReview(variation, "PENDING")}
                  className={`${buttonClass} border border-border-default text-text-primary`}
                >
                  Pendente
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Exibindo {variations.length} de {total} registros
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || processing || skip === 0}
            onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            className={`${buttonClass} border border-border-default text-text-primary`}
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={
              loading || processing || skip + variations.length >= total
            }
            onClick={() => setSkip(skip + PAGE_SIZE)}
            className={`${buttonClass} border border-border-default text-text-primary`}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
