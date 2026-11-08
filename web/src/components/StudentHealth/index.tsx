
import { useEffect, useState, type FormEvent } from 'react'
import axios from 'axios'
import { z } from 'zod'

import {
  getStudentHealth,
  saveStudentHealth,
} from '../../services/student-health'

import type { StudentHealthData } from '../../types/student-health'

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
    return (
      <p
        role="status"
        className="rounded-lg border border-border-default bg-surface p-4 text-text-secondary"
      >
        Carregando perfil de saúde...
      </p>
    )
  }

  return (
    <section className="min-w-0 rounded-xl border border-border-default bg-surface p-4 text-text-primary md:p-6">
      <h2 className="mb-6 text-xl font-bold text-text-primary">
        Perfil de saúde — {studentName}
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid min-w-0 gap-2">
          <label htmlFor="uses-medication" className={labelClassName}>
            Utiliza medicamentos?
          </label>

          <select
            id="uses-medication"
            className={fieldClassName}
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
        </div>

        <div className="grid min-w-0 gap-2">
          <label htmlFor="medication-notes" className={labelClassName}>
            Observações sobre medicamentos
          </label>

          <textarea
            id="medication-notes"
            className={fieldClassName}
            rows={3}
            maxLength={2000}
            value={values.medicationNotes ?? ''}
            onChange={(event) =>
              updateField(
                'medicationNotes',
                event.target.value || null,
              )
            }
          />
        </div>

        <div className="grid min-w-0 gap-2">
          <label htmlFor="medical-clearance" className={labelClassName}>
            Possui liberação médica?
          </label>

          <select
            id="medical-clearance"
            className={fieldClassName}
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
        </div>

        <div className="grid min-w-0 gap-2">
          <label htmlFor="clearance-notes" className={labelClassName}>
            Observações sobre a liberação médica
          </label>

          <textarea
            id="clearance-notes"
            className={fieldClassName}
            rows={3}
            maxLength={2000}
            value={values.clearanceNotes ?? ''}
            onChange={(event) =>
              updateField(
                'clearanceNotes',
                event.target.value || null,
              )
            }
          />
        </div>

        <div className="grid min-w-0 gap-2">
          <label htmlFor="general-notes" className={labelClassName}>
            Observações gerais
          </label>

          <textarea
            id="general-notes"
            className={fieldClassName}
            rows={5}
            maxLength={4000}
            value={values.generalNotes ?? ''}
            onChange={(event) =>
              updateField(
                'generalNotes',
                event.target.value || null,
              )
            }
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="text-sm font-medium text-primary">
            {success}
          </p>
        )}

        <div className="flex flex-col-reverse flex-wrap gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={[
              buttonBaseClassName,
              'border-border-default bg-surface text-text-primary',
              'hover:enabled:!border-primary',
              'hover:enabled:!bg-primary',
              'hover:enabled:!text-white',
            ].join(' ')}
          >
            Fechar
          </button>

          <button
            type="submit"
            disabled={saving}
            className={[
              buttonBaseClassName,
              'border-primary bg-primary !text-white',
              'hover:enabled:!bg-primary-hover',
            ].join(' ')}
          >
            {saving ? 'Salvando...' : 'Salvar perfil de saúde'}
          </button>
        </div>
      </form>
    </section>
  )
}
