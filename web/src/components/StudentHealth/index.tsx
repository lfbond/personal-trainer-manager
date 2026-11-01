
import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { z } from 'zod'

import {
  getStudentHealth,
  saveStudentHealth,
} from '../../services/student-health'

import type { StudentHealthData } from '../../types/student-health'

import {
  HealthContainer,
  HealthForm,
  Field,
  Button,
  Feedback,
} from './styles'

interface StudentHealthProps {
  studentId: string
  studentName: string
  onClose: () => void
}

const healthSchema = z.object({
  usesMedication: z.boolean().nullable(),
  medicationNotes: z.string().trim().max(2000).nullable(),
  medicalClearance: z.boolean().nullable(),
  clearanceNotes: z.string().trim().max(2000).nullable(),
  generalNotes: z.string().trim().max(4000).nullable(),
})

const emptyHealth: StudentHealthData = {
  usesMedication: null,
  medicationNotes: null,
  medicalClearance: null,
  clearanceNotes: null,
  generalNotes: null,
}

/**
 * Converte a seleção do formulário em boolean | null.
 */
function parseBoolean(value: string): boolean | null {
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export function StudentHealth({
  studentId,
  studentName,
  onClose,
}: StudentHealthProps) {
  const [values, setValues] = useState<StudentHealthData>(emptyHealth)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadHealth() {
      try {
        setLoading(true)
        setError('')

        const data = await getStudentHealth(studentId)

        if (!cancelled) {
          setValues(data ?? emptyHealth)
        }
      } catch (err) {
        if (cancelled) return

        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setValues(emptyHealth)
        } else {
          setError('Não foi possível carregar o perfil de saúde.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadHealth()

    return () => {
      cancelled = true
    }
  }, [studentId])

  function updateField<K extends keyof StudentHealthData>(
    field: K,
    value: StudentHealthData[K],
    ) {
    setValues((current) => ({
        ...current,
        [field]: value,
    }))
    }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const validation = healthSchema.safeParse(values)

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    try {
      setSaving(true)

      await saveStudentHealth(studentId, validation.data)

      setSuccess('Perfil de saúde salvo com sucesso.')
    } catch {
      setError('Não foi possível salvar o perfil de saúde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Feedback>Carregando perfil de saúde...</Feedback>
  }

  return (
    <HealthContainer>
      <h2>Perfil de saúde — {studentName}</h2>

      <HealthForm onSubmit={handleSubmit}>
        <Field>
          <label htmlFor="uses-medication">Utiliza medicamentos?</label>
          <select
            id="uses-medication"
            value={String(values.usesMedication)}
            onChange={(event) =>
              updateField(
                'usesMedication',
                parseBoolean(event.target.value),
              )
            }
          >
            <option value="null">Não informado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </Field>

        <Field>
          <label htmlFor="medication-notes">
            Observações sobre medicamentos
          </label>
          <textarea
            id="medication-notes"
            rows={3}
            maxLength={2000}
            value={values.medicationNotes ?? ''}
            onChange={(event) =>
              updateField('medicationNotes', event.target.value || null)
            }
          />
        </Field>

        <Field>
          <label htmlFor="medical-clearance">
            Possui liberação médica?
          </label>
          <select
            id="medical-clearance"
            value={String(values.medicalClearance)}
            onChange={(event) =>
              updateField(
                'medicalClearance',
                parseBoolean(event.target.value),
              )
            }
          >
            <option value="null">Não informado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </Field>

        <Field>
          <label htmlFor="clearance-notes">
            Observações sobre a liberação médica
          </label>
          <textarea
            id="clearance-notes"
            rows={3}
            maxLength={2000}
            value={values.clearanceNotes ?? ''}
            onChange={(event) =>
              updateField('clearanceNotes', event.target.value || null)
            }
          />
        </Field>

        <Field>
          <label htmlFor="general-notes">Observações gerais</label>
          <textarea
            id="general-notes"
            rows={5}
            maxLength={4000}
            value={values.generalNotes ?? ''}
            onChange={(event) =>
              updateField('generalNotes', event.target.value || null)
            }
          />
        </Field>

        {error && <Feedback role="alert">{error}</Feedback>}
        {success && <Feedback role="status">{success}</Feedback>}

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar perfil de saúde'}
          </Button>

          <Button type="button" onClick={onClose} disabled={saving}>
            Fechar
          </Button>
        </div>
      </HealthForm>
    </HealthContainer>
  )
}
