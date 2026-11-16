import { useCallback, useEffect, useState } from "react";

import axios from "axios";

import { ConfirmModal } from "../ConfirmModal";

import {
  getExerciseImageProposals,
  reviewExerciseImageProposal,
  type ExerciseImageProposal,
  type ImageProposalStatus,
} from "../../services/exercise-image-proposals";

interface Props {
  onUpdated?: () => Promise<void> | void;
}

const actionLabels = {
  ADD: "Adicionar imagem",
  REPLACE: "Substituir imagem",
  REMOVE: "Remover imagem",
};

const statusLabels = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const buttonClass =
  "min-h-10 rounded-lg border border-primary bg-primary " +
  "px-4 py-2 text-sm font-semibold text-white " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const secondaryClass =
  "min-h-10 rounded-lg border border-border-default " +
  "px-4 py-2 text-sm font-semibold " +
  "disabled:cursor-not-allowed disabled:opacity-40";

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function ImageComparison({
  label,
  url,
}: {
  label: string;
  url: string | null;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold">{label}</p>

      <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-border-default bg-page">
        {!url ? (
          <p className="p-3 text-center text-xs text-text-secondary">
            Sem imagem
          </p>
        ) : failedUrl === url ? (
          <p className="p-3 text-center text-xs text-red-500">
            Falha ao carregar imagem.
          </p>
        ) : (
          <img
            src={url}
            alt={label}
            loading="lazy"
            className="h-full w-full object-contain"
            onError={() => setFailedUrl(url)}
          />
        )}
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block break-all text-xs text-primary underline"
        >
          Abrir imagem
        </a>
      )}
    </div>
  );
}

