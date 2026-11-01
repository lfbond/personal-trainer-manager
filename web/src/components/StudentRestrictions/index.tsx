
import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { z } from 'zod'

import { getStudentRestrictions, createStudentRestriction, updateStudentRestriction, deleteStudentRestriction} from '../../services/student-restrictions'

import { restrictionTypes, bodyRegions, restrictionTypeLabels, bodyRegionLabels} from '../../types/student-restriction'

import type { StudentRestriction, StudentRestrictionFormData} from '../../types/student-restriction'

import { RestrictionsContainer, RestrictionForm, Field, RestrictionCard, Actions, Button, Feedback} from './styles'

interface StudentRestrictionsProps {
  studentId: string
  studentName: string
  onClose: () => void
  onUnauthorized: () => void
}

const restrictionSchema = z.object({
  type: z.enum(restrictionTypes),
  bodyRegion: z.enum(bodyRegions),
  description: z.string().trim().min(3).max(1000),
  notes: z.string().trim().max(2000).nullable(),
}).strict()

const emptyForm: StudentRestrictionFormData = {
  type: 'JOINT',
  bodyRegion: 'SPINE',
  description: '',
  notes: null,
}

export function StudentRestrictions({
  studentId,
  studentName,
  onClose,
  onUnauthorized,
}: StudentRestrictionsProps) {
  const [restrictions, setRestrictions] = useState<StudentRestriction[]>([])
  const [form, setForm] = useState<StudentRestrictionFormData>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadRestrictions() {
      try {
        setLoading(true)
        setError('')

        const data = await getStudentRestrictions(studentId)

        if (!cancelled) {
          setRestrictions(data)
        }
      } catch (err) {
        if (cancelled) return

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          onUnauthorized()
        } else {
          setError('Não foi possível carregar as restrições.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadRestrictions()

    return () => {
      cancelled = true
    }
  }, [studentId, onUnauthorized])

  function updateField<K extends keyof StudentRestrictionFormData>(
    field: K,
    value: StudentRestrictionFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function startEditing(restriction: StudentRestriction) {
    setEditingId(restriction.id)

    setForm({
      type: restriction.type,
      bodyRegion: restriction.bodyRegion,
      description: restriction.description,
      notes: restriction.notes,
    })

    setError('')
    setSuccess('')
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = restrictionSchema.safeParse(form)

    if (!validation.success) {
      setError(
        validation.error.issues[0]?.message ??
          'Verifique os dados informados.',
      )
      return
    }

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (editingId) {
        await updateStudentRestriction(
          studentId,
          editingId,
          validation.data,
        )
      } else {
        await createStudentRestriction(studentId, validation.data)
      }

      const updated = await getStudentRestrictions(studentId)
      setRestrictions(updated)

      resetForm()
      setSuccess('Restrição salva com sucesso.')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        onUnauthorized()
      } else {
        setError('Não foi possível salvar a restrição.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(restriction: StudentRestriction) {
    const confirmed = window.confirm(
      `Deseja excluir a restrição "${restriction.description}"?`,
    )

    if (!confirmed) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      await deleteStudentRestriction(studentId, restriction.id)

      const updated = await getStudentRestrictions(studentId)
      setRestrictions(updated)

      if (editingId === restriction.id) resetForm()

      setSuccess('Restrição excluída com sucesso.')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        onUnauthorized()
      } else {
        setError('Não foi possível excluir a restrição.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <RestrictionsContainer>
      <h2>Restrições físicas — {studentName}</h2>

      {loading ? (
        <Feedback>Carregando restrições...</Feedback>
      ) : (
        <>
          <h3>{editingId ? 'Editar restrição' : 'Nova restrição'}</h3>

          <RestrictionForm onSubmit={handleSubmit}>
            <Field>
              <label htmlFor="restriction-type">Tipo</label>
              <select
                id="restriction-type"
                value={form.type}
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
            </Field>

            <Field>
              <label htmlFor="body-region">Região corporal</label>
              <select
                id="body-region"
                value={form.bodyRegion}
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
            </Field>

            <Field>
              <label htmlFor="restriction-description">Descrição</label>
              <textarea
                id="restriction-description"
                rows={3}
                maxLength={1000}
                required
                minLength={3}
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
              />
            </Field>

            <Field>
              <label htmlFor="restriction-notes">Observações</label>
              <textarea
                id="restriction-notes"
                rows={3}
                maxLength={2000}
                value={form.notes ?? ''}
                onChange={(event) =>
                  updateField('notes', event.target.value || null)
                }
              />
            </Field>

            <Actions>
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Salvando...'
                  : editingId
                    ? 'Salvar alterações'
                    : 'Cadastrar restrição'}
              </Button>

              {editingId && (
                <Button type="button" onClick={resetForm} disabled={saving}>
                  Cancelar edição
                </Button>
              )}

              <Button type="button" onClick={onClose} disabled={saving}>
                Fechar
              </Button>
            </Actions>
          </RestrictionForm>

          {error && <Feedback role="alert">{error}</Feedback>}
          {success && <Feedback role="status">{success}</Feedback>}

          <h3>Restrições cadastradas</h3>

          {restrictions.length === 0 ? (
            <Feedback>Nenhuma restrição cadastrada.</Feedback>
          ) : (
            restrictions.map((restriction) => (
              <RestrictionCard key={restriction.id}>
                <strong>
                  {restrictionTypeLabels[restriction.type]} —{' '}
                  {bodyRegionLabels[restriction.bodyRegion]}
                </strong>

                <p>{restriction.description}</p>

                {restriction.notes && (
                  <p>Observações: {restriction.notes}</p>
                )}

                <Actions>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => startEditing(restriction)}
                  >
                    Editar
                  </Button>

                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleDelete(restriction)}
                  >
                    Excluir
                  </Button>
                </Actions>
              </RestrictionCard>
            ))
          )}
        </>
      )}
    </RestrictionsContainer>
  )
}
