
import { api } from "../lib/api";

export type WorkoutStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseVariationId: string;
  sets: number;
  repetitions: string;
  weight: number | string | null;
  weightUnit: "KG" | "LB";
  restSeconds: number | null;
  order: number;
  notes: string | null;
  exerciseNameSnapshot?: string | null;
  exerciseInstructionsSnapshot?: string | null;
  exerciseSafetyNotesSnapshot?: string | null;
  exerciseVariation?: {
    id: string;
    name: string;
    imageUrl?: string | null;
    imageReviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  };
}

export interface Workout {
  id: string;
  name: string;
  description: string | null;
  status: WorkoutStatus;
  version: number;
  studentId: string;
  previousWorkoutId?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
  };
  exercises?: WorkoutExercise[];
}

export interface CreateWorkoutData {
  studentId: string;
  name: string;
  description?: string | null;
}

export interface WorkoutExerciseData {
  exerciseVariationId: string;
  sets: number;
  repetitions: string;
  weight?: number | null;
  weightUnit?: "KG" | "LB";
  restSeconds?: number | null;
  notes?: string | null;
}

export async function getWorkouts(): Promise<Workout[]> {
  const response = await api.get<Workout[]>("/workouts");
  return response.data;
}

export async function getWorkout(id: string): Promise<Workout> {
  const response = await api.get<Workout>(`/workouts/${id}`);
  return response.data;
}

export async function createWorkout(
  data: CreateWorkoutData,
): Promise<Workout> {
  const response = await api.post<Workout>("/workouts", data);
  return response.data;
}

export async function updateWorkout(
  id: string,
  data: { name?: string; description?: string | null },
): Promise<Workout> {
  const response = await api.patch<Workout>(
    `/workouts/${id}`,
    data,
  );
  return response.data;
}

export async function archiveWorkout(id: string): Promise<void> {
  await api.delete(`/workouts/${id}`);
}

export async function addWorkoutExercise(
  workoutId: string,
  data: WorkoutExerciseData,
): Promise<WorkoutExercise> {
  const response = await api.post<WorkoutExercise>(
    `/workouts/${workoutId}/exercises`,
    data,
  );
  return response.data;
}

export async function updateWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  data: Partial<WorkoutExerciseData>,
): Promise<WorkoutExercise> {
  const response = await api.patch<WorkoutExercise>(
    `/workouts/${workoutId}/exercises/${exerciseId}`,
    data,
  );
  return response.data;
}

export async function removeWorkoutExercise(
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  await api.delete(
    `/workouts/${workoutId}/exercises/${exerciseId}`,
  );
}

export async function activateWorkout(id: string): Promise<Workout> {
  const response = await api.patch<Workout>(
    `/workouts/${id}/activate`,
  );
  return response.data;
}

export async function createWorkoutVersion(
  id: string,
): Promise<Workout> {
  const response = await api.post<Workout>(
    `/workouts/${id}/versions`,
  );
  return response.data;
}

export async function getWorkoutVersions(
  id: string,
): Promise<Workout[]> {
  const response = await api.get<Workout[]>(
    `/workouts/${id}/versions`,
  );
  return response.data;
}
