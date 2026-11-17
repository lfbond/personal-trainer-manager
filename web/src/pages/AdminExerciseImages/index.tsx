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

const inputClass =
  "min-h-11 w-full rounded-lg border border-border-default " +
  "bg-surface px-3 py-2 text-text-primary";

const buttonClass =
  "min-h-11 rounded-lg border border-border-default px-4 py-2 " +
  "text-sm font-semibold text-text-primary " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const labels: Record<ExerciseImageStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

function getError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string"
      ? message
      : `Falha na API (${error.response?.status ?? "conexão"}).`;
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function Preview({ variation }: { variation: ImageReviewVariation }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className="flex h-52 items-center justify-center overflow-hidden rounded-lg border border-border-default bg-page">
      {variation.imageUrl && failedUrl !== variation.imageUrl ? (
        <img
          src={variation.imageUrl}
          alt={`Imagem de ${variation.name}`}
          loading="lazy"
          onError={() => setFailedUrl(variation.imageUrl)}
          className="h-full w-full object-contain"
        />
      ) : (
        <p className="p-4 text-center text-sm text-text-secondary">
          {variation.imageUrl
            ? "Falha ao carregar a imagem."
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
  const [status, setStatus] = useState<ExerciseImageStatus | "">("");
  const [onlyWithoutImage, setOnlyWithoutImage] = useState(false);
  const [skip, setSkip] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selected, setSelected] = useState<ImageReviewVariation | null>(null);
  const [decision, setDecision] = useState<ExerciseImageStatus>("PENDING");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getExerciseImageReviews({
        search: search.trim() || undefined,
        status: status || undefined,
        onlyWithoutImage: onlyWithoutImage || undefined,
        take: PAGE_SIZE,
        skip,
      });

      setVariations(response.variations);
      setTotal(response.total);
    } catch (err) {
      setVariations([]);
      setTotal(0);
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [search, status, onlyWithoutImage, skip]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load]);

  function resetSelection() {
    setSelected(null);
    setNotes("");
    setDecision("PENDING");
  }

  function openReview(
    variation: ImageReviewVariation,
    nextDecision: ExerciseImageStatus,
  ) {
    if (loading || saving) return;

    if (!variation.imageUrl && nextDecision !== "PENDING") {
      setError("Uma imagem inexistente não pode ser aprovada ou rejeitada.");
      return;
    }

    setSelected(variation);
    setDecision(nextDecision);
    setNotes(variation.imageReviewNotes ?? "");
    setError("");
    setFeedback("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveReview() {
    if (!selected || saving) return;

    const reason = notes.trim();

    if (decision === "REJECTED" && reason.length < 10) {
      setError("A rejeição exige uma justificativa com 10 caracteres.");
      return;
    }

    if (!selected.imageUrl && decision !== "PENDING") {
      setError("Não é possível aprovar ou rejeitar uma imagem ausente.");
      return;
    }

    const confirmed = window.confirm(
      `Registrar "${labels[decision]}" para "${selected.name}"?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setFeedback("");

    try {
      await reviewExerciseImage(selected.id, {
        status: decision,
        notes: reason || null,
      });

      resetSelection();
      await load();
      setFeedback("Avaliação da imagem registrada com sucesso.");
    } catch (err) {
      setError(getError(err));
    } finally {
      setSaving(false);
    }
  }

  const hasPrevious = skip > 0;
  const hasNext = skip + variations.length < total;

  return (
    <div className="min-w-0">
      <PageHeader
        title="Auditoria de imagens"
        description="Revise todas as imagens do catálogo global, inclusive as ausentes, sem aprovações automáticas."
      />

      <section className="mb-6 rounded-xl border border-border-default bg-surface p-4">
        <h2 className="font-semibold">Revisão individual</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Verifique a execução representada, posição corporal, equipamentos e
          segurança. Exercícios sem imagem podem receber observações e
          permanecer pendentes.
        </p>
      </section>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <input
          type="search"
          aria-label="Pesquisar imagens"
          placeholder="Pesquisar nome ou código..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSkip(0);
            resetSelection();
          }}
          className={inputClass}
        />

        <select
          aria-label="Filtrar status da imagem"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExerciseImageStatus | "");
            setSkip(0);
            resetSelection();
          }}
          className={inputClass}
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendentes</option>
          <option value="APPROVED">Aprovadas</option>
          <option value="REJECTED">Rejeitadas</option>
        </select>

        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border-default px-3">
          <input
            type="checkbox"
            checked={onlyWithoutImage}
            onChange={(event) => {
              setOnlyWithoutImage(event.target.checked);
              setSkip(0);
              resetSelection();
            }}
          />
          <span className="text-sm">Somente sem imagem</span>
        </label>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {loading ? "Carregando..." : `${total} variações encontradas`}
        </p>
        <button
          type="button"
          className={buttonClass}
          disabled={loading || saving}
          onClick={() => void load()}
        >
          Atualizar
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500 p-4 text-red-400"
        >
          {error}
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-green-600 p-4"
        >
          {feedback}
        </p>
      )}

      {selected && (
        <section className="mb-7 rounded-xl border-2 border-green-600 bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{selected.name}</h2>
              <p className="text-sm text-text-secondary">{selected.code}</p>
            </div>
            <button
              type="button"
              className={buttonClass}
              onClick={resetSelection}
              disabled={saving}
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 max-w-xl">
            <Preview variation={selected} />
          </div>

          <p className="mt-4 text-sm">
            Decisão: <strong>{labels[decision]}</strong>
          </p>

          {!selected.imageUrl && (
            <p className="mt-3 text-sm text-text-secondary">
              Imagem ausente: registre a necessidade de produção ou inclusão no
              campo de observações.
            </p>
          )}

          <label className="mt-4 grid gap-2 text-sm">
            Observações da revisão
            <textarea
              rows={4}
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Descreva o problema ou a imagem necessária..."
              className={inputClass}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void saveReview()}
              disabled={
                saving || (decision === "REJECTED" && notes.trim().length < 10)
              }
              className={`${buttonClass} !border-green-600 !bg-green-600 !text-white`}
            >
              {saving ? "Salvando..." : "Confirmar avaliação"}
            </button>
            <button
              type="button"
              onClick={resetSelection}
              disabled={saving}
              className={buttonClass}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <p role="status" className="py-8">
          Carregando imagens...
        </p>
      ) : variations.length === 0 ? (
        <p className="rounded-xl border border-border-default bg-surface p-8">
          Nenhuma variação encontrada.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {variations.map((variation) => (
            <article
              key={variation.id}
              className="rounded-xl border border-border-default bg-surface p-4"
            >
              <p className="text-xs text-text-secondary">{variation.code}</p>
              <h2 className="mb-3 font-semibold">{variation.name}</h2>

              <Preview variation={variation} />

              <p className="mt-3 text-sm text-text-secondary">
                {variation.imageUrl
                  ? "Imagem cadastrada"
                  : "Sem imagem cadastrada"}
                {" • "}
                {labels[variation.imageReviewStatus]}
              </p>

              {variation.imageReviewNotes && (
                <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                  {variation.imageReviewNotes}
                </p>
              )}

              <a
                href={`/admin/catalog?exerciseId=${encodeURIComponent(
                  variation.exercise.id,
                )}&variationId=${encodeURIComponent(variation.id)}`}
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-text-primary hover:bg-green-600/10"
              >
                Ver ficha técnica completa
              </a>

              <div className="mt-4 flex flex-wrap gap-2">
                {variation.imageUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => openReview(variation, "APPROVED")}
                      disabled={saving}
                      className={`${buttonClass} !border-green-600`}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => openReview(variation, "REJECTED")}
                      disabled={saving}
                      className={`${buttonClass} !border-red-500`}
                    >
                      Rejeitar
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => openReview(variation, "PENDING")}
                  disabled={saving}
                  className={buttonClass}
                >
                  {variation.imageUrl
                    ? "Marcar pendente"
                    : "Registrar imagem ausente"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Página {Math.floor(skip / PAGE_SIZE) + 1}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={loading || saving || !hasPrevious}
            onClick={() => {
              setSkip(Math.max(0, skip - PAGE_SIZE));
              resetSelection();
            }}
          >
            Anterior
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={loading || saving || !hasNext}
            onClick={() => {
              setSkip(skip + PAGE_SIZE);
              resetSelection();
            }}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
