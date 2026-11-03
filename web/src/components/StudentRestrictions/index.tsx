
import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { z } from 'zod'

import {
  getStudentRestrictions,
  createStudentRestriction,
  updateStudentRestriction,
  deleteStudentRestriction,
} from '../../services/student-restrictions'

import {
  restrictionTypes,
  bodyRegions,
  restrictionTypeLabels,
  bodyRegionLabels,
} from '../../types/student-restriction'

import type {
  StudentRestriction,
  StudentRestrictionFormData,
} from '../../types/student-restriction'

interface StudentRestrictionsProps {
  studentId: string
  studentName: string
  onClose: () => void
  onUnauthorized: () => void
}

const restrictionSchema = z
  .object({
    type: z.enum(restrictionTypes),
    bodyRegion: z.enum(bodyRegions),
    description: z.string().trim().min(3).max(1000),
    notes: z.string().trim().max(2000).nullable(),
  })
  .strict()

const emptyForm: StudentRestrictionFormData = {
  type: 'JOINT',
  bodyRegion: 'SPINE',
  description: '',
  notes: null,
}

const fieldClassName = [
  'w-full min-w-0 rounded-lg border border-border-default',
  'bg-surface px-3 py-3 text-text-primary',
  'transition-colors duration-200',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-primary',
].join(' ')

const labelClassName = 'text-sm font-semibold text-text-primary'

const buttonBaseClassName = [
  'min-h-11 rounded-lg border px-4 py-3 font-semibold',
  'transition-all duration-200 ease-in-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-primary',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const primaryButtonClassName = [
  buttonBaseClassName,
  'border-primary bg-primary !text-white',
  'hover:enabled:!bg-primary-hover',
].join(' ')

const secondaryButtonClassName = [
  buttonBaseClassName,
  'border-border-default bg-surface text-text-primary',
  'hover:enabled:!border-primary',
  'hover:enabled:!bg-primary',
  'hover:enabled:!text-white',
].join(' ')

const dangerButtonClassName = [
  buttonBaseClassName,
  'border-danger bg-danger !text-white',
  'hover:enabled:brightness-90',
].join(' ')

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }
  }

  return fallback
}

