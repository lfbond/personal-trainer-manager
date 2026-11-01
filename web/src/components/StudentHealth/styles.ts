
import styled from 'styled-components'

export const HealthContainer = styled.section`
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.gray[200]};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.white};

  h2 {
    margin-bottom: 1.5rem;
  }
`

export const HealthForm = styled.form`
  display: grid;
  gap: 1rem;
`

export const Field = styled.div`
  display: grid;
  gap: 0.5rem;

  label {
    font-weight: 600;
  }

  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid ${({ theme }) => theme.gray[300]};
    border-radius: 0.5rem;
    background: ${({ theme }) => theme.white};
    font: inherit;
  }

  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid ${({ theme }) => theme.green[500]};
    outline-offset: 2px;
  }
`

export const Button = styled.button`
  margin-right: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.green[500]};
  color: ${({ theme }) => theme.white};
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const Feedback = styled.p`
  padding: 0.75rem;
  color: ${({ theme }) => theme.gray[700]};
`