export function ExerciseImageProposalQueue({ onUpdated }: Props) {
  const [status, setStatus] = useState<ImageProposalStatus>("PENDING");

  const [proposals, setProposals] = useState<ExerciseImageProposal[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selected, setSelected] = useState<ExerciseImageProposal | null>(null);

  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );

  const [notes, setNotes] = useState("");

  // ============================================================
  // RECARREGAMENTO MANUAL
  // ============================================================

  const loadProposals = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getExerciseImageProposals(status);

      setProposals(result.proposals);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  // ============================================================
  // CARREGAMENTO INICIAL E MUDANÇA DE FILTRO
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchProposals() {
      try {
        const result = await getExerciseImageProposals(status);

        if (!cancelled) {
          setProposals(result.proposals);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProposals();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // ============================================================
  // ALTERAR FILTRO
  // ============================================================

  function changeStatus(nextStatus: ImageProposalStatus) {
    if (saving || nextStatus === status) {
      return;
    }

    setStatus(nextStatus);
    setProposals([]);
    setLoading(true);
    setError("");
    setFeedback("");
  }

  // ============================================================
  // INICIAR REVISÃO
  // ============================================================

  function beginReview(
    proposal: ExerciseImageProposal,
    nextDecision: "APPROVED" | "REJECTED",
  ) {
    setSelected(proposal);
    setDecision(nextDecision);
    setNotes("");
    setError("");
    setFeedback("");
  }

  function cancelReview() {
    if (saving) return;

    setSelected(null);
    setDecision(null);
    setNotes("");
    setError("");
  }

  // ============================================================
  // CONFIRMAR APROVAÇÃO OU REJEIÇÃO
  // ============================================================

  async function confirmReview() {
    if (!selected || !decision || saving) {
      return;
    }

    if (decision === "REJECTED" && !notes.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }

    setSaving(true);
    setError("");
    setFeedback("");

    try {
      const result = await reviewExerciseImageProposal(
        selected.id,
        decision,
        notes,
      );

      setSelected(null);
      setDecision(null);
      setNotes("");

      setFeedback(result.message);

      // A operação foi concluída no backend.
      // Falhas de atualização da tela não devem
      // ser apresentadas como falhas da revisão.
      try {
        await loadProposals();
      } catch {
        setFeedback(result.message + " Atualize a lista de propostas.");
      }

      if (onUpdated) {
        try {
          await onUpdated();
        } catch {
          setFeedback(
            result.message + " Atualize o catálogo para visualizar a imagem.",
          );
        }
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-5 rounded-xl border border-border-default bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Propostas de imagens</h2>

          <p className="mt-1 text-sm text-text-secondary">
            Analise as solicitações antes de alterar as imagens oficiais do
            catálogo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadProposals()}
          disabled={loading || saving}
          className={secondaryClass}
        >
          Atualizar propostas
        </button>
      </div>

      {/* FILTROS */}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => changeStatus(item)}
            disabled={saving}
            aria-pressed={status === item}
            className={status === item ? buttonClass : secondaryClass}
          >
            {statusLabels[item]}
          </button>
        ))}
      </div>

      {/* ERROS */}

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-500 p-3 text-sm text-red-500"
        >
          {error}
        </p>
      )}

      {/* FEEDBACK */}

      {feedback && (
        <p
          role="status"
          className="mt-3 rounded-lg border border-primary p-3 text-sm text-primary"
        >
          {feedback}
        </p>
      )}

      {/* LISTAGEM */}

      {loading ? (
        <p className="mt-4 text-sm text-text-secondary">
          Carregando propostas...
        </p>
      ) : proposals.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          Nenhuma proposta encontrada neste filtro.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {proposals.map((proposal) => (
            <article
              key={proposal.id}
              className="rounded-lg border border-border-default p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {proposal.exerciseVariation.name}
                  </h3>

                  <p className="text-xs text-text-secondary">
                    {proposal.exerciseVariation.exercise.name}
                    {" • "}
                    {proposal.exerciseVariation.code}
                  </p>
                </div>

                <span className="rounded-full border border-border-default px-3 py-1 text-xs">
                  {actionLabels[proposal.action]}
                </span>
              </div>

              <div className="mt-3 grid gap-1 text-xs text-text-secondary">
                <p>
                  Solicitado por: <strong>{proposal.proposedBy.name}</strong>
                </p>

                <p>
                  Enviado em:{" "}
                  {new Date(proposal.createdAt).toLocaleString("pt-BR")}
                </p>

                <p>Situação: {statusLabels[proposal.status]}</p>
              </div>

              {/* COMPARAÇÃO DAS IMAGENS */}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ImageComparison
                  label="Imagem anterior"
                  url={proposal.previousImageUrl}
                />

                <ImageComparison
                  label="Imagem proposta"
                  url={proposal.proposedImageUrl}
                />
              </div>

              {/* AÇÕES DE APROVAÇÃO */}

              {proposal.status === "PENDING" && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => beginReview(proposal, "APPROVED")}
                    className={buttonClass}
                  >
                    Aprovar
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => beginReview(proposal, "REJECTED")}
                    className={secondaryClass}
                  >
                    Rejeitar
                  </button>
                </div>
              )}

              {/* HISTÓRICO DA JUSTIFICATIVA */}

              {proposal.reviewNotes && (
                <p className="mt-3 rounded-lg border border-border-default p-3 text-xs">
                  <strong>Justificativa: </strong>
                  {proposal.reviewNotes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}

      {/* FORMULÁRIO DE REJEIÇÃO */}

      {selected && decision === "REJECTED" && (
        <div className="mt-4 rounded-lg border border-border-default bg-page p-4">
          <h3 className="font-semibold">Rejeitar proposta de imagem</h3>

          <p className="mt-2 text-sm text-text-secondary">
            {selected.exerciseVariation.name}
          </p>

          <label className="mt-3 grid gap-2 text-sm">
            Motivo da rejeição
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              maxLength={2000}
              disabled={saving}
              placeholder="Explique por que a imagem não foi aprovada..."
              className="w-full rounded-lg border border-border-default bg-surface p-3"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || !notes.trim()}
              onClick={() => void confirmReview()}
              className={buttonClass}
            >
              {saving ? "Rejeitando..." : "Confirmar rejeição"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={cancelReview}
              className={secondaryClass}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE APROVAÇÃO */}

      <ConfirmModal
        open={selected !== null && decision === "APPROVED"}
        title="Confirmar aprovação"
        message={
          selected
            ? `Deseja aprovar a proposta para "${selected.exerciseVariation.name}"?\n\nA imagem oficial será atualizada.`
            : ""
        }
        confirmLabel="Aprovar imagem"
        loading={saving}
        onConfirm={() => void confirmReview()}
        onCancel={cancelReview}
      />
    </section>
  );
}
