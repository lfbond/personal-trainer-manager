import { useEffect, useState } from "react";

import axios from "axios";

import { StudentHealth } from "../../components/StudentHealth";

import { PageHeader } from "../../components/PageHeader";

import {
  getStudents,
  getStudentById,
  updateStudentStatus,
  archiveStudent,
} from "../../services/students";

import { useAuth } from "../../hooks/useAuth";

import type {
  Student,
  StudentDetails,
  StudentStatus,
} from "../../types/student";

import { StudentForm } from "../../components/StudentForm";

import { StudentRestrictions } from "../../components/StudentRestrictions";

import { StudentActions } from "./StudentActions";

const fieldClassName = [
  "min-h-11 w-full min-w-0 rounded-lg border border-border-default",

  "bg-surface px-3 py-2 text-sm text-text-primary",

  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
].join(" ");

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

export function Students() {
  const { signOut } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<StudentStatus | "">("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingStudent, setEditingStudent] = useState<StudentDetails | null>(
    null,
  );

  const [loadingStudent, setLoadingStudent] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);

  const [processingStudentId, setProcessingStudentId] = useState<string | null>(
    null,
  );

  const [healthStudent, setHealthStudent] = useState<Student | null>(null);

  const [restrictionsStudent, setRestrictionsStudent] =
    useState<Student | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      try {
        const data = await getStudents({
          search: search.trim() || undefined,

          status: status || undefined,
        });

        if (!cancelled) {
          setStudents(data);

          setError("");
        }
      } catch (err) {
        if (cancelled) return;

        setStudents([]);

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          signOut();
        } else {
          setError("Não foi possível carregar os alunos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = window.setTimeout(() => {
      void loadStudents();
    }, 300);

    return () => {
      cancelled = true;

      window.clearTimeout(timeout);
    };
  }, [search, status, signOut, reloadKey]);

  function handleNewStudent() {
    setRestrictionsStudent(null);

    setHealthStudent(null);

    setEditingStudent(null);

    setFormOpen(true);
  }

  async function handleEditStudent(id: string) {
    setHealthStudent(null);

    setRestrictionsStudent(null);

    try {
      setLoadingStudent(true);

      setError("");

      const student = await getStudentById(id);

      setEditingStudent(student);

      setFormOpen(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
      } else {
        setError("Não foi possível carregar os dados do aluno.");
      }
    } finally {
      setLoadingStudent(false);
    }
  }

  function handleFormSuccess() {
    setFormOpen(false);

    setEditingStudent(null);

    setLoading(true);

    setReloadKey((current) => current + 1);
  }

  function handleCancelForm() {
    setFormOpen(false);

    setEditingStudent(null);
  }

  async function handleChangeStatus(student: Student) {
    const newStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setProcessingStudentId(student.id);

      setError("");

      await updateStudentStatus(student.id, newStatus);

      setLoading(true);

      setReloadKey((current) => current + 1);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
      } else {
        setError("Não foi possível alterar o status do aluno.");
      }
    } finally {
      setProcessingStudentId(null);
    }
  }

  async function handleArchiveStudent(student: Student) {
    const confirmed = window.confirm(
      `Deseja arquivar o aluno "${student.name}"?nn` +
        "O aluno deixará de aparecer na listagem, " +
        "mas seus dados serão preservados no banco.",
    );

    if (!confirmed) return;

    try {
      setProcessingStudentId(student.id);

      setError("");

      await archiveStudent(student.id);

      setLoading(true);

      setReloadKey((current) => current + 1);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        signOut();
      } else {
        setError("Não foi possível arquivar o aluno.");
      }
    } finally {
      setProcessingStudentId(null);
    }
  }

  function handleOpenHealth(student: Student) {
    setFormOpen(false);

    setHealthStudent(student);

    setRestrictionsStudent(null);
  }

  function handleOpenRestrictions(student: Student) {
    setFormOpen(false);

    setHealthStudent(null);

    setRestrictionsStudent(student);
  }

  return (
    <div className="min-w-0">
      <PageHeader
        title="Alunos"
        description="Gerencie seus alunos e acompanhe suas informações."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            aria-label="Pesquisar alunos"
            placeholder="Pesquisar por nome ou e-mail..."
            value={search}
            onChange={(event) => {
              setLoading(true);

              setSearch(event.target.value);
            }}
            className={`${fieldClassName} sm:max-w-sm`}
          />

          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(event) => {
              setLoading(true);

              setStatus(event.target.value as StudentStatus | "");
            }}
            className={`${fieldClassName} sm:w-44`}
          >
            <option value="">Todos os status</option>

            <option value="ACTIVE">Ativos</option>

            <option value="INACTIVE">Inativos</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleNewStudent}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2 font-semibold !text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
        >
          <span aria-hidden="true">+</span>
          Novo aluno
        </button>
      </div>

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
        <section
          aria-label={editingStudent ? "Editar aluno" : "Novo aluno"}
          className="mb-6 rounded-xl border border-border-default bg-surface p-4 sm:p-6"
        >
          <h2 className="mb-4 text-xl font-bold text-text-primary">
            {editingStudent ? "Editar aluno" : "Cadastrar aluno"}
          </h2>

          <StudentForm
            key={editingStudent?.id ?? "new"}
            student={editingStudent}
            onSuccess={handleFormSuccess}
            onCancel={handleCancelForm}
          />
        </section>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger px-4 py-3 text-danger"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-text-secondary" role="status">
          Carregando alunos...
        </p>
      ) : !error && students.length === 0 ? (
        <p className="py-6 text-text-secondary">Nenhum aluno encontrado.</p>
      ) : !error ? (
        <>
          {/* Tabela desktop */}

          <div className="hidden min-w-0 md:block">
            <div className="w-full overflow-x-auto rounded-xl border border-border-default bg-surface">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm text-text-primary">
                <thead className="bg-page text-text-secondary">
                  <tr>
                    {["Nome", "E-mail", "Telefone", "Status", "Ações"].map(
                      (heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className="px-4 py-3 font-semibold"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-default">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-4 font-semibold">
                        {student.name}
                      </td>

                      <td className="px-4 py-4">
                        {student.email || "Não informado"}
                      </td>

                      <td className="px-4 py-4">
                        {student.phone || "Não informado"}
                      </td>

                      <td className="px-4 py-4">
                        <StudentStatusBadge status={student.status} />
                      </td>

                      <td className="px-4 py-4">
                        <StudentActions
                          student={student}
                          loadingStudent={loadingStudent}
                          processingStudentId={processingStudentId}
                          onEdit={(id) => void handleEditStudent(id)}
                          onChangeStatus={(item) =>
                            void handleChangeStatus(item)
                          }
                          onHealth={handleOpenHealth}
                          onRestrictions={handleOpenRestrictions}
                          onArchive={(item) => void handleArchiveStudent(item)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cartões mobile */}

          <div className="grid min-w-0 gap-4 md:hidden">
            {students.map((student) => (
              <article
                key={student.id}
                className="grid min-w-0 gap-4 rounded-xl border border-border-default bg-surface p-4"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="grid min-w-0 gap-2 [overflow-wrap:anywhere]">
                    <strong className="text-base text-text-primary">
                      {student.name}
                    </strong>

                    <p className="text-sm text-text-secondary">
                      {student.email || "E-mail não informado"}
                    </p>

                    <p className="text-sm text-text-secondary">
                      {student.phone || "Telefone não informado"}
                    </p>
                  </div>

                  <StudentStatusBadge status={student.status} />
                </div>

                <StudentActions
                  student={student}
                  loadingStudent={loadingStudent}
                  processingStudentId={processingStudentId}
                  onEdit={(id) => void handleEditStudent(id)}
                  onChangeStatus={(item) => void handleChangeStatus(item)}
                  onHealth={handleOpenHealth}
                  onRestrictions={handleOpenRestrictions}
                  onArchive={(item) => void handleArchiveStudent(item)}
                  mobile
                />
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
