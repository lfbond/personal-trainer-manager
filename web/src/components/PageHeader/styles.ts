import styled from 'styled-components'

export const Container = styled.header`
  margin-bottom: 2rem;

  h1 {
    color: ${({ theme }) => theme.gray[900]};
    font-size: 2rem;
    line-height: 1.2;
  }

  p {
    margin-top: 0.5rem;

    color: ${({ theme }) => theme.gray[500]};
    line-height: 1.6;
  }
`