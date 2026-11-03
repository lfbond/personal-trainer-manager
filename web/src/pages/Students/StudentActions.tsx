
import type { Student } from '../../types/student'

interface StudentActionsProps {
  student: Student
  loadingStudent: boolean
  processingStudentId: string | null
  onEdit: (id: string) => void
  onChangeStatus: (student: Student) => void
  onHealth: (student: Student) => void
  onRestrictions: (student: Student) => void
  onArchive: (student: Student) => void
  mobile?: boolean
}

const baseButtonClassName = [
  'min-w-0 rounded-lg border px-3 py-2',
  'text-[0.8rem] font-semibold',
  'transition-all duration-200 ease-in-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'focus-visible:outline-primary',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

const neutralButtonClassName = [
  baseButtonClassName,
  'border-border-default bg-surface text-text-primary',
  'hover:!border-primary hover:!bg-primary hover:!text-white',
].join(' ')

const primaryButtonClassName = [
  baseButtonClassName,
  'border-primary bg-primary text-white',
  'hover:!bg-primary-hover hover:!text-white',
].join(' ')

const dangerButtonClassName = [
  baseButtonClassName,
  'border-danger bg-danger text-white',
  'hover:brightness-90',
].join(' ')

export function StudentActions({
  student,
  loadingStudent,
  processingStudentId,
  onEdit,
  onChangeStatus,
  onHealth,
  onRestrictions,
  onArchive,
  mobile = false,
}: StudentActionsProps) {
  const disabled = loadingStudent || processingStudentId !== null
  const processing = processingStudentId === student.id

  const containerClassName = mobile
    ? 'grid min-w-0 grid-cols-2 gap-2'
    : 'flex flex-wrap items-center gap-2'

  const mobileButtonClassName = mobile ? 'min-h-11' : ''

  return (
    <div className={containerClassName}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onEdit(student.id)}
        className={`${neutralButtonClassName} ${mobileButtonClassName}`}
      >
        Editar
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeStatus(student)}
        className={`${
          student.status === 'ACTIVE'
            ? neutralButtonClassName
            : primaryButtonClassName
        } ${mobileButtonClassName}`}
      >
        {processing
          ? 'Processando...'
          : student.status === 'ACTIVE'
            ? 'Inativar'
            : 'Ativar'}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onHealth(student)}
        className={`${neutralButtonClassName} ${mobileButtonClassName}`}
      >
        Saúde
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onRestrictions(student)}
        className={`${neutralButtonClassName} ${mobileButtonClassName}`}
      >
        Restrições
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onArchive(student)}
        className={`${dangerButtonClassName} ${
          mobile ? 'col-span-2 min-h-11' : ''
        }`}
      >
        {processing ? 'Processando...' : 'Arquivar'}
      </button>
    </div>
  )
}
