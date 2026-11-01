import { useEffect, useState } from "react";
import axios from "axios";
import { StudentHealth } from '../../components/StudentHealth'
import { PageHeader } from "../../components/PageHeader";
import { getStudents,  getStudentById, updateStudentStatus, archiveStudent } from "../../services/students";
import { useAuth } from "../../hooks/useAuth";
import type { StudentDetails } from '../../types/student'
import { StudentForm } from '../../components/StudentForm'
import { StudentRestrictions } from '../../components/StudentRestrictions'


import type { Student, StudentStatus } from "../../types/student";
import { Container, Toolbar, Filters, SearchInput, StatusSelect, TableContainer, StudentsTable, StatusBadge, Feedback, ActionGroup, ActionButton, NewStudentButton } from "./styles";

export function Students() {
  const { signOut } = useAuth()

  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StudentStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentDetails | null>(null)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [processingStudentId, setProcessingStudentId] = useState<string | null>( null,)
  const [healthStudent, setHealthStudent] = useState<Student | null>(null)
  const [restrictionsStudent, setRestrictionsStudent] =
  useState<Student | null>(null)

  useEffect(() => {
    //Evita atualizar a tela após a limpeza do efeito
    let cancelled = false

    async function loadStudents() {
      try {
        const data = await getStudents({
          search: search.trim() || undefined,
          status: status || undefined,
        })

        if (!cancelled) {
          setStudents(data)
          setError('')
        }
      } catch (err) {
        if (cancelled) return

        setStudents([])

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          signOut()
        } else {
          setError('Não foi possível carregar os alunos.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    //Pequeno intervalo para evitar uma requisição por tecla.
    const timeout = window.setTimeout(() => {
      void loadStudents()
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [search, status, signOut, reloadKey])

  function handleNewStudent() {
    setRestrictionsStudent(null)
    // Fecha o formulário de saúde, caso esteja aberto.
    setHealthStudent(null)

    // Limpa o aluno selecionado para edição.
    setEditingStudent(null)

    // Abre o formulário para cadastrar um novo aluno.
    setFormOpen(true)
  }

async function handleEditStudent(id: string) {
  // Fecha o perfil de saúde antes de abrir a edição cadastral.
  setHealthStudent(null)
  setRestrictionsStudent(null)
  try {
    setLoadingStudent(true)
    setError('')

    const student = await getStudentById(id)

    setEditingStudent(student)
    setFormOpen(true)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          signOut()
        } else {
          setError('Não foi possível carregar os dados do aluno.')
        }
      } finally {
        setLoadingStudent(false)
      }
    }

  function handleFormSuccess() {
    setFormOpen(false)
    setEditingStudent(null)
    setLoading(true)
    setReloadKey((current) => current + 1)
  }

  function handleCancelForm() {
    setFormOpen(false)
    setEditingStudent(null)
  }


async function handleChangeStatus(
  student: Student,
  ) {
    const newStatus =
      student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    try {
      setProcessingStudentId(student.id)
      setError('')

      await updateStudentStatus(student.id, newStatus)

      // Solicita uma nova listagem ao backend.
      setLoading(true)
      setReloadKey((current) => current + 1)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut()
      } else {
        setError('Não foi possível alterar o status do aluno.')
      }
    } finally {
      setProcessingStudentId(null)
    }
  }


async function handleArchiveStudent(
  student: Student,
  ) {
    const confirmed = window.confirm(
      `Deseja arquivar o aluno "${student.name}"?\n\n` +
      'O aluno deixará de aparecer na listagem, ' +
      'mas seus dados serão preservados no banco.',
    )

    if (!confirmed) return

    try {
      setProcessingStudentId(student.id)
      setError('')

      await archiveStudent(student.id)

      // Atualiza a tabela para remover o aluno arquivado.
      setLoading(true)
      setReloadKey((current) => current + 1)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut()
      } else {
        setError('Não foi possível arquivar o aluno.')
      }
    } finally {
      setProcessingStudentId(null)
    }
  }


  return (
    <Container>
      <PageHeader
        title="Alunos"
        description="Gerencie seus alunos e acompanhe suas informações."
      />

      <Toolbar>
        <Filters>
          <SearchInput
            type="search"
            aria-label="Pesquisar alunos"
            placeholder="Pesquisar por nome ou e-mail..."
            value={search}
            onChange={(event) => {
              setLoading(true)
              setSearch(event.target.value)
            }}
          />

          <StatusSelect
            aria-label="Filtrar por status"
            value={status}
            onChange={(event) => {
              setLoading(true)
              setStatus(event.target.value as StudentStatus | '')
            }}
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="INACTIVE">Inativos</option>
          </StatusSelect>
        </Filters>
        <NewStudentButton
          type="button"
          onClick={handleNewStudent}
        >
          <span aria-hidden="true">+</span>
          Novo aluno
        </NewStudentButton>
      </Toolbar>

      {healthStudent && (
        <StudentHealth
          key={healthStudent.id}
          studentId={healthStudent.id}
          studentName={healthStudent.name}
          onClose={() => setHealthStudent(null)}
        />
      )}

      {restrictionsStudent && (
        <StudentRestrictions
          key={restrictionsStudent.id}
          studentId={restrictionsStudent.id}
          studentName={restrictionsStudent.name}
          onClose={() => setRestrictionsStudent(null)}
          onUnauthorized={signOut}
        />
      )}

      {formOpen && (
        <section aria-label={editingStudent ? 'Editar aluno' : 'Novo aluno'}>
          <h2>{editingStudent ? 'Editar aluno' : 'Cadastrar aluno'}</h2>

          <StudentForm
            key={editingStudent?.id ?? 'new'}
            student={editingStudent}
            onSuccess={handleFormSuccess}
            onCancel={handleCancelForm}
          />
        </section>
      )}

      {error && <Feedback role="alert">{error}</Feedback>}

      {loading ? (
        <Feedback>Carregando alunos...</Feedback>
      ) : !error && students.length === 0 ? (
        <Feedback>Nenhum aluno encontrado.</Feedback>
      ) : !error ? (
        <TableContainer>
          <StudentsTable>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email || 'Não informado'}</td>
                  <td>{student.phone || 'Não informado'}</td>
                  <td>
                    <StatusBadge $active={student.status === 'ACTIVE'}>
                      {student.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </StatusBadge>
                  </td>

                  <td>

                <ActionGroup>
                  {/* Editar informações cadastrais */}
                  <ActionButton
                    type="button"
                    $variant="neutral"
                    disabled={loadingStudent || processingStudentId !== null}
                    onClick={() => void handleEditStudent(student.id)}
                  >
                    Editar
                  </ActionButton>

                  {/* Ativar ou inativar aluno */}
                  <ActionButton
                    type="button"
                    $variant={
                      student.status === 'ACTIVE' ? 'neutral' : 'primary'
                    }
                    disabled={processingStudentId !== null || loadingStudent}
                    onClick={() => void handleChangeStatus(student)}
                  >
                    {processingStudentId === student.id
                      ? 'Processando...'
                      : student.status === 'ACTIVE'
                        ? 'Inativar'
                        : 'Ativar'}
                  </ActionButton>

                  {/* Abrir o perfil de saúde */}
                  <ActionButton
                    type="button"
                    $variant="neutral"
                    disabled={processingStudentId !== null || loadingStudent}
                    onClick={() => {
                      setFormOpen(false)
                      setHealthStudent(student)
                      setRestrictionsStudent(null)
                    }}
                  >
                    Saúde
                  </ActionButton>

                  <ActionButton
                    type="button"
                    $variant="neutral"
                    disabled={processingStudentId !== null || loadingStudent}
                    onClick={() => {
                      setFormOpen(false)
                      setHealthStudent(null)
                      setRestrictionsStudent(student)
                    }}
                  >
                    Restrições
                  </ActionButton>

                  {/* Arquivar aluno com confirmação */}
                  <ActionButton
                    type="button"
                    $variant="danger"
                    disabled={processingStudentId !== null || loadingStudent}
                    onClick={() => void handleArchiveStudent(student)}
                  >
                    {processingStudentId === student.id
                      ? 'Processando...'
                      : 'Arquivar'}
                  </ActionButton>

                </ActionGroup>

                  </td>

                </tr>
              ))}
            </tbody>
          </StudentsTable>
        </TableContainer>
      ) : null}
    </Container>
  )
}