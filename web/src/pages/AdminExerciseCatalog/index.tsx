import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ExerciseImageEditor } from "../../components/ExerciseImageEditor";
import { ExerciseImageProposalQueue } from "../../components/ExerciseImageProposalQueue";

import {
  getAdminCatalog,
  getGlobalExercise,
  updateGlobalVariation,
  type UpdateGlobalVariationInput,
} from "../../services/exercise-catalog-admin";

import {
  getExerciseImagePermissions,
  type ExerciseImagePermissions,
} from "../../services/exercise-image-proposals";

import type {
  Exercise,
  ExerciseVariation,
  ExerciseStatus,
  MuscleGroup,
} from "../../types/exercise";

const PAGE_SIZE = 25;

const groupLabels: Record<MuscleGroup, string> = {
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

const statusLabels: Record<ExerciseStatus, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Publicado",
  INACTIVE: "Inativo",
};

const categoryLabels = {
  MACHINE_CABLE: "Máquinas / Cabos",
  FREE_WEIGHT: "Pesos livres",
};

const levelLabels = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

const imageStatusLabels = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

const inputClass =
  "min-h-10 w-full rounded-lg border border-border-default " +
  "bg-surface px-3 py-2 text-sm text-text-primary " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary";

const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center " +
  "rounded-lg border border-primary bg-primary " +
  "px-4 py-2 text-sm font-semibold text-white " +
  "transition-colors hover:bg-primary-hover " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center " +
  "rounded-lg border border-primary bg-surface " +
  "px-4 py-2 text-sm font-semibold text-text-primary " +
  "transition-colors hover:bg-page " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary " +
  "disabled:cursor-not-allowed disabled:opacity-40";

type EditForm = {
  name: string;
  category: ExerciseVariation["category"];
  level: ExerciseVariation["level"];
  equipment: string;
  subgroup: string;
  description: string;
  instructions: string;
  safetyNotes: string;
  muscleExplanation: string;
};

type SelectedExercise = {
  exercise: Exercise;
  variation: ExerciseVariation;
};

type VariationMuscle = {
  muscleId: string;
  role: "PRIMARY" | "SECONDARY";
  explanation: string | null;
  muscle: {
    id: string;
    code: string;
    name: string;
  };
};

type VariationWithDetails = ExerciseVariation & {
  muscles?: VariationMuscle[];
  needsEditorialReview?: boolean;
};

type Notice = {
  kind: "success" | "error";
  title: string;
  message: string;
};

function makeForm(variation: ExerciseVariation): EditForm {
  return {
    name: variation.name,
    category: variation.category,
    level: variation.level,
    equipment: variation.equipment ?? "",
    subgroup: variation.subgroup ?? "",
    description: variation.description ?? "",
    instructions: variation.instructions ?? "",
    safetyNotes: variation.safetyNotes ?? "",
    muscleExplanation: variation.muscleExplanation ?? "",
  };
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    return error.response
      ? `Erro HTTP ${error.response.status}.`
      : "Não foi possível conectar à API.";
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
}

function findVariation(
  exercises: Exercise[],
  variationId: string,
): SelectedExercise | null {
  for (const exercise of exercises) {
    const variation = exercise.variations.find(
      (item) => item.id === variationId,
    );

    if (variation) {
      return { exercise, variation };
    }
  }

  return null;
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-secondary">{label}</dt>

      <dd className="mt-1 break-words text-sm font-medium">
        {value || "Não informado"}
      </dd>
    </div>
  );
}

function TechnicalField({
  title,
  content,
}: {
  title: string;
  content: string | null | undefined;
}) {
  return (
    <section className="min-w-0">
      <h3 className="text-sm font-semibold">{title}</h3>

      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
        {content || "Não informado."}
      </p>
    </section>
  );
}

