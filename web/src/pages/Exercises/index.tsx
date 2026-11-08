import { useEffect, useState } from "react";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { getExercises } from "../../services/exercises";
import { getExerciseDisplayName } from "../../utils/exercise-translations";

import type {
  Exercise,
  ExerciseCategory,
  ExerciseLevel,
  MuscleGroup,
} from "../../types/exercise";

const fieldClassName = [
  "min-h-11 w-full min-w-0 rounded-lg border border-border-default",
  "bg-surface px-3 py-2 text-sm text-text-primary",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
].join(" ");

const muscleGroups: { value: MuscleGroup; label: string }[] = [
  { value: "CHEST", label: "Peitoral" },
  { value: "BACK", label: "Costas" },
  { value: "SHOULDERS", label: "Ombros" },
  { value: "BICEPS", label: "Bíceps" },
  { value: "TRICEPS", label: "Tríceps" },
  { value: "LEGS", label: "Pernas" },
  { value: "GLUTES", label: "Glúteos" },
  { value: "CALVES", label: "Panturrilhas" },
  { value: "CORE", label: "Abdômen / Core" },
  { value: "CARDIO", label: "Cardio" },
  { value: "FULL_BODY", label: "Corpo inteiro" },
  { value: "OTHER", label: "Outros" },
];

const categoryLabels: Record<ExerciseCategory, string> = {
  MACHINE_CABLE: "Máquinas / Cabos",
  FREE_WEIGHT: "Pesos livres",
};

const levelLabels: Record<ExerciseLevel, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

function getMuscleGroupLabel(group: MuscleGroup) {
  return muscleGroups.find((item) => item.value === group)?.label ?? group;
}

type ImageInformation = {
  imageUrl?: string | null;
  imageReviewStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
};

function ExerciseImage({
  imageUrl,
  imageReviewStatus,
  name,
}: ImageInformation & { name: string }) {
  const [failed, setFailed] = useState(false);

  const validUrl = typeof imageUrl === "string" && imageUrl.trim().length > 0;

  const showImage = validUrl && !failed;

  const pendingReview = showImage && imageReviewStatus !== "APPROVED";

  return (
    <div className="w-full min-w-0 sm:w-44 sm:shrink-0 lg:w-52">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border-default bg-page">
        {showImage ? (
          <img
            src={imageUrl}
            alt={`Ilustração do exercício ${name}`}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-contain"
          />
        ) : (
          <div
            className="flex flex-col items-center gap-2 px-3 text-center text-text-secondary"
            role="img"
            aria-label="Imagem não disponível"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
              <path d="m3 3 18 18" />
            </svg>
            <span className="text-xs">Imagem não disponível</span>
          </div>
        )}
      </div>

      {pendingReview && (
        <p className="mt-2 text-xs leading-relaxed text-text-secondary">
          Imagem ilustrativa — pendente de revisão técnica.
        </p>
      )}

      {showImage && imageReviewStatus === "APPROVED" && (
        <p className="mt-2 text-xs text-text-secondary">Imagem aprovada</p>
      )}
    </div>
  );
}

