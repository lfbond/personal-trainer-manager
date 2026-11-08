import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import axios from "axios";

import { PageHeader } from "../../components/PageHeader";
import { WorkoutModal } from "../../components/WorkoutModal";
import { WorkoutExerciseImage } from "../../components/WorkoutExerciseImage";
import { useAuth } from "../../hooks/useAuth";
import { getStudents } from "../../services/students";
import { getExercises } from "../../services/exercises";

import type { Exercise, ExerciseVariation } from "../../types/exercise";

import {
  activateWorkout,
  addWorkoutExercise,
  archiveWorkout,
  createWorkout,
  createWorkoutVersion,
  getWorkout,
  getWorkoutVersions,
  getWorkouts,
  removeWorkoutExercise,
  updateWorkout,
  updateWorkoutExercise,
} from "../../services/workouts";

import type { Workout, WorkoutExercise } from "../../services/workouts";

type StudentOption = {
  id: string;
  name: string;
};

type PrescriptionForm = {
  exerciseVariationId: string;
  sets: string;
  repetitions: string;
  weight: string;
  weightUnit: "KG" | "LB";
  restSeconds: string;
  notes: string;
};

type ExerciseGroup = {
  id: string;
  name: string;
  muscleGroup: Exercise["muscleGroup"];
  variations: ExerciseVariation[];
};

const emptyPrescription: PrescriptionForm = {
  exerciseVariationId: "",
  sets: "3",
  repetitions: "12",
  weight: "",
  weightUnit: "KG",
  restSeconds: "60",
  notes: "",
};

const fieldClassName =
  "min-h-11 w-full min-w-0 rounded-lg border border-border-default " +
  "bg-surface px-3 py-2 text-sm text-text-primary " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-primary";

const buttonClassName =
  "min-h-10 rounded-lg border border-border-default px-4 py-2 " +
  "text-sm font-semibold text-text-primary transition-opacity " +
  "hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClassName =
  "min-h-11 rounded-lg bg-primary px-5 py-2 " +
  "font-semibold !text-white transition-opacity " +
  "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const categoryLabels = {
  MACHINE_CABLE: "Máquinas e cabos",
  FREE_WEIGHT: "Pesos livres",
};

const levelLabels = {
  BEGINNER: "Iniciante",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
};

const muscleLabels: Record<Exercise["muscleGroup"], string> = {
  CHEST: "Peitoral",
  BACK: "Costas",
  SHOULDERS: "Ombros",
  BICEPS: "Bíceps",
  TRICEPS: "Tríceps",
  LEGS: "Pernas",
  GLUTES: "Glúteos",
  CALVES: "Panturrilhas",
  CORE: "Abdômen/Core",
  CARDIO: "Cardio",
  FULL_BODY: "Corpo inteiro",
  OTHER: "Outros",
};

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

function groupExercises(catalog: Exercise[]): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>();

  for (const exercise of catalog) {
    const key = [exercise.muscleGroup, normalizeName(exercise.name)].join(":");

    let group = groups.get(key);

    if (!group) {
      group = {
        id: key,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        variations: [],
      };

      groups.set(key, group);
    }

    const existingIds = new Set(
      group.variations.map((variation) => variation.id),
    );

    for (const variation of exercise.variations) {
      if (!existingIds.has(variation.id)) {
        group.variations.push(variation);
        existingIds.add(variation.id);
      }
    }
  }

  return [...groups.values()]
    .filter((group) =>
      group.variations.some((variation) => variation.status === "ACTIVE"),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;

    return (
      data?.message ??
      data?.error ??
      `Erro na requisição (${error.response?.status ?? "rede"}).`
    );
  }

  return "Ocorreu um erro inesperado.";
}

