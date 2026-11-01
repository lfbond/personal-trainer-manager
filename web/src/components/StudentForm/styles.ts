
import styled from 'styled-components'

export const Form = styled.form`
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
  background: ${({ theme }) => theme.white};
  border: 1px solid ${({ theme }) => theme.gray[200]};
  border-radius: 0.75rem;
`

export const Field = styled.div`
  display: grid;
  gap: 0.4rem;

  label {
    font-weight: 600;
    font-size: 0.875rem;
  }

  input,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${({ theme }) => theme.gray[300]};
    border-radius: 0.5rem;
    background: ${({ theme }) => theme.white};
    font: inherit;
  }

  input:focus-visible,
  textarea:focus-visible {
    outline: 2px solid ${({ theme }) => theme.green[500]};
    outline-offset: 2px;
  }
`

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
`

export const PrimaryButton = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.green[500]};
  color: ${({ theme }) => theme.white};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const SecondaryButton = styled.button`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.gray[300]};
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.white};
  cursor: pointer;
`

export const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.red[500]};
  font-size: 0.875rem;
`
