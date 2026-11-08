import type { RequestHandler } from 'express'

import { AppError } from '../lib/app-error.js'
import { getTrainerContext } from '../services/trainer-context.service.js'
import { 
    createWorkoutSchema, 
    workoutParamsSchema,
    workoutExerciseParamsSchema,
    addWorkoutExerciseSchema,
    updateWorkoutExerciseSchema,
    updateWorkoutSchema,} from '../schemas/workout.schema.js'
import {
  createWorkout,
  listWorkouts,
  getWorkoutById,
  updateWorkout,
  archiveWorkout,
  addWorkoutExercise,
  updateWorkoutExercise,
  removeWorkoutExercise,
  activateWorkout,
  createWorkoutVersion,
  listWorkoutVersions,
} from '../services/workout.service.js'


export const createWorkoutController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const data = createWorkoutSchema.parse(req.body)

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const workout = await createWorkout({
    data,
    trainerId,
    organizationId,
  })

  res.status(201).json(workout)
}


export const listWorkoutsController: RequestHandler = async (
  req,
  res,
) => {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  const { trainerId, organizationId } =
    await getTrainerContext(userId)

  const workouts = await listWorkouts({
    trainerId,
    organizationId,
  })

  res.status(200).json(workouts)
}


async function getWorkoutContext(res: {
  locals: Record<string, any>
}) {
  const userId = res.locals.userId as string | undefined

  if (!userId) {
    throw new AppError('Usuário não autenticado.', 401)
  }

  return getTrainerContext(userId)
}

export const getWorkoutByIdController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const context = await getWorkoutContext(res)

    const workout = await getWorkoutById({
      id,
      ...context,
    })

    res.status(200).json(workout)
  }

export const updateWorkoutController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const data = updateWorkoutSchema.parse(req.body)
    const context = await getWorkoutContext(res)

    const workout = await updateWorkout({
      id,
      data,
      ...context,
    })

    res.status(200).json(workout)
  }

export const archiveWorkoutController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const context = await getWorkoutContext(res)

    await archiveWorkout({
      id,
      ...context,
    })

    res.status(204).send()
  }

  
export const addWorkoutExerciseController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const data = addWorkoutExerciseSchema.parse(req.body)
    const context = await getWorkoutContext(res)

    const exercise = await addWorkoutExercise({
      id,
      data,
      ...context,
    })

    res.status(201).json(exercise)
  }

export const updateWorkoutExerciseController: RequestHandler =
  async (req, res) => {
    const { id, exerciseId } =
      workoutExerciseParamsSchema.parse(req.params)

    const data = updateWorkoutExerciseSchema.parse(req.body)
    const context = await getWorkoutContext(res)

    const exercise = await updateWorkoutExercise({
      id,
      exerciseId,
      data,
      ...context,
    })

    res.status(200).json(exercise)
  }

export const removeWorkoutExerciseController: RequestHandler =
  async (req, res) => {
    const { id, exerciseId } =
      workoutExerciseParamsSchema.parse(req.params)

    const context = await getWorkoutContext(res)

    await removeWorkoutExercise({
      id,
      exerciseId,
      ...context,
    })

    res.status(204).send()
  }

  
export const activateWorkoutController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const context = await getWorkoutContext(res)

    const workout = await activateWorkout({
      id,
      ...context,
    })

    res.status(200).json(workout)
  }

export const createWorkoutVersionController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const context = await getWorkoutContext(res)

    const workout = await createWorkoutVersion({
      id,
      ...context,
    })

    res.status(201).json(workout)
  }

export const listWorkoutVersionsController: RequestHandler =
  async (req, res) => {
    const { id } = workoutParamsSchema.parse(req.params)
    const context = await getWorkoutContext(res)

    const versions = await listWorkoutVersions({
      id,
      ...context,
    })

    res.status(200).json(versions)
  }