export function Exercises() {
  const { signOut } = useAuth();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">("");
  const [category, setCategory] = useState<ExerciseCategory | "">("");
  const [level, setLevel] = useState<ExerciseLevel | "">("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      try {
        const data = await getExercises({
          search: search.trim() || undefined,
          muscleGroup: muscleGroup || undefined,
          category: category || undefined,
          level: level || undefined,
        });

        if (!cancelled) {
          // A tela apresenta somente exercícios
          // com variações disponíveis.
          setExercises(
            data.filter((exercise) => exercise.variations.length > 0),
          );
          setError("");
        }
      } catch (err) {
        if (cancelled) return;

        setExercises([]);

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          signOut();
        } else {
          setError("Não foi possível carregar o catálogo de exercícios.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, muscleGroup, category, level, signOut]);

  function clearFilters() {
    setLoading(true);
    setSearch("");
    setMuscleGroup("");
    setCategory("");
    setLevel("");
    setExpandedExerciseId(null);
  }

  const hasFilters = Boolean(search || muscleGroup || category || level);

  const totalVariations = exercises.reduce(
    (total, exercise) => total + exercise.variations.length,
    0,
  );

  return (
    <div className="min-w-0">
      <PageHeader
        title="Exercícios"
        description="Consulte o catálogo de exercícios disponíveis."
      />

      <section
        aria-label="Filtros do catálogo"
        className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <input
          type="search"
          aria-label="Pesquisar exercícios"
          placeholder="Pesquisar exercício..."
          value={search}
          onChange={(event) => {
            setLoading(true);
            setSearch(event.target.value);
          }}
          className={fieldClassName}
        />

        <select
          aria-label="Filtrar por grupo muscular"
          value={muscleGroup}
          onChange={(event) => {
            setLoading(true);
            setMuscleGroup(event.target.value as MuscleGroup | "");
          }}
          className={fieldClassName}
        >
          <option value="">Todos os grupos</option>
          {muscleGroups.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por categoria"
          value={category}
          onChange={(event) => {
            setLoading(true);
            setCategory(event.target.value as ExerciseCategory | "");
          }}
          className={fieldClassName}
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
          onChange={(event) => {
            setLoading(true);
            setLevel(event.target.value as ExerciseLevel | "");
          }}
          className={fieldClassName}
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
        <p className="text-sm text-text-secondary" aria-live="polite">
          {!loading && !error
            ? `${exercises.length} exercícios-base • ${totalVariations} variações disponíveis`
            : "Catálogo de exercícios"}
        </p>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-11 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-primary hover:bg-page"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger px-4 py-3 text-danger"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p role="status" className="py-6 text-text-secondary">
          Carregando exercícios...
        </p>
      ) : !error && exercises.length === 0 ? (
        <section className="rounded-xl border border-border-default bg-surface p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-text-primary">
            Nenhum exercício disponível
          </h2>
          <p className="text-sm text-text-secondary">
            {hasFilters
              ? "Nenhum exercício ativo corresponde aos filtros selecionados."
              : "Ainda não há variações ativas disponíveis neste catálogo."}
          </p>
        </section>
      ) : !error ? (
        <div className="grid gap-4">
          {exercises.map((exercise) => {
            const expanded = expandedExerciseId === exercise.id;

            return (
              <article
                key={exercise.id}
                className="min-w-0 rounded-xl border border-border-default bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {getExerciseDisplayName(exercise.name)}
                    </h2>

                    <p className="mt-1 text-sm text-text-secondary">
                      {getMuscleGroupLabel(exercise.muscleGroup)}
                      {" • "}
                      {exercise.variations.length} variação(ões)
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`variations-${exercise.id}`}
                    onClick={() =>
                      setExpandedExerciseId(expanded ? null : exercise.id)
                    }
                    className="min-h-11 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-primary hover:bg-page"
                  >
                    {expanded ? "Ocultar variações" : "Ver variações"}
                  </button>
                </div>

                {expanded && (
                  <div
                    id={`variations-${exercise.id}`}
                    className="mt-4 grid gap-3 border-t border-border-default pt-4"
                  >
                    {exercise.variations.map((variation) => {
                      // Campos opcionais para compatibilidade
                      // com a tipagem atual do catálogo.
                      const imageInformation = variation as typeof variation &
                        ImageInformation;

                      return (
                        <div
                          key={variation.id}
                          className="rounded-lg border border-border-default p-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <ExerciseImage
                              key={`${variation.id}-${imageInformation.imageUrl ?? ""}`}
                              name={variation.name}
                              imageUrl={imageInformation.imageUrl}
                              imageReviewStatus={
                                imageInformation.imageReviewStatus
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-text-primary">
                                {variation.name}
                              </h3>

                              <p className="mt-1 text-sm text-text-secondary">
                                {categoryLabels[variation.category]}
                                {" • "}
                                {levelLabels[variation.level]}
                              </p>

                              {variation.equipment && (
                                <p className="mt-2 text-sm text-text-secondary">
                                  <span className="font-semibold">
                                    Equipamento:{" "}
                                  </span>
                                  {variation.equipment}
                                </p>
                              )}

                              {variation.instructions && (
                                <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                                  <span className="font-semibold">
                                    Execução:{" "}
                                  </span>
                                  {variation.instructions}
                                </p>
                              )}

                              {variation.safetyNotes && (
                                <p className="mt-2 whitespace-pre-line text-sm text-text-secondary">
                                  <span className="font-semibold">
                                    Cuidados:{" "}
                                  </span>
                                  {variation.safetyNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
