import styled from 'styled-components'

export const Container = styled.div`
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);

  min-height: 100vh;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

export const Sidebar = styled.aside`
  padding: 2rem 1.5rem;

  background: ${({ theme }) => theme.gray[900]};
  color: ${({ theme }) => theme.white};

  @media (max-width: 768px) {
    padding: 1rem;
  }
`

export const Logo = styled.strong`
  display: flex;
  flex-direction: column;

  margin-bottom: 3rem;

  font-size: 1.25rem;

  span {
    color: ${({ theme }) => theme.gray[400]};

    font-size: 0.875rem;
    font-weight: 400;
  }

  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`

export const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  a {
    padding: 0.875rem 1rem;

    color: ${({ theme }) => theme.gray[400]};
    text-decoration: none;

    border-radius: 0.5rem;

    transition:
      background-color 0.2s,
      color 0.2s;
  }

  a:hover,
  a.active {
    background: ${({ theme }) => theme.gray[800]};
    color: ${({ theme }) => theme.white};
  }

  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;

    a {
      flex-shrink: 0;
    }
  }
`

export const Content = styled.main`
  padding: 2rem;

  background: ${({ theme }) => theme.gray[100]};

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`