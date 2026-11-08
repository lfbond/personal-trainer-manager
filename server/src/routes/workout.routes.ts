
import { Router } from 'express'
import { requireAuth } from '../middlewares/auth.middleware.js'

import {
  createWorkoutController,
  listWorkoutsController,
  getWorkoutByIdController,
  updateWorkoutController,
  archiveWorkoutController,
  addWorkoutExerciseController,
  updateWorkoutExerciseController,
  removeWorkoutExerciseController,
  activateWorkoutController,
  createWorkoutVersionController,
  listWorkoutVersionsController,
} from '../controllers/workout.controller.js'

export const workoutRoutes = Router()

workoutRoutes.use(requireAuth)

workoutRoutes.get('/', listWorkoutsController)
workoutRoutes.get('/:id', getWorkoutByIdController)

workoutRoutes.post('/', createWorkoutController)

workoutRoutes.patch('/:id', updateWorkoutController)

workoutRoutes.delete('/:id', archiveWorkoutController)

workoutRoutes.post('/:id/exercises', addWorkoutExerciseController)

workoutRoutes.patch(
  '/:id/exercises/:exerciseId',
  updateWorkoutExerciseController,
)

workoutRoutes.delete(
  '/:id/exercises/:exerciseId',
  removeWorkoutExerciseController,
)


workoutRoutes.patch(
  '/:id/activate',
  activateWorkoutController,
)

workoutRoutes.post(
  '/:id/versions',
  createWorkoutVersionController,
)

workoutRoutes.get(
  '/:id/versions',
  listWorkoutVersionsController,
)