export function StudentRestrictions({
  studentId,
  studentName,
  onClose,
  onUnauthorized,
}: StudentRestrictionsProps) {
  const [restrictions, setRestrictions] = useState<
    StudentRestriction[]
  >([])

  const [createForm, setCreateForm] =
    useState<StudentRestrictionFormData>({ ...emptyForm })

  const [editForm, setEditForm] =
    useState<StudentRestrictionFormData>({ ...emptyForm })

  const [editingId, setEditingId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDeleteSuccess, setIsDeleteSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadRestrictions() {
      setLoading(true)
      setError('')
      setSuccess('')
      setEditingId(null)
      setCreateForm({ ...emptyForm })
      setEditForm({ ...emptyForm })

      try {
        const data = await getStudentRestrictions(studentId)

        if (!cancelled) {
          setRestrictions(data)
        }
      } catch (err) {
        if (cancelled) return

        if (
          axios.isAxiosError(err) &&
          err.response?.status === 401
        ) {
          onUnauthorized()
          return
        }

        setError(
          getErrorMessage(
            err,
            'Não foi possível carregar as restrições.',
          ),
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadRestrictions()

    return () => {
      cancelled = true
    }
  }, [studentId, onUnauthorized])

  function updateCreateField<
    K extends keyof StudentRestrictionFormData,
  >(
    field: K,
    value: StudentRestrictionFormData[K],
  ) {
    setCreateForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function updateEditField<
    K extends keyof StudentRestrictionFormData,
  >(
    field: K,
    value: StudentRestrictionFormData[K],
  ) {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function resetEditing() {
    setEditingId(null)
    setEditForm({ ...emptyForm })
    setError('')
  }

  function startEditing(restriction: StudentRestriction) {
    if (saving || deletingId !== null) return

    setEditingId(restriction.id)

    setEditForm({
      type: restriction.type,
      bodyRegion: restriction.bodyRegion,
      description: restriction.description,
      notes: restriction.notes ?? null,
    })

    setError('')
    setSuccess('')
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (saving || deletingId !== null) return

    const parsed = restrictionSchema.safeParse(createForm)

    if (!parsed.success) {
      setError('Confira os campos da nova restrição.')
      setSuccess('')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await createStudentRestriction(studentId, parsed.data)

      const updated = await getStudentRestrictions(studentId)

      setRestrictions(updated)
      setCreateForm({ ...emptyForm })
      setSuccess('Restrição cadastrada com sucesso.')
      setIsDeleteSuccess(false)
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {
        onUnauthorized()
        return
      }

      setError(
        getErrorMessage(
          err,
          'Não foi possível cadastrar a restrição.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>,
    restrictionId: string,
  ) {
    event.preventDefault()

    if (saving || deletingId !== null) return

    const parsed = restrictionSchema.safeParse(editForm)

    if (!parsed.success) {
      setError('Confira os campos da restrição em edição.')
      setSuccess('')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateStudentRestriction(
        studentId,
        restrictionId,
        parsed.data,
      )

      const updated = await getStudentRestrictions(studentId)

      setRestrictions(updated)
      setEditingId(null)
      setEditForm({ ...emptyForm })
      setSuccess('Restrição atualizada com sucesso.')
      setIsDeleteSuccess(false)
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {
        onUnauthorized()
        return
      }

      setError(
        getErrorMessage(
          err,
          'Não foi possível atualizar a restrição.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(restriction: StudentRestriction) {
    if (saving || deletingId !== null) return

    const confirmed = window.confirm(
      'Deseja realmente excluir esta restrição?',
    )

    if (!confirmed) return

    setDeletingId(restriction.id)
    setError('')
    setSuccess('')

    try {
      await deleteStudentRestriction(
        studentId,
        restriction.id,
      )

      const updated = await getStudentRestrictions(studentId)

      setRestrictions(updated)

      if (editingId === restriction.id) {
        setEditingId(null)
        setEditForm({ ...emptyForm })
      }

      setIsDeleteSuccess(true)
      setSuccess('Restrição excluída com sucesso.')
    } catch (err) {
      if (
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {
        onUnauthorized()
        return
      }

      setError(
        getErrorMessage(
          err,
          'Não foi possível excluir a restrição.',
        ),
      )
    } finally {
      setDeletingId(null)
    }
  }

  function renderFields(
    values: StudentRestrictionFormData,
    updateField: <K extends keyof StudentRestrictionFormData>(
      field: K,
      value: StudentRestrictionFormData[K],
    ) => void,
    prefix: string,
  ) {
    return (
      <div className="grid min-w-0 gap-4">
        <div className="grid gap-2">
          <label
            htmlFor={`${prefix}-type`}
            className={labelClassName}
          >
            Tipo de restrição
          </label>

          <select
            id={`${prefix}-type`}
            className={fieldClassName}
            value={values.type}
            disabled={saving}
            onChange={(event) =>
              updateField(
                'type',
                event.target.value as StudentRestrictionFormData['type'],
              )
            }
          >
            {restrictionTypes.map((type) => (
              <option key={type} value={type}>
                {restrictionTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${prefix}-body-region`}
            className={labelClassName}
          >
            Região corporal
          </label>

          <select
            id={`${prefix}-body-region`}
            className={fieldClassName}
            value={values.bodyRegion}
            disabled={saving}
            onChange={(event) =>
              updateField(
                'bodyRegion',
                event.target.value as StudentRestrictionFormData['bodyRegion'],
              )
            }
          >
            {bodyRegions.map((region) => (
              <option key={region} value={region}>
                {bodyRegionLabels[region]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${prefix}-description`}
            className={labelClassName}
          >
            Descrição
          </label>

          <textarea
            id={`${prefix}-description`}
            className={fieldClassName}
            rows={3}
            maxLength={1000}
            required
            minLength={3}
            value={values.description}
            disabled={saving}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor={`${prefix}-notes`}
            className={labelClassName}
          >
            Observações
          </label>

          <textarea
            id={`${prefix}-notes`}
            className={fieldClassName}
            rows={3}
            maxLength={2000}
            value={values.notes ?? ''}
            disabled={saving}
            onChange={(event) =>
              updateField(
                'notes',
                event.target.value || null,
              )
            }
          />
        </div>
      </div>
    )
  }

  return (
    <section className="grid min-w-0 gap-5 rounded-xl border border-border-default bg-surface p-4 text-text-primary md:p-6">
      <div className="grid gap-2">
        <h2 className="text-xl font-bold text-text-primary">
          Restrições de {studentName}
        </h2>

        <p className="text-sm text-text-secondary">
          Cadastre e gerencie as restrições físicas do aluno.
        </p>
      </div>

      {loading ? (
        <p className="text-text-secondary">
          Carregando restrições...
        </p>
      ) : (
        <>
          <div className="grid gap-4 rounded-lg border border-border-default bg-page p-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Nova restrição
            </h3>

            <form
              className="grid gap-4"
              onSubmit={(event) => void handleCreate(event)}
            >
              {renderFields(
                createForm,
                updateCreateField,
                'create-restriction',
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={onClose}
                  disabled={saving || deletingId !== null}
                >
                  Fechar
                </button>

                <button
                  type="submit"
                  className={primaryButtonClassName}
                  disabled={saving || deletingId !== null}
                >
                  {saving ? 'Salvando...' : 'Cadastrar restrição'}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-danger p-3 text-sm text-danger"
            >
              {error}
            </p>
          )}

          
          {success && (
            <p
              role="status"
              className={[
                'rounded-lg border p-3 text-sm font-medium',
                isDeleteSuccess
                  ? 'border-danger text-danger'
                  : 'border-primary text-primary',
              ].join(' ')}
            >
              {success}
            </p>
          )}


          <div className="grid gap-4">
            <h3 className="text-lg font-semibold text-text-primary">
              Restrições cadastradas ({restrictions.length})
            </h3>

            {restrictions.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Nenhuma restrição cadastrada.
              </p>
            ) : (
              <div className="grid gap-3">
                {restrictions.map((restriction) => {
                  const isEditing = editingId === restriction.id
                  const isDeleting = deletingId === restriction.id

                  return (
                    <article
                      key={restriction.id}
                      className={[
                        'grid min-w-0 gap-3 rounded-lg border p-4',
                        'text-text-primary transition-colors duration-200',
                        isEditing
                          ? 'border-primary bg-surface'
                          : 'border-border-default bg-page',
                      ].join(' ')}
                    >
                      {isEditing ? (
                        <form
                          className="grid min-w-0 gap-4"
                          onSubmit={(event) =>
                            void handleUpdate(
                              event,
                              restriction.id,
                            )
                          }
                        >
                          <h4 className="text-base font-bold text-primary">
                            Editando restrição
                          </h4>

                          {renderFields(
                            editForm,
                            updateEditField,
                            `edit-${restriction.id}`,
                          )}

                          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              className={secondaryButtonClassName}
                              disabled={saving}
                              onClick={resetEditing}
                            >
                              Cancelar
                            </button>

                            <button
                              type="submit"
                              className={primaryButtonClassName}
                              disabled={saving}
                            >
                              {saving
                                ? 'Salvando...'
                                : 'Salvar alterações'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-text-primary">
                              {restrictionTypeLabels[restriction.type]}
                            </span>

                            <span className="text-text-secondary">
                              •
                            </span>

                            <span className="text-sm text-text-secondary">
                              {bodyRegionLabels[restriction.bodyRegion]}
                            </span>
                          </div>

                          <p className="whitespace-pre-wrap break-words text-sm text-text-primary">
                            {restriction.description}
                          </p>

                          {restriction.notes && (
                            <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">
                              <strong>Observações:</strong>{' '}
                              {restriction.notes}
                            </p>
                          )}

                          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              className={secondaryButtonClassName}
                              disabled={
                                saving || deletingId !== null
                              }
                              onClick={() =>
                                startEditing(restriction)
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className={dangerButtonClassName}
                              disabled={
                                saving || deletingId !== null
                              }
                              onClick={() =>
                                void handleDelete(restriction)
                              }
                            >
                              {isDeleting
                                ? 'Excluindo...'
                                : 'Excluir'}
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
