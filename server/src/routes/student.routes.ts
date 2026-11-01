import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'

import { listStudentsController, getStudentByIdController, createStudentController, updateStudentController, archiveStudentController, updateStudentStatusController} from '../controllers/student.controller.js'

import { getStudentHealthController, upsertStudentHealthController} from '../controllers/student-health.controller.js'

import { listStudentRestrictionsController, createStudentRestrictionController, updateStudentRestrictionController, deleteStudentRestrictionController} from '../controllers/student-restriction.controller.js'

export const studentRoutes = Router()

// Todas as rotas exigem autenticação JWT
studentRoutes.use(requireAuth)

// Listar alunos
studentRoutes.get('/', listStudentsController)
// Consultar aluno pelo ID
studentRoutes.get('/:id', getStudentByIdController)
// Cadastrar novo aluno
studentRoutes.post('/', createStudentController)
// Atualizar dados de um aluno
studentRoutes.patch('/:id', updateStudentController)
// Arquivar aluno sem excluir seu histórico
studentRoutes.delete('/:id', archiveStudentController)
// Consultar o perfil de saúde de um aluno
studentRoutes.get('/:id/health', getStudentHealthController)
// Cadastrar ou atualizar o perfil de saúde de um aluno
studentRoutes.put('/:id/health', upsertStudentHealthController)
// Restrições físicas dos alunos
//Listar restrições físicas
studentRoutes.get('/:id/restrictions', listStudentRestrictionsController)
//Cadastrar restrição
studentRoutes.post('/:id/restrictions', createStudentRestrictionController)
//Atualizar restrição
studentRoutes.patch('/:id/restrictions/:restrictionId', updateStudentRestrictionController)
//Excluir restrição
studentRoutes.delete('/:id/restrictions/:restrictionId', deleteStudentRestrictionController)
// Alterar o status de um aluno entre ativo e inativo
studentRoutes.patch('/:id/status', updateStudentStatusController)