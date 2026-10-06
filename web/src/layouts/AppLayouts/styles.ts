import styled from 'styled-components'

export const Container = styled.div`
  display: grid;
  grid-template-columns: 16rem 1fr;

  min-height: 100vh;
`

export const Sidebar = styled.aside`
  padding: 2rem 1.5rem;

  background: #18181b;
  color: #ffffff;
`

export const Logo = styled.strong`
  display: flex;
  flex-direction: column;

  margin-bottom: 2rem;

  font-size: 1.25rem;

  span {
    font-size: 0.875rem;
    font-weight: 400;
  }
`

export const Navigation = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  a {
    padding: 0.875rem 1rem;

    color: #a1a1aa;
    text-decoration: none;

    border-radius: 0.5rem;

    transition:
      background-color 0.2s,
      color 0.2s;
  }

  a:hover {
    background: #27272a;
    color: #ffffff;
  }

  a.active {
    background: #27272a;
    color: #ffffff;
  }
`

export const Content = styled.main`
  padding: 2rem;

  background: #f4f4f5;
`