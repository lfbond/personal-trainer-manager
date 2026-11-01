
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

import { Form, Field, Actions, PrimaryButton, SecondaryButton, ErrorMessage} from './styles.ts'

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
    <Form onSubmit={handleSubmit}>
      <Field>
        <label htmlFor="student-name">Nome completo *</label>
        <input
          id="student-name"
          value={values.name}
          onChange={(event) => updateField('name', event.target.value)}
          required
          minLength={3}
          maxLength={120}
        />
      </Field>

      <Field>
        <label htmlFor="student-email">E-mail</label>
        <input
          id="student-email"
          type="email"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </Field>

      <Field>
        <label htmlFor="student-phone">Telefone</label>
        <input
          id="student-phone"
          type="tel"
          maxLength={20}
          value={values.phone}
          onChange={(event) => updateField('phone', event.target.value)}
        />
      </Field>

      <Field>
        <label htmlFor="student-birth-date">Data de nascimento</label>
        <input
          id="student-birth-date"
          type="date"
          value={values.birthDate}
          onChange={(event) =>
            updateField('birthDate', event.target.value)
          }
        />
      </Field>

      <Field>
        <label htmlFor="student-notes">Observações</label>
        <textarea
          id="student-notes"
          rows={4}
          maxLength={2000}
          value={values.notes}
          onChange={(event) => updateField('notes', event.target.value)}
        />
      </Field>

      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}

      <Actions>
        <SecondaryButton type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </SecondaryButton>

        <PrimaryButton type="submit" disabled={saving}>
          {saving ? 'Salvando...' : student ? 'Salvar alterações' : 'Cadastrar aluno'}
        </PrimaryButton>
      </Actions>
    </Form>
  )
}
