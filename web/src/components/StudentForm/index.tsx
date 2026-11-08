
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import axios from 'axios'

import {
  createStudent,
  updateStudent,
} from '../../services/students'

import type {
  StudentDetails,
  StudentFormData,
} from '../../types/student'

const studentSchema = z.object({
  name: z.string().trim().min(3, 'Informe pelo menos 3 caracteres.').max(120),
  email: z.union([
    z.email('Informe um e-mail válido.'),
    z.literal(''),
  ]),
  phone: z.string().trim().max(20),
  birthDate: z.union([
    z.iso.date(),
    z.literal(''),
  ]),
  notes: z.string().trim().max(2000),
})

type StudentFormValues = z.infer<typeof studentSchema>

interface StudentFormProps {
  student?: StudentDetails | null
  onSuccess: () => void
  onCancel: () => void
}

const fieldClassName = [
  'w-full min-w-0 rounded-lg border border-border-default',
  'bg-surface px-3 py-3 text-text-primary',
  'transition-colors duration-200',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-primary',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

const labelClassName =
  'text-sm font-semibold text-text-primary'

const buttonBaseClassName = [
  'min-h-11 rounded-lg px-4 py-3 font-bold',
  'transition-all duration-200 ease-in-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-primary',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ')

export function StudentForm({
  student,
  onSuccess,
  onCancel,
}: StudentFormProps) {
  const [values, setValues] = useState<StudentFormValues>({
    name: student?.name ?? '',
    email: student?.email ?? '',
    phone: student?.phone ?? '',
    birthDate: student?.birthDate?.slice(0, 10) ?? '',
    notes: student?.notes ?? '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(
    field: keyof StudentFormValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validation = studentSchema.safeParse(values)

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Dados inválidos.')
      return
    }

    const data: StudentFormData = {
      name: validation.data.name.trim(),
      email: validation.data.email.trim() || null,
      phone: validation.data.phone.trim() || null,
      birthDate: validation.data.birthDate || null,
      notes: validation.data.notes.trim() || null,
    }

    try {
      setSaving(true)

      if (student) {
        await updateStudent(student.id, data)
      } else {
        await createStudent(data)
      }

      onSuccess()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Sua sessão expirou. Faça login novamente.')
      } else {
        setError('Não foi possível salvar o aluno. Verifique os dados.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid min-w-0 gap-4 rounded-xl border border-border-default bg-surface p-4 text-text-primary md:p-6"
    >
      <div className="grid min-w-0 gap-2">
        <label htmlFor="student-name" className={labelClassName}>
          Nome completo *
        </label>
        <input
          id="student-name"
          className={fieldClassName}
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          required
          minLength={3}
          maxLength={120}
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label htmlFor="student-email" className={labelClassName}>
          E-mail
        </label>
        <input
          id="student-email"
          type="email"
          className={fieldClassName}
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label htmlFor="student-phone" className={labelClassName}>
          Telefone
        </label>
        <input
          id="student-phone"
          type="tel"
          maxLength={20}
          className={fieldClassName}
          value={values.phone}
          onChange={(event) => updateField('phone', event.target.value)}
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label htmlFor="student-birth-date" className={labelClassName}>
          Data de nascimento
        </label>
        <input
          id="student-birth-date"
          type="date"
          className={fieldClassName}
          value={values.birthDate}
          onChange={(event) =>
            updateField('birthDate', event.target.value)
          }
        />
      </div>

      <div className="grid min-w-0 gap-2">
        <label htmlFor="student-notes" className={labelClassName}>
          Observações
        </label>
        <textarea
          id="student-notes"
          className={fieldClassName}
          rows={4}
          maxLength={2000}
          value={values.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse flex-wrap gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={[
            buttonBaseClassName,
            'border border-border-default bg-surface text-text-primary',
            'hover:enabled:!border-primary',
            'hover:enabled:!bg-primary hover:enabled:!text-white',
          ].join(' ')}
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={saving}
          className={[
            buttonBaseClassName,
            'border border-primary bg-primary text-white',
            'hover:enabled:!bg-primary-hover',
            'hover:enabled:!text-white',
          ].join(' ')}
        >
          {saving
            ? 'Salvando...'
            : student
              ? 'Salvar alterações'
              : 'Cadastrar aluno'}
        </button>
      </div>
    </form>
  )
}