function ImagePreview({ variation }: { variation: ExerciseVariation }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const hasImage =
    Boolean(variation.imageUrl) && failedUrl !== variation.imageUrl;

  return (
    <div className="w-full max-w-80">
      <div className="flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border-default bg-page">
        {hasImage && variation.imageUrl ? (
          <a
            href={variation.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ampliar imagem"
            className="flex h-full w-full items-center justify-center"
          >
            <img
              src={variation.imageUrl}
              alt={`Ilustração de ${variation.name}`}
              loading="lazy"
              className="h-full w-full object-contain"
              onError={() => setFailedUrl(variation.imageUrl)}
            />
          </a>
        ) : (
          <p className="px-4 text-center text-xs text-text-secondary">
            {variation.imageUrl
              ? "Falha ao carregar a imagem."
              : "Imagem não cadastrada."}
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-secondary">
          Imagem: {imageStatusLabels[variation.imageReviewStatus]}
        </span>

        {hasImage && variation.imageUrl && (
          <a
            href={variation.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary underline"
          >
            Ampliar
          </a>
        )}
      </div>
    </div>
  );
}

export function AdminExerciseCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedExerciseId = searchParams.get("exerciseId");
  const requestedVariationId = searchParams.get("variationId");

  // ============================================================
  // CATÁLOGO
  // ============================================================

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "">("");
  const [status, setStatus] = useState<ExerciseStatus | "">("");
  const [skip, setSkip] = useState(0);

  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [selected, setSelected] = useState<SelectedExercise | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);

  // ============================================================
  // MODAIS
  // ============================================================

  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // ============================================================
  // PERMISSÕES DE IMAGENS
  // ============================================================

  const [imagePermissions, setImagePermissions] =
    useState<ExerciseImagePermissions | null>(null);

  const [imagePermissionsError, setImagePermissionsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadImagePermissions() {
      try {
        const permissions = await getExerciseImagePermissions();

        if (!cancelled) {
          setImagePermissions(permissions);
          setImagePermissionsError("");
        }
      } catch (err) {
        if (!cancelled) {
          setImagePermissions(null);
          setImagePermissionsError(errorMessage(err));
        }
      }
    }

    void loadImagePermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // CARREGAMENTO DO CATÁLOGO
  // ============================================================

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminCatalog({
        search: search || undefined,
        muscleGroup: group || undefined,
        status: status || undefined,
        take: PAGE_SIZE,
        skip,
      });

      setExercises(result.exercises);
      setTotal(result.total);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, group, status, skip]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCatalog();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadCatalog]);

  // ============================================================
  // ABERTURA POR LINK DA AUDITORIA
  // ============================================================

  useEffect(() => {
    if (!requestedExerciseId || !requestedVariationId) {
      return;
    }

    let cancelled = false;

    async function openRequestedExercise() {
      setOpening(true);
      setError("");

      try {
        const exercise = await getGlobalExercise(requestedExerciseId!);

        if (cancelled) return;

        const variation = exercise.variations.find(
          (item) => item.id === requestedVariationId,
        );

        if (!variation) {
          setError("A variação solicitada não foi encontrada.");
          return;
        }

        setSelected({ exercise, variation });
        setForm(makeForm(variation));
        setEditing(false);
      } catch (err) {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setOpening(false);
        }
      }
    }

    void openRequestedExercise();

    return () => {
      cancelled = true;
    };
  }, [requestedExerciseId, requestedVariationId]);

  // ============================================================
  // SELEÇÃO DE EXERCÍCIOS
  // ============================================================

  function resetSelection() {
    setSelected(null);
    setEditing(false);
    setForm(null);
    setFeedback("");
    setConfirmSaveOpen(false);

    if (requestedExerciseId || requestedVariationId) {
      setSearchParams({}, { replace: true });
    }
  }

  function openVariation(exercise: Exercise, variation: ExerciseVariation) {
    setSelected({ exercise, variation });
    setForm(makeForm(variation));
    setEditing(false);
    setError("");
    setFeedback("");
    setNotice(null);
    setConfirmSaveOpen(false);

    if (requestedExerciseId || requestedVariationId) {
      setSearchParams({}, { replace: true });
    }
  }

  function updateField<K extends keyof EditForm>(field: K, value: EditForm[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  // ============================================================
  // ATUALIZAÇÃO APÓS ALTERAR IMAGEM
  // ============================================================

  async function refreshSelectedImage() {
    if (!selected) {
      await loadCatalog();
      return;
    }

    const exercise = await getGlobalExercise(selected.exercise.id);

    const variation = exercise.variations.find(
      (item) => item.id === selected.variation.id,
    );

    if (!variation) {
      throw new Error("A variação não foi encontrada após a atualização.");
    }

    setSelected({ exercise, variation });

    setExercises((current) =>
      current.map((item) => (item.id === exercise.id ? exercise : item)),
    );
  }

  // ============================================================
  // VALIDAÇÃO DA EDIÇÃO TÉCNICA
  // ============================================================

  function handleSave() {
    if (!selected || !form || saving || selected.variation.trainerId !== null) {
      return;
    }

    if (form.name.trim().length < 3) {
      const message = "Informe um nome com pelo menos 3 caracteres.";

      setError(message);

      setNotice({
        kind: "error",
        title: "Dados inválidos",
        message,
      });

      return;
    }

    setError("");
    setFeedback("");
    setNotice(null);
    setConfirmSaveOpen(true);
  }

  // ============================================================
  // SALVAR EDIÇÃO TÉCNICA
  // ============================================================

  async function confirmSave() {
    if (!selected || !form || saving || selected.variation.trainerId !== null) {
      return;
    }

    if (form.name.trim().length < 3) {
      setConfirmSaveOpen(false);

      setNotice({
        kind: "error",
        title: "Dados inválidos",
        message: "Informe um nome com pelo menos 3 caracteres.",
      });

      return;
    }

    const payload: UpdateGlobalVariationInput = {
      name: form.name.trim(),
      category: form.category,
      level: form.level,
      equipment: form.equipment.trim() || null,
      subgroup: form.subgroup.trim() || null,
      description: form.description.trim() || null,
      instructions: form.instructions.trim() || null,
      safetyNotes: form.safetyNotes.trim() || null,
      muscleExplanation: form.muscleExplanation.trim() || null,
    };

    setSaving(true);
    setError("");
    setFeedback("");

    try {
      const updated = await updateGlobalVariation(
        selected.variation.id,
        payload,
      );

      const updatedSelection: SelectedExercise = {
        exercise: selected.exercise,
        variation: {
          ...selected.variation,
          ...updated,
        },
      };

      setSelected(updatedSelection);

      setExercises((current) =>
        current.map((exercise) => ({
          ...exercise,
          variations: exercise.variations.map((variation) =>
            variation.id === updated.id
              ? { ...variation, ...updated }
              : variation,
          ),
        })),
      );

      setForm(makeForm(updatedSelection.variation));
      setEditing(false);
      setConfirmSaveOpen(false);

      const message = "Alterações salvas com sucesso.";

      setFeedback(message);

      setNotice({
        kind: "success",
        title: "Alterações salvas",
        message,
      });
    } catch (err) {
      const message = errorMessage(err);

      setError(message);
      setConfirmSaveOpen(false);

      setNotice({
        kind: "error",
        title: "Não foi possível salvar",
        message,
      });
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // INDICADORES E PAGINAÇÃO
  // ============================================================

  const variationsCount = exercises.reduce(
    (count, exercise) => count + exercise.variations.length,
    0,
  );

  const hasPrevious = skip > 0;
  const hasNext = skip + exercises.length < total;

  const selectedIsOnCurrentPage =
    selected !== null &&
    findVariation(exercises, selected.variation.id) !== null;

  const visibleExercises =
    selected && !selectedIsOnCurrentPage
      ? [selected.exercise, ...exercises]
      : exercises;

  const canEdit = selected?.variation.trainerId === null;

  const selectedVariation = selected?.variation as
    | VariationWithDetails
    | undefined;

  // ============================================================
  // FICHA TÉCNICA
  // ============================================================

  function renderSelectedDetails() {
    if (!selected) return null;

    return (
      <section
        id="exercise-review-panel"
        aria-label={`Ficha técnica de ${selected.variation.name}`}
        className="mt-4 min-w-0 rounded-xl border border-primary bg-surface p-4"
      >
        {/* CABEÇALHO */}

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold">{selected.variation.name}</h3>

            <p className="mt-1 text-xs text-text-secondary">
              {selected.variation.code}
              {" • "}
              {groupLabels[selected.exercise.muscleGroup]}
              {" • "}
              {categoryLabels[selected.variation.category]}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border-default px-3 py-1 text-xs">
              {statusLabels[selected.variation.status]}
            </span>

            <button
              type="button"
              onClick={resetSelection}
              disabled={saving}
              className={secondaryButtonClass}
            >
              Fechar ficha
            </button>
          </div>
        </div>

        {/* IMAGEM OFICIAL E INFORMAÇÕES */}

        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <ImagePreview
            key={`${selected.variation.id}:${selected.variation.imageUrl ?? ""}`}
            variation={selected.variation}
          />

          <dl className="grid content-start grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-3">
            <DetailField
              label="Exercício-base"
              value={selected.exercise.name}
            />

            <DetailField
              label="Nível"
              value={levelLabels[selected.variation.level]}
            />

            <DetailField
              label="Equipamento"
              value={selected.variation.equipment}
            />

            <DetailField label="Subgrupo" value={selected.variation.subgroup} />

            <DetailField
              label="Situação do catálogo"
              value={
                selectedVariation?.needsEditorialReview
                  ? "Pendente de conferência"
                  : statusLabels[selected.variation.status]
              }
            />

            <DetailField
              label="Atualizado em"
              value={new Date(selected.variation.updatedAt).toLocaleDateString(
                "pt-BR",
              )}
            />
          </dl>
        </div>

        {/* OBSERVAÇÕES DA IMAGEM */}

        {selected.variation.imageReviewNotes && (
          <p className="mt-3 rounded-lg border border-border-default p-3 text-xs text-text-secondary">
            <strong>Observação da imagem: </strong>
            {selected.variation.imageReviewNotes}
          </p>
        )}

        {/* GERENCIAMENTO DE IMAGENS */}

        {imagePermissions &&
          selected.variation.trainerId === null &&
          (imagePermissions.canManage || imagePermissions.canPropose) && (
            <ExerciseImageEditor
              key={selected.variation.id}
              variationId={selected.variation.id}
              variationName={selected.variation.name}
              imageUrl={selected.variation.imageUrl}
              permissions={imagePermissions}
              onUpdated={refreshSelectedImage}
            />
          )}

        {/* INFORMAÇÕES TÉCNICAS */}

        {!editing && (
          <div className="mt-4 grid gap-4 border-t border-border-default pt-4 md:grid-cols-2">
            <TechnicalField
              title="Descrição"
              content={selected.variation.description}
            />

            <TechnicalField
              title="Execução"
              content={selected.variation.instructions}
            />

            <TechnicalField
              title="Segurança"
              content={selected.variation.safetyNotes}
            />

            <TechnicalField
              title="Explicação muscular"
              content={selected.variation.muscleExplanation}
            />

            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold">Músculos envolvidos</h3>

              {selectedVariation?.muscles?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedVariation.muscles.map((item) => (
                    <div
                      key={item.muscleId}
                      className="rounded-lg border border-border-default px-3 py-2 text-xs"
                    >
                      <strong>{item.muscle.name}</strong>
                      {" • "}
                      {item.role === "PRIMARY" ? "Primário" : "Secundário"}

                      {item.explanation && (
                        <p className="mt-1 text-text-secondary">
                          {item.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-text-secondary">
                  Nenhum músculo associado retornado pela API.
                </p>
              )}
            </div>
          </div>
        )}

        {/* EDIÇÃO TÉCNICA */}

        {editing && form && (
          <div className="mt-4 grid gap-3 border-t border-border-default pt-4">
            <h3 className="text-sm font-semibold">Editar informações</h3>

            <label className="grid gap-1 text-xs">
              Nome
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className={inputClass}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs">
                Categoria
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value as EditForm["category"],
                    )
                  }
                  className={inputClass}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-xs">
                Nível
                <select
                  value={form.level}
                  onChange={(event) =>
                    updateField(
                      "level",
                      event.target.value as EditForm["level"],
                    )
                  }
                  className={inputClass}
                >
                  {Object.entries(levelLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {(
              [
                ["equipment", "Equipamento"],
                ["subgroup", "Subgrupo"],
              ] as const
            ).map(([field, label]) => (
              <label key={field} className="grid gap-1 text-xs">
                {label}

                <input
                  value={form[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                  className={inputClass}
                />
              </label>
            ))}

            <div className="grid gap-3 md:grid-cols-2">
              {(
                [
                  ["description", "Descrição"],
                  ["instructions", "Execução"],
                  ["safetyNotes", "Segurança"],
                  ["muscleExplanation", "Explicação muscular"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="grid gap-1 text-xs">
                  {label}

                  <textarea
                    rows={3}
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || form.name.trim().length < 3}
                className={primaryButtonClass}
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(makeForm(selected.variation));
                  setError("");
                }}
                disabled={saving}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* AÇÕES DA FICHA */}

        {!editing && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-default pt-3">
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setForm(makeForm(selected.variation));
                  setEditing(true);
                  setError("");
                  setFeedback("");
                }}
                className={primaryButtonClass}
              >
                Editar exercício
              </button>
            ) : (
              <p className="text-xs text-text-secondary">
                Somente exercícios do catálogo global podem ser editados nesta
                tela.
              </p>
            )}

            {selected.variation.videoUrl && (
              <a
                href={selected.variation.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary underline"
              >
                Vídeo de referência
              </a>
            )}
          </div>
        )}
      </section>
    );
  }

  // ============================================================
  // INTERFACE PRINCIPAL
  // ============================================================

  return (
    <div className="min-w-0">
      {/* MODAL DE CONFIRMAÇÃO TÉCNICA */}

      <ConfirmModal
        open={confirmSaveOpen}
        title="Confirmar alterações"
        message={
          selected
            ? `Deseja salvar as alterações de "${selected.variation.name}"?\n\nO status atual do exercício será mantido.`
            : ""
        }
        confirmLabel="Confirmar e salvar"
        loading={saving}
        onConfirm={() => void confirmSave()}
        onCancel={() => setConfirmSaveOpen(false)}
      />

      {/* MODAL DE RESULTADO */}

      <ConfirmModal
        open={notice !== null}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        confirmLabel="Entendi"
        onConfirm={() => setNotice(null)}
        onCancel={() => setNotice(null)}
      />

      <PageHeader
        title="Catálogo completo de exercícios"
        description="Consulte e corrija informações técnicas, gerencie imagens e acompanhe propostas de atualização."
      />

      {/* ERRO DE PERMISSÕES */}

      {imagePermissionsError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500 p-3 text-sm text-red-500"
        >
          Não foi possível consultar as permissões de imagens:{" "}
          {imagePermissionsError}
        </p>
      )}

      {/* FILA DE APROVAÇÃO — SOMENTE AUTORIZADOS */}

      {imagePermissions?.canApprove && (
        <ExerciseImageProposalQueue onUpdated={refreshSelectedImage} />
      )}

      {/* INDICADORES */}

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm">
          <strong>{total}</strong> exercícios-base
        </span>

        <span className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm">
          <strong>{exercises.length}</strong> nesta página
        </span>

        <span className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm">
          <strong>{variationsCount}</strong> variações nesta página
        </span>
      </div>

      {/* PESQUISA */}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          resetSelection();
          setSkip(0);
          setSearch(searchInput.trim());
        }}
        className="mb-3 flex flex-wrap gap-2"
      >
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Pesquisar exercício-base..."
          aria-label="Pesquisar catálogo"
          className={`${inputClass} min-w-48 flex-1`}
        />

        <button type="submit" className={primaryButtonClass}>
          Pesquisar
        </button>
      </form>

      {/* FILTROS */}

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <select
          value={group}
          onChange={(event) => {
            setGroup(event.target.value as MuscleGroup | "");
            setSkip(0);
            resetSelection();
          }}
          aria-label="Grupo muscular"
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
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as ExerciseStatus | "");
            setSkip(0);
            resetSelection();
          }}
          aria-label="Status do exercício"
          className={inputClass}
        >
          <option value="">Todos os status</option>
          <option value="DRAFT">Rascunhos</option>
          <option value="ACTIVE">Publicados</option>
          <option value="INACTIVE">Inativos</option>
        </select>
      </div>

      {/* MENSAGENS */}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500 p-3 text-sm text-red-500"
        >
          {error}
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-primary p-3 text-sm text-primary"
        >
          {feedback}
        </p>
      )}

      {opening && (
        <p role="status" className="mb-4 text-sm text-text-secondary">
          Abrindo ficha técnica...
        </p>
      )}

      {/* LISTAGEM DO CATÁLOGO */}

      {loading ? (
        <p role="status" className="py-6 text-sm">
          Carregando catálogo...
        </p>
      ) : visibleExercises.length === 0 ? (
        <p className="rounded-lg border border-border-default bg-surface p-5 text-sm">
          Nenhum exercício encontrado.
        </p>
      ) : (
        <div className="grid gap-3">
          {visibleExercises.map((exercise) => {
            const isLinkedExercise =
              selected?.exercise.id === exercise.id && !selectedIsOnCurrentPage;

            return (
              <article
                key={exercise.id}
                className={
                  isLinkedExercise
                    ? "min-w-0 rounded-lg border border-primary bg-surface p-3"
                    : "min-w-0 rounded-lg border border-border-default bg-surface p-3"
                }
              >
                {/* CABEÇALHO DO EXERCÍCIO-BASE */}

                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold">{exercise.name}</h2>

                    <p className="text-xs text-text-secondary">
                      {exercise.code}
                      {" • "}
                      {groupLabels[exercise.muscleGroup]}
                      {" • "}
                      {exercise.variations.length} variações
                    </p>
                  </div>

                  {isLinkedExercise && (
                    <span className="rounded-full border border-primary px-3 py-1 text-xs text-primary">
                      Aberto pela lista de conferência
                    </span>
                  )}
                </div>

                {/* CARDS DAS VARIAÇÕES */}

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {exercise.variations.map((variation) => {
                    const isSelected = selected?.variation.id === variation.id;

                    return (
                      <div
                        key={variation.id}
                        className={
                          isSelected
                            ? "min-w-0 rounded-lg border border-primary bg-page p-3 md:col-span-2 xl:col-span-3"
                            : "min-w-0 rounded-lg border border-border-default p-3"
                        }
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words font-semibold">
                              {variation.name}
                            </p>

                            <p className="text-xs text-text-secondary">
                              {variation.code}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={saving}
                            aria-expanded={isSelected}
                            aria-controls={
                              isSelected ? "exercise-review-panel" : undefined
                            }
                            onClick={() => {
                              if (isSelected) {
                                resetSelection();
                              } else {
                                openVariation(exercise, variation);
                              }
                            }}
                            className={
                              isSelected
                                ? secondaryButtonClass
                                : primaryButtonClass
                            }
                          >
                            {isSelected ? "Fechar" : "Ver ficha"}
                          </button>
                        </div>

                        {/* FICHA TÉCNICA NO CARD */}

                        {isSelected && renderSelectedDetails()}
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* PAGINAÇÃO */}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-secondary">
          Exibindo {exercises.length} de {total} exercícios-base
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || saving || !hasPrevious}
            onClick={() => {
              resetSelection();
              setSkip(Math.max(0, skip - PAGE_SIZE));
              window.scrollTo({ top: 0 });
            }}
            className={secondaryButtonClass}
          >
            Anterior
          </button>

          <button
            type="button"
            disabled={loading || saving || !hasNext}
            onClick={() => {
              resetSelection();
              setSkip(skip + PAGE_SIZE);
              window.scrollTo({ top: 0 });
            }}
            className={primaryButtonClass}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
