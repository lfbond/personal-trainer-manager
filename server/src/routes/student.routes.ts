import { Router } from 'express'

import { requireAuth } from '../middlewares/auth.middleware.js'

import { listStudentsController, getStudentByIdController, createStudentController, updateStudentController, archiveStudentController} from '../controllers/student.controller.js'

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

