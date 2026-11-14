import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";

import {
  getExerciseImageReviews,
  reviewExerciseImage,
  type ImageReviewVariation,
} from "../../services/exercise-images";

import type { ExerciseImageStatus } from "../../types/exercise";

const PAGE_SIZE = 50;

const buttonClass =
  "min-h-11 rounded-lg px-4 py-2 text-sm font-semibold " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const inputClass =
  "min-h-11 w-full rounded-lg border border-border-default " +
  "bg-surface px-3 py-2 text-text-primary";

const statusLabels: Record<ExerciseImageStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

type ReviewDecision = "APPROVED" | "REJECTED" | "PENDING";

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
          alt={`Demonstração do exercício: ${name}`}
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

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selectedVariation, setSelectedVariation] =
    useState<ImageReviewVariation | null>(null);

  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [notes, setNotes] = useState("");

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
    } catch (err) {
      setVariations([]);
      setTotal(0);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, search, skip]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadImages();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadImages]);

  function resetPagination() {
    setSkip(0);
    setSelectedVariation(null);
    setDecision(null);
    setNotes("");
  }

  function openReview(
    variation: ImageReviewVariation,
    nextDecision: ReviewDecision,
  ) {
    if (processingId !== null || loading) return;

    if (!variation.imageUrl) {
      setError("Esta variação não possui imagem cadastrada para avaliação.");
      return;
    }

    setSelectedVariation(variation);
    setDecision(nextDecision);
    setNotes("");
    setError("");
    setFeedback("");
  }

  function closeReview() {
    if (processingId !== null) return;

    setSelectedVariation(null);
    setDecision(null);
    setNotes("");
  }

  async function handleReview() {
    if (!selectedVariation || !decision || processingId !== null) {
      return;
    }

    const trimmedNotes = notes.trim();

    if (decision === "REJECTED" && trimmedNotes.length < 10) {
      setError("Informe uma justificativa com pelo menos 10 caracteres.");
      return;
    }

    const confirmed = window.confirm(
      `Confirmar a decisão "${statusLabels[decision]}" ` +
        `para a imagem de "${selectedVariation.name}"?\n\n` +
        "Esta decisão será registrada no sistema.",
    );

    if (!confirmed) return;

    const variationId = selectedVariation.id;
    const variationName = selectedVariation.name;

    setProcessingId(variationId);
    setError("");
    setFeedback("");

    try {
      await reviewExerciseImage(variationId, {
        status: decision,
        notes: trimmedNotes || null,
      });

      setFeedback(
        `Imagem de "${variationName}" atualizada para ` +
          `"${statusLabels[decision]}" com sucesso.`,
      );

      setSelectedVariation(null);
      setDecision(null);
      setNotes("");

      await loadImages();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  }

  const hasPreviousPage = skip > 0;
  const hasNextPage = skip + variations.length < total;

  return (
    <div className="min-w-0">
      <PageHeader
        title="Auditoria de imagens"
        description="Avaliação individual das imagens utilizadas no catálogo de exercícios."
      />

      <section className="mb-6 rounded-xl border border-border-default bg-surface p-4">
        <h2 className="font-semibold text-text-primary">
          Revisão visual obrigatória
        </h2>

        <p className="mt-2 text-sm text-text-secondary">
          Cada imagem deve ser analisada individualmente por um profissional
          autorizado. A aprovação científica do exercício não significa
          aprovação automática da imagem.
        </p>

        <p className="mt-2 text-sm text-text-secondary">
          Verifique a posição corporal, a execução representada, o equipamento,
          a coerência anatômica e eventuais riscos antes de registrar uma
          decisão.
        </p>
      </section>

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
          className={inputClass}
        />

        <select
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExerciseImageStatus | "");
            resetPagination();
          }}
          className={inputClass}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovadas</option>
          <option value="REJECTED">Rejeitadas</option>
        </select>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {loading ? "Carregando..." : `${total} registros encontrados`}
        </p>

        <button
          type="button"
          onClick={() => void loadImages()}
          disabled={loading || processingId !== null}
          className={`${buttonClass} border border-border-default text-text-primary`}
        >
          Atualizar lista
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-500 p-4">
          <p className="text-sm text-red-400">{error}</p>

          <button
            type="button"
            onClick={() => void loadImages()}
            disabled={loading || processingId !== null}
            className={`${buttonClass} mt-3 border border-border-default text-text-primary`}
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
              <div className="mb-3">
                <p className="text-xs text-text-secondary">{variation.code}</p>

                <h2 className="font-semibold text-text-primary">
                  {variation.name}
                </h2>

                <p className="text-xs text-text-secondary">
                  {variation.exercise.name}
                </p>
              </div>

              <ImagePreview
                imageUrl={variation.imageUrl}
                name={variation.name}
              />

              <p className="mb-3 text-sm text-text-secondary">
                Status: {statusLabels[variation.imageReviewStatus]}
              </p>

              {variation.imageReviewNotes && (
                <p className="mb-3 whitespace-pre-line text-sm text-text-secondary">
                  <strong>Observação: </strong>
                  {variation.imageReviewNotes}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    processingId !== null || loading || !variation.imageUrl
                  }
                  onClick={() => openReview(variation, "APPROVED")}
                  className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}
                >
                  Aprovar imagem
                </button>

                <button
                  type="button"
                  disabled={
                    processingId !== null || loading || !variation.imageUrl
                  }
                  onClick={() => openReview(variation, "REJECTED")}
                  className={`${buttonClass} border border-red-500 text-red-400`}
                >
                  Rejeitar imagem
                </button>

                <button
                  type="button"
                  disabled={
                    processingId !== null || loading || !variation.imageUrl
                  }
                  onClick={() => openReview(variation, "PENDING")}
                  className={`${buttonClass} border border-border-default text-text-primary`}
                >
                  Marcar pendente
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedVariation && decision && (
        <section
          aria-label="Registrar avaliação da imagem"
          className="mt-8 rounded-xl border border-border-default bg-surface p-4 sm:p-6"
        >
          <h2 className="text-xl font-bold text-text-primary">
            Avaliação da imagem: {selectedVariation.name}
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            Decisão: {statusLabels[decision]}
          </p>

          <div className="mt-5 max-w-xl">
            <ImagePreview
              imageUrl={selectedVariation.imageUrl}
              name={selectedVariation.name}
            />
          </div>

          <label
            htmlFor="image-review-notes"
            className="mt-5 block text-sm font-medium text-text-primary"
          >
            {decision === "REJECTED"
              ? "Justificativa da rejeição"
              : "Observações da avaliação (opcional)"}
          </label>

          <textarea
            id="image-review-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            maxLength={3000}
            placeholder={
              decision === "REJECTED"
                ? "Descreva o problema visual e a correção necessária..."
                : "Registre observações relevantes..."
            }
            className={`${inputClass} mt-2`}
          />

          {decision === "REJECTED" && (
            <p className="mt-2 text-xs text-text-secondary">
              A justificativa deve conter pelo menos 10 caracteres.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={
                processingId !== null ||
                (decision === "REJECTED" && notes.trim().length < 10)
              }
              onClick={() => void handleReview()}
              className={`${buttonClass} bg-green-600 text-white hover:bg-green-700`}
            >
              {processingId === selectedVariation.id
                ? "Salvando avaliação..."
                : "Confirmar decisão"}
            </button>

            <button
              type="button"
              disabled={processingId !== null}
              onClick={closeReview}
              className={`${buttonClass} border border-border-default text-text-primary`}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Exibindo {variations.length} de {total} registros
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || processingId !== null || !hasPreviousPage}
            onClick={() => setSkip(Math.max(0, skip - PAGE_SIZE))}
            className={`${buttonClass} border border-border-default text-text-primary`}
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={loading || processingId !== null || !hasNextPage}
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
