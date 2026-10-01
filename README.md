# Personal Trainer Manager

Sistema Full Stack para gerenciamento de alunos, exercícios e fichas de treino desenvolvido como projeto de portfólio e evolução técnica.

## 🚧 Status

**Em desenvolvimento — MVP Web v1.0**

O projeto está atualmente em sua fase inicial de arquitetura e preparação da estrutura Full Stack.

## 🎯 Objetivo

O Personal Trainer Manager tem como objetivo fornecer ao Personal Trainer uma aplicação centralizada para gerenciamento de:

- alunos;
- informações relevantes ao acompanhamento do aluno;
- restrições relacionadas ao treinamento;
- catálogo de exercícios;
- fichas de treino;
- prescrições de exercícios.

O sistema será desenvolvido inicialmente como aplicação Web e terá sua arquitetura preparada para posteriormente receber um aplicativo mobile desenvolvido com Flutter e Dart.

## 🏗️ Arquitetura

A aplicação seguirá inicialmente a seguinte arquitetura:

```text
React + TypeScript
        ↓
     REST API
        ↓
Node.js + TypeScript
      Express
        ↓
    Prisma ORM
        ↓
    PostgreSQL
```

A API será independente do frontend.

Futuramente:

```text
React ───────┐
             │
             ▼
          REST API
             ▲
             │
Flutter ─────┘
             │
             ▼
           Node.js
             │
           Prisma
             │
             ▼
         PostgreSQL
```

Dessa forma, tanto a aplicação Web quanto o aplicativo Mobile poderão utilizar a mesma API e as mesmas regras de negócio.

## 🧩 Domínio

O MVP foi inicialmente modelado com as seguintes entidades:

- `Trainer`
- `Student`
- `StudentHealthProfile`
- `StudentRestriction`
- `Exercise`
- `Workout`
- `WorkoutExercise`

### Principais relacionamentos

```text
Trainer 1:N Student
Trainer 1:N Exercise
Trainer 1:N Workout

Student 1:1 StudentHealthProfile
Student 1:N StudentRestriction
Student 1:N Workout

Workout 1:N WorkoutExercise
Exercise 1:N WorkoutExercise
```

A relação entre `Workout` e `Exercise` será muitos-para-muitos e será resolvida através da entidade `WorkoutExercise`.

Essa entidade também armazenará informações específicas da prescrição, como séries, repetições, carga, descanso, ordem e observações.

## 🩺 Informações relevantes ao treinamento

O sistema permitirá registrar informações e restrições declaradas pelo aluno que possam ser relevantes para o acompanhamento realizado pelo profissional.

Essas informações serão separadas entre:

- perfil geral;
- restrições;
- região corporal relacionada à restrição;
- observações relevantes.

O sistema não terá como objetivo realizar diagnósticos médicos ou recomendar automaticamente exercícios com base nessas informações.

## 📦 Estrutura planejada

```text
personal-trainer-manager/
│
├── docs/
│   └── architecture.md
│
├── web/
│   └── React + TypeScript
│
├── server/
│   └── Node.js + TypeScript + Express
│
├── .gitignore
└── README.md
```

## 🖥️ Frontend

Tecnologias planejadas:

- React
- TypeScript
- Vite
- Styled Components
- React Router
- Axios
- Zod

## ⚙️ Backend

Tecnologias planejadas:

- Node.js
- TypeScript
- Express
- Zod
- Prisma ORM

A organização inicial será baseada em:

```text
routes
    ↓
controllers
    ↓
schemas / validação
    ↓
services
    ↓
Prisma
    ↓
PostgreSQL
```

## 🗄️ Banco de dados

O banco relacional será PostgreSQL.

A modelagem prevê:

- UUIDs;
- Primary Keys;
- Foreign Keys;
- relacionamentos 1:1;
- relacionamentos 1:N;
- relacionamento N:N;
- enums;
- índices;
- arquivamento de alunos;
- preservação do histórico.

O acesso ao banco será realizado exclusivamente através do backend.

## 📱 Mobile

O aplicativo mobile não faz parte do primeiro MVP.

Após a conclusão da fundação Web/API, está planejado um cliente utilizando:

- Flutter
- Dart

O aplicativo consumirá a mesma REST API utilizada pelo frontend React.

## 🗺️ Roadmap

O desenvolvimento está organizado no GitHub através do milestone:

**MVP Web v1.0**

As principais etapas são:

1. Fundação e arquitetura
2. Frontend React + TypeScript
3. API Node.js + TypeScript
4. PostgreSQL + Prisma
5. Gestão de alunos
6. Catálogo de exercícios
7. Gestão de fichas de treino
8. Dashboard e integração
9. Preparação para produção e deploy

## 📚 Documentação

Decisões arquiteturais e detalhes técnicos serão documentados no diretório:

```text
docs/
```

A documentação será atualizada conforme a evolução real do projeto.

## 👨‍💻 Autor

**Luís Felipe Bond**

Desenvolvedor Full Stack JavaScript/TypeScript.