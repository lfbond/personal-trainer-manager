import { Container } from './styles'

interface PageHeaderProps {
    title: string
    description: string
}

export function PageHeader({
    title,
    description,
}: PageHeaderProps) {
    return (
        <Container>
            <h1>{title}</h1>
            <p>{description}</p>
        </Container>
    )
}