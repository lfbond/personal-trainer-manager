import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { api } from "../../lib/api";
import { DemoModal } from "../../components/DemoModal";

interface PublicExerciseVariation {
  id: string;
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
}

interface PublicExercise {
  id: string;
  code: string;
  name: string;
  muscleGroup: string;
  description: string | null;
  variations: PublicExerciseVariation[];
}

interface CatalogItem {
  exercise: PublicExercise;
  variation: PublicExerciseVariation;
}

const PAGE_SIZE = 12;

const muscleGroupLabels: Record<string, string> = {
  CHEST: "Peito",
  BACK: "Costas",
  SHOULDERS: "Ombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  LEGS: "Pernas",
  GLUTES: "Glúteos",
  CALVES: "Panturrilhas",
  CORE: "Abdômen e core",
  ABDOMEN: "Abdômen",
  CARDIO: "Cardiorrespiratório",
  FULL_BODY: "Corpo inteiro",
  OTHER: "Outros",
};

const categoryLabels: Record<string, string> = {
  MACHINE_CABLE: "Máquinas e cabos",
  FREE_WEIGHT: "Pesos livres",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getLabel(labels: Record<string, string>, value: string): string {
  return labels[value] ?? value.replaceAll("_", " ");
}

const inputClassName =
  "w-full min-w-0 rounded-xl border border-border-default " +
  "bg-page px-4 py-3 text-sm font-medium text-text-primary " +
  "outline-none transition-colors " +
  "focus:border-primary focus:ring-2 focus:ring-primary/20";

const secondaryButtonClassName =
  "rounded-xl border border-border-default bg-surface " +
  "px-4 py-2.5 text-sm font-semibold text-text-primary " +
  "transition-colors hover:bg-page disabled:cursor-not-allowed " +
  "disabled:opacity-40";

const filterChipClassName =
  "rounded-full border border-border-default bg-surface " +
  "px-3 py-2 text-xs font-medium text-text-primary " +
  "transition-colors hover:border-primary";

function DetailSection({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  if (!content) return null;

  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>

      <p className="whitespace-pre-line text-sm leading-7 text-text-secondary">
        {content}
      </p>
    </section>
  );
}

export function PublicCatalog() {
  const [exercises, setExercises] = useState<PublicExercise[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  const [page, setPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get<PublicExercise[]>("/public/exercises", {
        signal: controller.signal,
        timeout: 30000,
      })
      .then((response) => {
        if (controller.signal.aborted) return;

        setExercises(response.data);
        setError("");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || axios.isCancel(err)) {
          return;
        }

        setError(
          "Não foi possível carregar o catálogo. " +
            "O servidor pode estar iniciando. " +
            "Tente novamente em instantes.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reloadKey]);

  const items = useMemo<CatalogItem[]>(
    () =>
      exercises.flatMap((exercise) =>
        exercise.variations.map((variation) => ({
          exercise,
          variation,
        })),
      ),
    [exercises],
  );

  const muscleGroups = useMemo(
    () =>
      [...new Set(exercises.map((exercise) => exercise.muscleGroup))].sort(
        (a, b) =>
          getLabel(muscleGroupLabels, a).localeCompare(
            getLabel(muscleGroupLabels, b),
            "pt-BR",
          ),
      ),
    [exercises],
  );

  const filteredItems = useMemo(() => {
    const query = normalizeText(search.trim());

    return items.filter(({ exercise, variation }) => {
      const searchableText = normalizeText(
        [
          exercise.name,
          exercise.description,
          getLabel(muscleGroupLabels, exercise.muscleGroup),
          variation.name,
          variation.code,
          variation.equipment,
          variation.subgroup,
          variation.description,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return (
        (!query || searchableText.includes(query)) &&
        (!muscleGroup || exercise.muscleGroup === muscleGroup) &&
        (!category || variation.category === category) &&
        (!level || variation.level === level)
      );
    });
  }, [items, search, muscleGroup, category, level]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const firstItem =
    filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const lastItem = Math.min(currentPage * PAGE_SIZE, filteredItems.length);

  const activeFilterCount = [
    search.trim(),
    muscleGroup,
    category,
    level,
  ].filter(Boolean).length;

  function resetPagination() {
    setPage(1);
    setSelectedItem(null);
  }

  function clearFilters() {
    setSearch("");
    setMuscleGroup("");
    setCategory("");
    setLevel("");
    resetPagination();
  }

  function retryLoading() {
    setLoading(true);
    setError("");
    setReloadKey((current) => current + 1);
  }

  function changePage(nextPage: number) {
    setPage(nextPage);
    setSelectedItem(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const selectedExercise = selectedItem?.exercise;
  const selectedVariation = selectedItem?.variation;

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-6 sm:px-6 sm:py-8 lg:gap-8 lg:px-8">
      <header className="grid gap-5 rounded-2xl border border-border-default bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold tracking-wide text-primary">
            PERSONAL TRAINER MANAGER
          </span>

          <span className="rounded-full border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary">
            Demonstração pública
          </span>
        </div>

        <div className="grid gap-3">
          <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl">
            Catálogo de exercícios
          </h1>

          <p className="max-w-3xl text-base leading-7 text-text-secondary">
            Explore exercícios e suas variações, conheça os equipamentos
            utilizados e consulte orientações de execução e segurança.
          </p>
        </div>

        <div className="grid gap-3 border-t border-border-default pt-5 sm:grid-cols-3">
          <div className="grid gap-1">
            <strong className="text-2xl font-extrabold text-text-primary">
              {loading ? "—" : exercises.length}
            </strong>

            <span className="text-sm text-text-secondary">Exercícios-base</span>
          </div>

          <div className="grid gap-1">
            <strong className="text-2xl font-extrabold text-text-primary">
              {loading ? "—" : items.length}
            </strong>

            <span className="text-sm text-text-secondary">
              Variações disponíveis
            </span>
          </div>

          <div className="grid gap-1">
            <strong className="text-2xl font-extrabold text-text-primary">
              {loading ? "—" : muscleGroups.length}
            </strong>

            <span className="text-sm text-text-secondary">
              Grupos musculares
            </span>
          </div>
        </div>
      </header>

      <section className="grid gap-5 rounded-2xl border border-border-default bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-lg font-bold text-text-primary">
              Encontre um exercício
            </h2>

            <p className="text-sm text-text-secondary">
              Utilize a pesquisa ou combine os filtros.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className={secondaryButtonClassName}
          >
            Limpar filtros
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-text-primary">
              Pesquisar
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPagination();
              }}
              placeholder="Nome ou equipamento..."
              className={inputClassName}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-text-primary">
              Grupo muscular
            </span>

            <select
              value={muscleGroup}
              onChange={(event) => {
                setMuscleGroup(event.target.value);
                resetPagination();
              }}
              className={inputClassName}
            >
              <option value="">Todos os grupos</option>

              {muscleGroups.map((group) => (
                <option key={group} value={group}>
                  {getLabel(muscleGroupLabels, group)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-text-primary">
              Categoria
            </span>

            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                resetPagination();
              }}
              className={inputClassName}
            >
              <option value="">Todas as categorias</option>
              <option value="MACHINE_CABLE">Máquinas e cabos</option>
              <option value="FREE_WEIGHT">Pesos livres</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-text-primary">
              Nível
            </span>

            <select
              value={level}
              onChange={(event) => {
                setLevel(event.target.value);
                resetPagination();
              }}
              className={inputClassName}
            >
              <option value="">Todos os níveis</option>
              <option value="BEGINNER">Iniciante</option>
              <option value="INTERMEDIATE">Intermediário</option>
              <option value="ADVANCED">Avançado</option>
            </select>
          </label>
        </div>
      </section>

      {activeFilterCount > 0 && (
        <section
          aria-label="Filtros aplicados"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="rounded-full bg-primary/10 px-3 py-2 text-xs font-bold text-primary">
            {activeFilterCount}{" "}
            {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}
          </span>

          {search.trim() && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                resetPagination();
              }}
              className={filterChipClassName}
              aria-label="Remover filtro de pesquisa"
            >
              Pesquisa: {search.trim()} ×
            </button>
          )}

          {muscleGroup && (
            <button
              type="button"
              onClick={() => {
                setMuscleGroup("");
                resetPagination();
              }}
              className={filterChipClassName}
              aria-label="Remover filtro de grupo muscular"
            >
              Grupo: {getLabel(muscleGroupLabels, muscleGroup)} ×
            </button>
          )}

          {category && (
            <button
              type="button"
              onClick={() => {
                setCategory("");
                resetPagination();
              }}
              className={filterChipClassName}
              aria-label="Remover filtro de categoria"
            >
              Categoria: {getLabel(categoryLabels, category)} ×
            </button>
          )}

          {level && (
            <button
              type="button"
              onClick={() => {
                setLevel("");
                resetPagination();
              }}
              className={filterChipClassName}
              aria-label="Remover filtro de nível"
            >
              Nível: {getLabel(levelLabels, level)} ×
            </button>
          )}

          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 text-xs font-bold text-primary hover:underline"
          >
            Limpar todos
          </button>
        </section>
      )}

      <section className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-xl font-bold text-text-primary sm:text-2xl">
            Exercícios disponíveis
          </h2>

          <p aria-live="polite" className="text-sm text-text-secondary">
            {loading
              ? "Carregando exercícios..."
              : `${filteredItems.length} variações encontradas`}
          </p>
        </div>

        {!loading && !error && filteredItems.length > 0 && (
          <span className="text-sm font-medium text-text-secondary">
            Exibindo {firstItem}–{lastItem} de {filteredItems.length}
          </span>
        )}
      </section>

      {loading && (
        <section
          role="status"
          className="rounded-2xl border border-border-default bg-surface p-8 text-sm text-text-secondary"
        >
          Carregando catálogo. O servidor pode levar alguns instantes para
          iniciar.
        </section>
      )}

      {!loading && error && (
        <section
          role="alert"
          className="grid gap-4 rounded-2xl border border-border-default bg-surface p-8"
        >
          <p className="text-sm leading-relaxed text-danger">{error}</p>

          <button
            type="button"
            onClick={retryLoading}
            className="w-fit rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Tentar novamente
          </button>
        </section>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <section className="grid gap-3 rounded-2xl border border-border-default bg-surface p-8 text-center">
          <h3 className="text-lg font-bold text-text-primary">
            Nenhum exercício encontrado
          </h3>

          <p className="text-sm text-text-secondary">
            Experimente outros termos ou remova os filtros.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className={`${secondaryButtonClassName} mx-auto`}
          >
            Limpar filtros
          </button>
        </section>
      )}

      {!loading && !error && paginatedItems.length > 0 && (
        <>
          <section className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginatedItems.map(({ exercise, variation }) => (
              <article
                key={variation.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface transition-shadow hover:shadow-lg"
              >
                <div className="flex h-44 items-center justify-center border-b border-border-default bg-page sm:h-48">
                  {variation.imageUrl ? (
                    <img
                      src={variation.imageUrl}
                      alt={`Ilustração de ${variation.name}`}
                      loading="lazy"
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <div className="grid justify-items-center gap-3 px-5 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border-default bg-surface text-2xl">
                        🏋️
                      </div>

                      <span className="text-sm font-medium text-text-secondary">
                        Imagem em revisão
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="grid gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-primary">
                      {getLabel(muscleGroupLabels, exercise.muscleGroup)}
                    </span>

                    <h3 className="text-lg font-bold leading-snug text-text-primary">
                      {variation.name}
                    </h3>

                    {variation.name !== exercise.name && (
                      <p className="text-sm text-text-secondary">
                        Exercício-base: {exercise.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-page px-3 py-1.5 text-xs font-semibold text-text-primary">
                      {getLabel(categoryLabels, variation.category)}
                    </span>

                    <span className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-semibold text-text-secondary">
                      {getLabel(levelLabels, variation.level)}
                    </span>
                  </div>

                  {variation.equipment && (
                    <p className="text-sm leading-relaxed text-text-secondary">
                      <strong className="text-text-primary">
                        Equipamento:
                      </strong>{" "}
                      {variation.equipment}
                    </p>
                  )}

                  {variation.description && (
                    <p className="text-sm leading-6 text-text-secondary">
                      {variation.description}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedItem({
                        exercise,
                        variation,
                      })
                    }
                    className={`${secondaryButtonClassName} mt-auto w-full`}
                  >
                    Ver detalhes do exercício
                  </button>
                </div>
              </article>
            ))}
          </section>

          {totalPages > 1 && (
            <nav
              aria-label="Paginação do catálogo"
              className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border-default bg-surface p-4"
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => changePage(currentPage - 1)}
                className={secondaryButtonClassName}
              >
                Anterior
              </button>

              <span className="px-2 text-sm font-semibold text-text-primary">
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => changePage(currentPage + 1)}
                className={secondaryButtonClassName}
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      )}

      <DemoModal
        open={selectedItem !== null}
        title={selectedVariation?.name ?? "Detalhes do exercício"}
        description="Informações do catálogo público"
        onClose={() => setSelectedItem(null)}
      >
        {selectedExercise && selectedVariation && (
          <div className="grid gap-5">
            <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl border border-border-default bg-page sm:h-56">
              {selectedVariation.imageUrl ? (
                <img
                  src={selectedVariation.imageUrl}
                  alt={`Ilustração de ${selectedVariation.name}`}
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <div className="grid justify-items-center gap-3 text-center">
                  <span className="text-3xl">🏋️</span>

                  <span className="text-sm text-text-secondary">
                    Imagem em revisão editorial
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-page p-4">
                <span className="text-xs text-text-secondary">
                  Grupo muscular
                </span>

                <p className="mt-1 text-sm font-bold">
                  {getLabel(muscleGroupLabels, selectedExercise.muscleGroup)}
                </p>
              </div>

              <div className="rounded-xl bg-page p-4">
                <span className="text-xs text-text-secondary">Nível</span>

                <p className="mt-1 text-sm font-bold">
                  {getLabel(levelLabels, selectedVariation.level)}
                </p>
              </div>

              <div className="rounded-xl bg-page p-4">
                <span className="text-xs text-text-secondary">Categoria</span>

                <p className="mt-1 text-sm font-bold">
                  {getLabel(categoryLabels, selectedVariation.category)}
                </p>
              </div>

              <div className="rounded-xl bg-page p-4">
                <span className="text-xs text-text-secondary">Equipamento</span>

                <p className="mt-1 text-sm font-bold">
                  {selectedVariation.equipment ?? "Não informado"}
                </p>
              </div>
            </div>

            <DetailSection
              title="Exercício-base"
              content={selectedExercise.name}
            />

            <DetailSection
              title="Descrição"
              content={
                selectedVariation.description ?? selectedExercise.description
              }
            />

            <DetailSection
              title="Subgrupo"
              content={selectedVariation.subgroup}
            />

            <DetailSection
              title="Como executar"
              content={selectedVariation.instructions}
            />

            <DetailSection
              title="Músculos envolvidos"
              content={selectedVariation.muscleExplanation}
            />

            <DetailSection
              title="Orientações de segurança"
              content={selectedVariation.safetyNotes}
            />

            <p className="border-t border-border-default pt-4 text-xs leading-5 text-text-secondary">
              As informações são educativas e não substituem uma prescrição
              individualizada de treinamento.
            </p>
          </div>
        )}
      </DemoModal>

      <footer className="rounded-xl border border-border-default bg-surface p-4 text-sm leading-6 text-text-secondary">
        <strong className="text-text-primary">Informação importante:</strong>{" "}
        este catálogo é demonstrativo e não substitui a avaliação
        individualizada de um profissional habilitado. As imagens são
        disponibilizadas somente após aprovação editorial.
      </footer>
    </main>
  );
}