function StatusBadge({ status }: { status: Workout["status"] }) {
  const styles = {
    DRAFT: "bg-yellow-100 text-yellow-900",
    ACTIVE: "bg-green-100 text-green-900",
    ARCHIVED: "bg-gray-200 text-gray-800",
  };

  const labels = {
    DRAFT: "Rascunho",
    ACTIVE: "Ativa",
    ARCHIVED: "Arquivada",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function Workouts() {
  const { signOut } = useAuth();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);

  const [selected, setSelected] = useState<Workout | null>(null);
  const [versions, setVersions] = useState<Workout[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [prescriptionOpen, setPrescriptionOpen] = useState(false);

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(
    null,
  );

  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const [exerciseSearch, setExerciseSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");

  const [prescription, setPrescription] = useState<PrescriptionForm>({
    ...emptyPrescription,
  });

  const [modalError, setModalError] = useState("");

  const handleError = useCallback(
    (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
        return;
      }

      const message = getErrorMessage(err);
      setError(message);
      setModalError(message);
    },
    [signOut],
  );

  const loadWorkouts = useCallback(async () => {
    const data = await getWorkouts();
    setWorkouts(data);
  }, []);

  const refreshSelected = useCallback(async (id: string) => {
    const data = await getWorkout(id);
    setSelected(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [workoutData, studentData, exerciseData] = await Promise.all([
          getWorkouts(),
          getStudents({}),
          getExercises(),
        ]);

        if (cancelled) return;

        setWorkouts(workoutData);

        setStudents(
          studentData.map((student) => ({
            id: student.id,
            name: student.name,
          })),
        );

        setCatalog(exerciseData);
      } catch (err) {
        if (!cancelled) handleError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [handleError]);

  const groupedCatalog = useMemo(() => groupExercises(catalog), [catalog]);

  const filteredCatalog = useMemo(() => {
    const query = normalizeName(exerciseSearch);

    return groupedCatalog.filter((exercise) => {
      const matchesMuscle =
        !muscleFilter || exercise.muscleGroup === muscleFilter;

      const matchesSearch =
        !query ||
        normalizeName(exercise.name).includes(query) ||
        exercise.variations.some((variation) =>
          normalizeName(variation.name).includes(query),
        );

      return matchesMuscle && matchesSearch;
    });
  }, [groupedCatalog, exerciseSearch, muscleFilter]);

  const selectedExercise = useMemo(
    () => groupedCatalog.find((exercise) => exercise.id === selectedExerciseId),
    [groupedCatalog, selectedExerciseId],
  );

  const variationMap = useMemo(() => {
    const map = new Map<string, ExerciseVariation>();

    for (const exercise of catalog) {
      for (const variation of exercise.variations) {
        map.set(variation.id, variation);
      }
    }

    return map;
  }, [catalog]);

  const availableVariations = useMemo(() => {
    const variations = selectedExercise?.variations ?? [];

    return variations
      .filter(
        (variation) =>
          variation.status === "ACTIVE" ||
          (editingExerciseId !== null &&
            variation.id === prescription.exerciseVariationId),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [selectedExercise, editingExerciseId, prescription.exerciseVariationId]);

  const selectedVariation = useMemo(
    () => variationMap.get(prescription.exerciseVariationId),
    [variationMap, prescription.exerciseVariationId],
  );

  const filteredWorkouts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return workouts.filter((workout) => {
      const studentName =
        workout.student?.name ??
        students.find((student) => student.id === workout.studentId)?.name ??
        "";

      const matchesSearch =
        workout.name.toLowerCase().includes(query) ||
        studentName.toLowerCase().includes(query);

      const matchesStatus = !statusFilter || workout.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workouts, students, search, statusFilter]);

  function getStudentName(workout: Workout): string {
    return (
      workout.student?.name ??
      students.find((student) => student.id === workout.studentId)?.name ??
      "Aluno não identificado"
    );
  }

  function clearMessages() {
    setError("");
    setSuccess("");
    setModalError("");
  }

  function showValidationError(message: string) {
    setModalError(message);
  }

  function resetForm() {
    setEditingId(null);
    setStudentId("");
    setName("");
    setDescription("");
    setFormOpen(false);
    setModalError("");
  }

  function resetPrescription() {
    setPrescription({ ...emptyPrescription });
    setSelectedExerciseId("");
    setEditingExerciseId(null);
    setPrescriptionOpen(false);
    setExerciseSearch("");
    setMuscleFilter("");
    setModalError("");
  }

  function updatePrescriptionField<K extends keyof PrescriptionForm>(
    field: K,
    value: PrescriptionForm[K],
  ) {
    setPrescription((current) => ({
      ...current,
      [field]: value,
    }));

    setModalError("");
  }

  function openCreateForm() {
    resetForm();
    clearMessages();
    setFormOpen(true);
  }

  function openEditForm(workout: Workout) {
    setEditingId(workout.id);
    setStudentId(workout.studentId);
    setName(workout.name);
    setDescription(workout.description ?? "");
    clearMessages();
    setFormOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length < 3) {
      showValidationError("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!editingId && !studentId) {
      showValidationError("Selecione um aluno.");
      return;
    }

    try {
      setProcessing(true);
      clearMessages();

      if (editingId) {
        await updateWorkout(editingId, {
          name: name.trim(),
          description: description.trim() || null,
        });

        if (selected?.id === editingId) {
          await refreshSelected(editingId);
        }

        setSuccess("Ficha atualizada com sucesso.");
      } else {
        await createWorkout({
          studentId,
          name: name.trim(),
          description: description.trim() || null,
        });

        setSuccess("Ficha criada com sucesso.");
      }

      resetForm();
      await loadWorkouts();
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSelectWorkout(id: string) {
    try {
      setProcessing(true);
      clearMessages();
      resetPrescription();
      setVersions([]);
      setHistoryOpen(false);

      await refreshSelected(id);
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleActivate(workout: Workout) {
    const confirmed = window.confirm(
      `Ativar a ficha "${workout.name}"?\n\n` +
        "A ficha ativa anterior do aluno será arquivada.",
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      clearMessages();

      await activateWorkout(workout.id);
      await loadWorkouts();

      if (selected?.id === workout.id) {
        await refreshSelected(workout.id);
        resetPrescription();
      }

      setSuccess("Ficha ativada com sucesso.");
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleArchive(workout: Workout) {
    const confirmed = window.confirm(
      `Arquivar a ficha "${workout.name}"?\n\n` +
        "Seus dados serão preservados no banco.",
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      clearMessages();

      await archiveWorkout(workout.id);

      if (selected?.id === workout.id) {
        setSelected(null);
        resetPrescription();
        setVersions([]);
        setHistoryOpen(false);
      }

      await loadWorkouts();
      setSuccess("Ficha arquivada com sucesso.");
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleNewVersion(workout: Workout) {
    const confirmed = window.confirm(
      `Criar uma nova versão da ficha "${workout.name}"?`,
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      clearMessages();

      const newVersion = await createWorkoutVersion(workout.id);

      await loadWorkouts();
      await refreshSelected(newVersion.id);

      resetPrescription();
      setVersions([]);
      setHistoryOpen(false);

      setSuccess(`Versão ${newVersion.version} criada como rascunho.`);
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleVersions(id: string) {
    try {
      setProcessing(true);
      clearMessages();

      const data = await getWorkoutVersions(id);

      setVersions(data);
      setHistoryOpen(true);
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  function openAddPrescription() {
    resetPrescription();
    clearMessages();
    setPrescriptionOpen(true);
  }

  function openEditPrescription(exercise: WorkoutExercise) {
    const parentExercise = catalog.find((item) =>
      item.variations.some(
        (variation) => variation.id === exercise.exerciseVariationId,
      ),
    );

    const group = groupedCatalog.find(
      (item) =>
        item.muscleGroup === parentExercise?.muscleGroup &&
        normalizeName(item.name) === normalizeName(parentExercise?.name ?? ""),
    );

    setSelectedExerciseId(group?.id ?? "");
    setEditingExerciseId(exercise.id);

    setPrescription({
      exerciseVariationId: exercise.exerciseVariationId,
      sets: String(exercise.sets),
      repetitions: exercise.repetitions,
      weight:
        exercise.weight === null || exercise.weight === undefined
          ? ""
          : String(exercise.weight),
      weightUnit: exercise.weightUnit ?? "KG",
      restSeconds:
        exercise.restSeconds === null || exercise.restSeconds === undefined
          ? ""
          : String(exercise.restSeconds),
      notes: exercise.notes ?? "",
    });

    setExerciseSearch("");
    setMuscleFilter("");
    clearMessages();
    setPrescriptionOpen(true);
  }

  async function handleSavePrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selected || selected.status !== "DRAFT") {
      showValidationError("Somente fichas em rascunho podem ser alteradas.");
      return;
    }

    if (!prescription.exerciseVariationId) {
      showValidationError("Selecione uma variação do exercício.");
      return;
    }

    const variation = variationMap.get(prescription.exerciseVariationId);

    if (!variation) {
      showValidationError(
        "A variação selecionada não está disponível no catálogo.",
      );
      return;
    }

    const sets = Number(prescription.sets);

    const weight =
      prescription.weight.trim() === "" ? null : Number(prescription.weight);

    const restSeconds =
      prescription.restSeconds.trim() === ""
        ? null
        : Number(prescription.restSeconds);

    if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
      showValidationError("Informe entre 1 e 20 séries.");
      return;
    }

    if (
      !prescription.repetitions.trim() ||
      prescription.repetitions.trim().length > 50
    ) {
      showValidationError("Informe as repetições (até 50 caracteres).");
      return;
    }

    if (
      weight !== null &&
      (!Number.isFinite(weight) || weight < 0 || weight > 999999.99)
    ) {
      showValidationError("Informe uma carga válida.");
      return;
    }

    if (
      restSeconds !== null &&
      (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 3600)
    ) {
      showValidationError("O descanso deve estar entre 0 e 3600 segundos.");
      return;
    }

    try {
      setProcessing(true);
      clearMessages();

      const data = {
        exerciseVariationId: prescription.exerciseVariationId,
        sets,
        repetitions: prescription.repetitions.trim(),
        weight,
        weightUnit: prescription.weightUnit,
        restSeconds,
        notes: prescription.notes.trim() || null,
      };

      if (editingExerciseId) {
        await updateWorkoutExercise(selected.id, editingExerciseId, data);

        setSuccess("Prescrição atualizada com sucesso.");
      } else {
        await addWorkoutExercise(selected.id, data);

        setSuccess("Exercício adicionado à ficha.");
      }

      await refreshSelected(selected.id);
      await loadWorkouts();
      resetPrescription();
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  async function handleRemovePrescription(exercise: WorkoutExercise) {
    if (!selected || selected.status !== "DRAFT") {
      return;
    }

    const confirmed = window.confirm("Deseja remover este exercício da ficha?");

    if (!confirmed) return;

    try {
      setProcessing(true);
      clearMessages();

      await removeWorkoutExercise(selected.id, exercise.id);

      await refreshSelected(selected.id);
      await loadWorkouts();

      if (editingExerciseId === exercise.id) {
        resetPrescription();
      }

      setSuccess("Exercício removido com sucesso.");
    } catch (err) {
      handleError(err);
    } finally {
      setProcessing(false);
    }
  }

  function getVariationName(exercise: WorkoutExercise): string {
    const variation = variationMap.get(exercise.exerciseVariationId);

    return (
      exercise.exerciseNameSnapshot ??
      exercise.exerciseVariation?.name ??
      variation?.name ??
      "Exercício cadastrado"
    );
  }

  function getExerciseImage(exercise: WorkoutExercise) {
    const variation = variationMap.get(exercise.exerciseVariationId);

    return {
      imageUrl:
        variation?.imageUrl ?? exercise.exerciseVariation?.imageUrl ?? null,
      imageReviewStatus:
        variation?.imageReviewStatus ??
        exercise.exerciseVariation?.imageReviewStatus,
    };
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title="Treinos"
        description="Crie e gerencie as fichas de treino dos alunos."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">
          Fichas de treino
        </h2>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={processing}
          className={primaryButtonClassName}
        >
          + Nova ficha
        </button>
      </div>

      {error && !formOpen && !prescriptionOpen && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger p-4 text-danger"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-green-500 p-4 text-green-700 dark:text-green-300"
        >
          {success}
        </p>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar ficha ou aluno..."
          aria-label="Pesquisar fichas"
          className={fieldClassName}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filtrar fichas por status"
          className={fieldClassName}
        >
          <option value="">Todos os status</option>
          <option value="DRAFT">Rascunho</option>
          <option value="ACTIVE">Ativa</option>
          <option value="ARCHIVED">Arquivada</option>
        </select>
      </div>

      {loading ? (
        <p className="py-6 text-text-secondary">Carregando fichas...</p>
      ) : filteredWorkouts.length === 0 ? (
        <p className="rounded-xl border border-border-default bg-surface p-6 text-text-secondary">
          Nenhuma ficha encontrada.
        </p>
      ) : (
        <div className="grid gap-4">
          {filteredWorkouts.map((workout) => (
            <article
              key={workout.id}
              className="rounded-xl border border-border-default bg-surface p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-2">
                  <h3 className="text-lg font-bold text-text-primary">
                    {workout.name}
                  </h3>

                  <p className="text-sm text-text-secondary">
                    Aluno: {getStudentName(workout)}
                  </p>

                  <p className="text-sm text-text-secondary">
                    Versão {workout.version}
                  </p>
                </div>

                <StatusBadge status={workout.status} />
              </div>

              {workout.description && (
                <p className="mt-3 text-sm text-text-secondary">
                  {workout.description}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => void handleSelectWorkout(workout.id)}
                  className={buttonClassName}
                >
                  Visualizar / Exercícios
                </button>

                {workout.status === "DRAFT" && (
                  <>
                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => openEditForm(workout)}
                      className={buttonClassName}
                    >
                      Editar ficha
                    </button>

                    <button
                      type="button"
                      disabled={processing}
                      onClick={() => void handleActivate(workout)}
                      className={buttonClassName}
                    >
                      Ativar
                    </button>
                  </>
                )}

                {workout.status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={processing}
                    onClick={() => void handleNewVersion(workout)}
                    className={buttonClassName}
                  >
                    Nova versão
                  </button>
                )}

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => void handleVersions(workout.id)}
                  className={buttonClassName}
                >
                  Histórico
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => void handleArchive(workout)}
                  className={`${buttonClassName} text-danger`}
                >
                  Arquivar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <section className="mt-8 rounded-xl border border-border-default bg-surface p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
              <h2 className="text-xl font-bold text-text-primary">
                {selected.name}
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={selected.status} />

                <span className="text-sm text-text-secondary">
                  Versão {selected.version}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={processing}
              onClick={() => {
                setSelected(null);
                resetPrescription();
              }}
              className={buttonClassName}
            >
              Fechar
            </button>
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-text-primary">
              Exercícios prescritos
            </h3>

            {selected.status === "DRAFT" && (
              <button
                type="button"
                disabled={processing}
                onClick={openAddPrescription}
                className={primaryButtonClassName}
              >
                + Adicionar exercício
              </button>
            )}
          </div>

          {selected.exercises?.length ? (
            <div className="grid gap-3">
              {selected.exercises.map((exercise, index) => {
                const image = getExerciseImage(exercise);

                return (
                  <article
                    key={exercise.id}
                    className="rounded-lg border border-border-default p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 flex-wrap gap-4">
                        <WorkoutExerciseImage
                          imageUrl={image.imageUrl}
                          imageReviewStatus={image.imageReviewStatus}
                          name={getVariationName(exercise)}
                          size="small"
                        />

                        <div className="grid min-w-0 content-start gap-2">
                          <h4 className="font-semibold text-text-primary">
                            {index + 1}. {getVariationName(exercise)}
                          </h4>

                          <p className="text-sm text-text-secondary">
                            {exercise.sets} séries × {exercise.repetitions}{" "}
                            repetições
                          </p>

                          <p className="text-sm text-text-secondary">
                            Carga:{" "}
                            {exercise.weight === null ||
                            exercise.weight === undefined
                              ? "Não definida"
                              : `${exercise.weight} ${exercise.weightUnit}`}
                          </p>

                          <p className="text-sm text-text-secondary">
                            Descanso:{" "}
                            {exercise.restSeconds === null ||
                            exercise.restSeconds === undefined
                              ? "Não definido"
                              : `${exercise.restSeconds} segundos`}
                          </p>

                          {exercise.notes && (
                            <p className="text-sm text-text-secondary">
                              Observações: {exercise.notes}
                            </p>
                          )}

                          {exercise.exerciseInstructionsSnapshot && (
                            <p className="whitespace-pre-line text-sm text-text-secondary">
                              Instruções:{" "}
                              {exercise.exerciseInstructionsSnapshot}
                            </p>
                          )}

                          {exercise.exerciseSafetyNotesSnapshot && (
                            <p className="whitespace-pre-line text-sm text-text-secondary">
                              Cuidados: {exercise.exerciseSafetyNotesSnapshot}
                            </p>
                          )}
                        </div>
                      </div>

                      {selected.status === "DRAFT" && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => openEditPrescription(exercise)}
                            className={buttonClassName}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                              void handleRemovePrescription(exercise)
                            }
                            className={`${buttonClassName} text-danger`}
                          >
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-lg border border-border-default p-4 text-sm text-text-secondary">
              Esta ficha ainda não possui exercícios.
            </p>
          )}

          {selected.status === "DRAFT" && (
            <div className="mt-5">
              <button
                type="button"
                disabled={processing}
                onClick={() => void handleActivate(selected)}
                className={primaryButtonClassName}
              >
                Ativar ficha
              </button>
            </div>
          )}

          {selected.status === "ACTIVE" && (
            <div className="mt-5">
              <button
                type="button"
                disabled={processing}
                onClick={() => void handleNewVersion(selected)}
                className={primaryButtonClassName}
              >
                Criar nova versão para edição
              </button>
            </div>
          )}
        </section>
      )}

      {historyOpen && (
        <section className="mt-6 rounded-xl border border-border-default bg-surface p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-text-primary">
              Histórico de versões
            </h2>

            <button
              type="button"
              onClick={() => {
                setHistoryOpen(false);
                setVersions([]);
              }}
              className={buttonClassName}
            >
              Fechar
            </button>
          </div>

          {versions.length === 0 ? (
            <p className="text-sm text-text-secondary">
              Nenhuma versão encontrada.
            </p>
          ) : (
            <div className="grid gap-3">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default p-3"
                >
                  <div>
                    <p className="font-semibold text-text-primary">
                      {version.name} — Versão {version.version}
                    </p>

                    <p className="text-sm text-text-secondary">
                      {new Date(version.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <StatusBadge status={version.status} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <WorkoutModal
        open={formOpen}
        title={editingId ? "Editar ficha" : "Cadastrar ficha"}
        description={
          editingId
            ? "Atualize as informações da ficha de treino."
            : "Cadastre uma nova ficha para um aluno."
        }
        onClose={resetForm}
        busy={processing}
        maxWidth="lg"
      >
        {modalError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-danger p-3 text-sm text-danger"
          >
            {modalError}
          </p>
        )}

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="grid gap-4"
        >
          <label className="grid gap-2 text-sm text-text-primary">
            Aluno
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              disabled={Boolean(editingId) || processing}
              required
              className={fieldClassName}
            >
              <option value="">Selecione um aluno</option>

              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-text-primary">
            Nome da ficha
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={3}
              maxLength={120}
              required
              disabled={processing}
              placeholder="Ex.: Treino A - Peito e tríceps"
              className={fieldClassName}
            />
          </label>

          <label className="grid gap-2 text-sm text-text-primary">
            Descrição
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={4}
              disabled={processing}
              placeholder="Objetivos e observações..."
              className={fieldClassName}
            />
          </label>

          <div className="flex flex-wrap gap-3 border-t border-border-default pt-4">
            <button
              type="submit"
              disabled={processing}
              className={primaryButtonClassName}
            >
              {processing ? "Salvando..." : "Salvar ficha"}
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={resetForm}
              className={buttonClassName}
            >
              Cancelar
            </button>
          </div>
        </form>
      </WorkoutModal>

      <WorkoutModal
        open={prescriptionOpen && selected?.status === "DRAFT"}
        title={
          editingExerciseId
            ? "Editar prescrição"
            : "Adicionar exercício à ficha"
        }
        description={
          editingExerciseId
            ? "Altere a variação ou os parâmetros do exercício sem precisar removê-lo."
            : "Selecione um exercício e configure sua prescrição."
        }
        onClose={resetPrescription}
        busy={processing}
        maxWidth="xl"
      >
        {modalError && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-danger p-3 text-sm text-danger"
          >
            {modalError}
          </p>
        )}

        <form
          onSubmit={(event) => void handleSavePrescription(event)}
          className="grid gap-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-text-primary">
              Pesquisar exercício
              <input
                type="search"
                value={exerciseSearch}
                onChange={(event) => setExerciseSearch(event.target.value)}
                placeholder="Nome do exercício ou variação"
                disabled={processing}
                className={fieldClassName}
              />
            </label>

            <label className="grid gap-2 text-sm text-text-primary">
              Grupo muscular
              <select
                value={muscleFilter}
                onChange={(event) => setMuscleFilter(event.target.value)}
                disabled={processing}
                className={fieldClassName}
              >
                <option value="">Todos os grupos</option>

                {Object.entries(muscleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm text-text-primary">
            Exercício-base
            <select
              value={selectedExerciseId}
              onChange={(event) => {
                setSelectedExerciseId(event.target.value);
                updatePrescriptionField("exerciseVariationId", "");
              }}
              required
              disabled={processing}
              className={fieldClassName}
            >
              <option value="">Selecione um exercício</option>

              {filteredCatalog.map((exercise) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} — {muscleLabels[exercise.muscleGroup]}
                </option>
              ))}

              {selectedExerciseId &&
                !filteredCatalog.some(
                  (exercise) => exercise.id === selectedExerciseId,
                ) &&
                selectedExercise && (
                  <option value={selectedExercise.id}>
                    {selectedExercise.name} —{" "}
                    {muscleLabels[selectedExercise.muscleGroup]}
                  </option>
                )}
            </select>
          </label>

          {selectedExercise && (
            <p className="text-sm text-text-secondary">
              {availableVariations.length} variação(ões) disponível(is) para
              este exercício.
            </p>
          )}

          <label className="grid gap-2 text-sm text-text-primary">
            Variação
            <select
              value={prescription.exerciseVariationId}
              onChange={(event) =>
                updatePrescriptionField(
                  "exerciseVariationId",
                  event.target.value,
                )
              }
              required
              disabled={processing || !selectedExerciseId}
              className={fieldClassName}
            >
              <option value="">Selecione uma variação</option>

              {availableVariations.map((variation) => (
                <option key={variation.id} value={variation.id}>
                  {variation.name} — {categoryLabels[variation.category]} —{" "}
                  {levelLabels[variation.level]}
                </option>
              ))}
            </select>
          </label>

          {selectedVariation && (
            <div className="grid gap-4 rounded-xl border border-border-default bg-page p-4 sm:grid-cols-[120px_1fr]">
              <WorkoutExerciseImage
                imageUrl={selectedVariation.imageUrl}
                imageReviewStatus={selectedVariation.imageReviewStatus}
                name={selectedVariation.name}
                size="small"
              />

              <div className="grid min-w-0 content-start gap-2">
                <h4 className="font-semibold text-text-primary">
                  {selectedVariation.name}
                </h4>

                <p className="text-sm text-text-secondary">
                  {categoryLabels[selectedVariation.category]}
                  {" • "}
                  {levelLabels[selectedVariation.level]}
                </p>

                {selectedVariation.equipment && (
                  <p className="text-sm text-text-secondary">
                    Equipamento: {selectedVariation.equipment}
                  </p>
                )}

                {selectedVariation.description && (
                  <p className="text-sm text-text-secondary">
                    {selectedVariation.description}
                  </p>
                )}

                {selectedVariation.instructions && (
                  <p className="whitespace-pre-line text-sm text-text-secondary">
                    Instruções: {selectedVariation.instructions}
                  </p>
                )}

                {selectedVariation.safetyNotes && (
                  <p className="whitespace-pre-line text-sm text-text-secondary">
                    Cuidados: {selectedVariation.safetyNotes}
                  </p>
                )}

                {selectedVariation.imageUrl &&
                  selectedVariation.imageReviewStatus !== "REJECTED" && (
                    <a
                      href={selectedVariation.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Abrir imagem original
                    </a>
                  )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-text-primary">
              Séries
              <input
                type="number"
                min={1}
                max={20}
                step={1}
                required
                value={prescription.sets}
                onChange={(event) =>
                  updatePrescriptionField("sets", event.target.value)
                }
                disabled={processing}
                className={fieldClassName}
              />
            </label>

            <label className="grid gap-2 text-sm text-text-primary">
              Repetições
              <input
                type="text"
                required
                maxLength={50}
                value={prescription.repetitions}
                onChange={(event) =>
                  updatePrescriptionField("repetitions", event.target.value)
                }
                placeholder="Ex.: 8-12"
                disabled={processing}
                className={fieldClassName}
              />
            </label>

            <label className="grid gap-2 text-sm text-text-primary">
              Carga
              <input
                type="number"
                min={0}
                max={999999.99}
                step="0.01"
                value={prescription.weight}
                onChange={(event) =>
                  updatePrescriptionField("weight", event.target.value)
                }
                placeholder="Opcional"
                disabled={processing}
                className={fieldClassName}
              />
            </label>

            <label className="grid gap-2 text-sm text-text-primary">
              Unidade
              <select
                value={prescription.weightUnit}
                onChange={(event) =>
                  updatePrescriptionField(
                    "weightUnit",
                    event.target.value as "KG" | "LB",
                  )
                }
                disabled={processing}
                className={fieldClassName}
              >
                <option value="KG">Quilogramas (kg)</option>
                <option value="LB">Libras (lb)</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-text-primary sm:col-span-2">
              Descanso (segundos)
              <input
                type="number"
                min={0}
                max={3600}
                step={1}
                value={prescription.restSeconds}
                onChange={(event) =>
                  updatePrescriptionField("restSeconds", event.target.value)
                }
                placeholder="Ex.: 60"
                disabled={processing}
                className={fieldClassName}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-text-primary">
            Observações
            <textarea
              value={prescription.notes}
              onChange={(event) =>
                updatePrescriptionField("notes", event.target.value)
              }
              maxLength={1000}
              rows={3}
              placeholder="Ex.: manter postura e controlar a execução."
              disabled={processing}
              className={fieldClassName}
            />
          </label>

          <div className="flex flex-wrap gap-3 border-t border-border-default pt-4">
            <button
              type="submit"
              disabled={processing}
              className={primaryButtonClassName}
            >
              {processing
                ? "Salvando..."
                : editingExerciseId
                  ? "Salvar alterações"
                  : "Adicionar à ficha"}
            </button>

            <button
              type="button"
              disabled={processing}
              onClick={resetPrescription}
              className={buttonClassName}
            >
              Cancelar
            </button>
          </div>
        </form>
      </WorkoutModal>
    </div>
  );
}
