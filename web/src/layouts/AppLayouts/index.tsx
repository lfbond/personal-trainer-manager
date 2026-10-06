import { NavLink, Outlet } from "react-router-dom";

import {
    Container,
    Sidebar,
    Logo,
    Navigation,
    Content,
} from './styles'

export function AppLayout() {
    return (
        <Container>
            <Sidebar>
                <Logo>
                    Personal Trainer 
                    <span>Manger</span>
                </Logo>

                <Navigation>
                    <NavLink to="/">Dashboard</NavLink>
                    <NavLink to="/students">Alunos</NavLink>
                    <NavLink to="/exercises">Exercícios</NavLink>
                    <NavLink to="/workouts">Treinos</NavLink>
                </Navigation>
            </Sidebar>

            <Content>
                <Outlet />                
            </Content>
        </Container>
    )
}