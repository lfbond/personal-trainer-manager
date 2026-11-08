import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../hooks/useAuth";

import { getStudents } from "../../services/students";
import { getWorkouts } from "../../services/workouts";
import { getExercises } from "../../services/exercises";

import type { Student } from "../../types/student";
import type { Workout } from "../../services/workouts";
import type { Exercise } from "../../types/exercise";

type DashboardData = {
  students: Student[];
  workouts: Workout[];
  exercises: Exercise[];
};

const statusLabels: Record<Workout["status"], string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};

const statusStyles: Record<Workout["status"], string> = {
  DRAFT: "bg-amber-100 text-amber-900",
  ACTIVE: "bg-green-100 text-green-900",
  ARCHIVED: "bg-gray-200 text-gray-800",
};

const navigationClassName =
  "flex min-h-11 items-center justify-center rounded-lg " +
  "border border-border-default px-4 py-3 text-center " +
  "text-sm font-semibold text-text-primary no-underline " +
  "transition-colors hover:bg-page " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-green-500";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;

    return (
      data?.message ??
      data?.error ??
      "Não foi possível carregar os dados do Dashboard."
    );
  }

  return "Ocorreu um erro inesperado ao carregar o Dashboard.";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return date.toLocaleDateString("pt-BR");
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-border-default bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-text-secondary">{title}</p>

        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-page text-2xl"
        >
          {icon}
        </span>
      </div>

      <p className="text-3xl font-bold tabular-nums text-text-primary">
        {value.toLocaleString("pt-BR")}
      </p>

      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: Workout["status"] }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function StatusProgress({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text-primary">{label}</span>

        <span className="tabular-nums text-text-secondary">
          {value} ({percentage.toFixed(1).replace(".", ",")}%)
        </span>
      </div>

      <div
        className="h-3 overflow-hidden rounded-full bg-page"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Dashboard() {
  const { signOut } = useAuth();

  const [data, setData] = useState<DashboardData>({
    students: [],
    workouts: [],
    exercises: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Atualização manual dos indicadores.
  // Esta função é chamada por eventos do usuário,
  // não pelo efeito de inicialização.
  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [students, workouts, exercises] = await Promise.all([
          getStudents(),
          getWorkouts(),
          getExercises(),
        ]);

        setData({
          students,
          workouts,
          exercises,
        });
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          signOut();
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [signOut],
  );

  // Inicialização assíncrona do Dashboard.
  // O estado loading já começa como true.
  // Portanto, não precisamos atualizá-lo
  // sincronamente dentro do useEffect.
  useEffect(() => {
    let cancelled = false;

    async function initializeDashboard() {
      try {
        const [students, workouts, exercises] = await Promise.all([
          getStudents(),
          getWorkouts(),
          getExercises(),
        ]);

        if (cancelled) {
          return;
        }

        setData({
          students,
          workouts,
          exercises,
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          signOut();
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initializeDashboard();

    return () => {
      cancelled = true;
    };
  }, [signOut]);

  const metrics = useMemo(() => {
    const activeWorkouts = data.workouts.filter(
      (workout) => workout.status === "ACTIVE",
    ).length;

    const draftWorkouts = data.workouts.filter(
      (workout) => workout.status === "DRAFT",
    ).length;

    const archivedWorkouts = data.workouts.filter(
      (workout) => workout.status === "ARCHIVED",
    ).length;

    const totalVariations = data.exercises.reduce(
      (total, exercise) => total + exercise.variations.length,
      0,
    );

    const studentsWithActiveWorkout = new Set(
      data.workouts
        .filter((workout) => workout.status === "ACTIVE")
        .map((workout) => workout.studentId),
    ).size;

    return {
      totalStudents: data.students.length,
      totalWorkouts: data.workouts.length,
      activeWorkouts,
      draftWorkouts,
      archivedWorkouts,
      totalExercises: data.exercises.length,
      totalVariations,
      studentsWithActiveWorkout,
    };
  }, [data]);

  const recentWorkouts = useMemo(() => {
    return [...data.workouts]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [data.workouts]);

  const studentNames = useMemo(() => {
    return new Map(data.students.map((student) => [student.id, student.name]));
  }, [data.students]);

  function getStudentName(workout: Workout): string {
    return (
      workout.student?.name ??
      studentNames.get(workout.studentId) ??
      "Aluno não identificado"
    );
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title="Dashboard"
        description="Visão geral do Personal Trainer Manager."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Visão geral</h2>

          <p className="mt-1 text-sm text-text-secondary">
            Acompanhe os principais dados do sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard(true)}
          disabled={loading || refreshing}
          className="min-h-11 rounded-lg border border-border-default bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-danger bg-surface p-4"
        >
          <p className="font-semibold text-danger">
            Erro ao carregar os indicadores
          </p>

          <p className="mt-2 text-sm text-text-secondary">{error}</p>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            className="mt-3 rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-primary"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div
          role="status"
          className="rounded-xl border border-border-default bg-surface p-8 text-center text-text-secondary"
        >
          Carregando indicadores do Dashboard...
        </div>
      ) : (
        <>
          {/* Indicadores principais */}
          <section
            aria-label="Indicadores principais"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              title="Alunos cadastrados"
              value={metrics.totalStudents}
              description="Alunos retornados pela API"
              icon="👥"
            />

            <MetricCard
              title="Fichas ativas"
              value={metrics.activeWorkouts}
              description="Treinos em utilização"
              icon="💪"
            />

            <MetricCard
              title="Fichas em rascunho"
              value={metrics.draftWorkouts}
              description="Treinos em preparação"
              icon="📝"
            />

            <MetricCard
              title="Exercícios-base"
              value={metrics.totalExercises}
              description="Disponíveis no catálogo"
              icon="🏋️"
            />
          </section>

          {/* Indicadores complementares */}
          <section
            aria-label="Indicadores complementares"
            className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <MetricCard
              title="Total de fichas"
              value={metrics.totalWorkouts}
              description="Todas as situações"
              icon="📋"
            />

            <MetricCard
              title="Fichas arquivadas"
              value={metrics.archivedWorkouts}
              description="Histórico preservado"
              icon="🗃️"
            />

            <MetricCard
              title="Variações de exercícios"
              value={metrics.totalVariations}
              description="Retornadas pelo catálogo"
              icon="🔄"
            />

            <MetricCard
              title="Alunos com ficha ativa"
              value={metrics.studentsWithActiveWorkout}
              description="Alunos distintos com treino ativo"
              icon="✅"
            />
          </section>

          {/* Distribuição das fichas e navegação */}
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-border-default bg-surface p-5 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-text-primary">
                  Situação das fichas
                </h3>

                <p className="mt-1 text-sm text-text-secondary">
                  Distribuição das fichas por status.
                </p>
              </div>

              <div className="grid gap-6">
                <StatusProgress
                  label="Ativas"
                  value={metrics.activeWorkouts}
                  total={metrics.totalWorkouts}
                  color="bg-green-600"
                />

                <StatusProgress
                  label="Rascunhos"
                  value={metrics.draftWorkouts}
                  total={metrics.totalWorkouts}
                  color="bg-amber-500"
                />

                <StatusProgress
                  label="Arquivadas"
                  value={metrics.archivedWorkouts}
                  total={metrics.totalWorkouts}
                  color="bg-gray-500"
                />
              </div>

              {metrics.totalWorkouts === 0 && (
                <p className="mt-5 text-sm text-text-secondary">
                  Nenhuma ficha cadastrada até o momento.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-border-default bg-surface p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-text-primary">
                  Acesso rápido
                </h3>

                <p className="mt-1 text-sm text-text-secondary">
                  Acesse as principais funcionalidades.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/students" className={navigationClassName}>
                  👥 Gerenciar alunos
                </Link>

                <Link to="/exercises" className={navigationClassName}>
                  🏋️ Consultar exercícios
                </Link>

                <Link to="/workouts" className={navigationClassName}>
                  📋 Gerenciar treinos
                </Link>

                <Link to="/workouts" className={navigationClassName}>
                  💪 Criar ficha de treino
                </Link>
              </div>

              <p className="mt-5 text-xs text-text-secondary">
                Os indicadores são atualizados ao abrir esta página ou ao clicar
                em "Atualizar dados".
              </p>
            </section>
          </div>

          {/* Fichas recentes */}
          <section className="mt-6 rounded-xl border border-border-default bg-surface p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Fichas recentes
                </h3>

                <p className="mt-1 text-sm text-text-secondary">
                  Últimas cinco fichas cadastradas.
                </p>
              </div>

              <Link
                to="/workouts"
                className="text-sm font-semibold text-primary underline"
              >
                Ver todas
              </Link>
            </div>

            {recentWorkouts.length === 0 ? (
              <div className="rounded-lg border border-border-default p-5 text-center">
                <p className="text-text-secondary">
                  Ainda não existem fichas cadastradas.
                </p>

                <Link
                  to="/workouts"
                  className="mt-3 inline-block text-sm font-semibold text-primary underline"
                >
                  Ir para treinos
                </Link>
              </div>
            ) : (
              <div className="grid gap-3">
                {recentWorkouts.map((workout) => (
                  <article
                    key={workout.id}
                    className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border-default p-4"
                  >
                    <div className="grid min-w-0 gap-2">
                      <h4 className="font-semibold text-text-primary">
                        {workout.name}
                      </h4>

                      <p className="text-sm text-text-secondary">
                        Aluno: {getStudentName(workout)}
                      </p>

                      <p className="text-sm text-text-secondary">
                        Versão {workout.version}
                        {" • "}
                        Criada em {formatDate(workout.createdAt)}
                      </p>
                    </div>

                    <StatusBadge status={workout.status} />
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
