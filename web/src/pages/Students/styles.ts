import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

export const Toolbar = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
`

export const Filters = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex: 1;
`

export const SearchInput = styled.input`
  min-width: 220px;
  flex: 1;
  padding: 0.875rem 1rem;

  border: 1px solid ${({ theme }) => theme.gray[300]};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.white};

  font: inherit;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.green[500]};
    outline-offset: 2px;
  }
`

export const StatusSelect = styled.select`
  padding: 0.875rem 1rem;

  border: 1px solid ${({ theme }) => theme.gray[300]};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.white};

  font: inherit;
`

export const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.gray[200]};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.white};
`

export const StudentsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;

  th,
  td {
    padding: 1rem;
    border-bottom: 1px solid ${({ theme }) => theme.gray[200]};
  }

  th {
    color: ${({ theme }) => theme.gray[600]};
    font-size: 0.875rem;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`

export const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;

  color: ${({ $active, theme }) =>
    $active ? theme.green[600] : theme.gray[600]};

  background: ${({ $active, theme }) =>
    $active ? '#dcfce7' : theme.gray[200]};

  font-size: 0.75rem;
  font-weight: 700;
`

export const Feedback = styled.p`
  padding: 1.5rem;
  color: ${({ theme }) => theme.gray[600]};
`


export const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`

export const ActionButton = styled.button<{
  $variant?: 'primary' | 'danger' | 'neutral'
}>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.gray[300]};
  border-radius: 0.5rem;
  background: ${({ theme, $variant }) =>
    $variant === 'primary'
      ? theme.green[500]
      : $variant === 'danger'
        ? theme.red[500]
        : theme.white};

  color: ${({ theme, $variant }) =>
    $variant === 'primary' || $variant === 'danger'
      ? theme.white
      : theme.gray[700]};

  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const NewStudentButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  padding: 0.875rem 1.25rem;

  background: ${({ theme }) => theme.green[500]};
  color: ${({ theme }) => theme.white};

  border: 0;
  border-radius: 8px;

  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;

  cursor: pointer;
  white-space: nowrap;

  transition:
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.green[700]};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px #00875f33;
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.green[300]};
    outline-offset: 3px;
  }

  @media (max-width: 600px) {
    width: 100%;
  }
`
