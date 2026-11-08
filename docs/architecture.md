# Personal Trainer Manager — Architecture

## Overview

O Personal Trainer Manager será uma aplicação Full Stack para gerenciamento de alunos, exercícios e fichas de treino.

A arquitetura foi planejada para manter frontend, backend e banco de dados desacoplados.

## Web Architecture

React + TypeScript
↓
REST API
↓
Node.js + TypeScript + Express
↓
Prisma ORM
↓
PostgreSQL

## Future Mobile Architecture

Flutter + Dart
↓
REST API
↓
Node.js + TypeScript + Express
↓
Prisma ORM
↓
PostgreSQL

O aplicativo mobile utilizará a mesma API utilizada pelo frontend Web.

## Main Domains

### Trainer

Representa o Personal Trainer responsável pelos alunos, exercícios e treinos.

### Student

Representa os alunos cadastrados pelo Personal Trainer.

### StudentHealthProfile

Armazena informações gerais relacionadas à saúde declaradas pelo aluno e relevantes ao acompanhamento.

### StudentRestriction

Representa restrições e limitações relevantes ao treinamento.

### Exercise

Representa o catálogo de exercícios do Personal Trainer.

### Workout

Representa uma ficha de treino associada a um aluno.

### WorkoutExercise

Representa a relação entre um exercício e uma ficha de treino.

Também armazena dados específicos da prescrição, como:

- séries;
- repetições;
- carga;
- descanso;
- ordem;
- observações.

## Relationships

Trainer 1:N Student

Trainer 1:N Exercise

Trainer 1:N Workout

Student 1:1 StudentHealthProfile

Student 1:N StudentRestriction

Student 1:N Workout

Workout 1:N WorkoutExercise

Exercise 1:N WorkoutExercise

Workout N:N Exercise através de WorkoutExercise

## API

A API REST será o núcleo da aplicação.

Tanto o frontend React quanto o futuro aplicativo Flutter deverão consumir a mesma API.

Nenhum cliente deverá acessar diretamente o PostgreSQL.

server/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── lib/
│   └── server.ts
│
├── prisma/
│   └── schema.prisma
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json

routes
   ↓
define URLs

controllers
   ↓
HTTP / req / res

schemas
   ↓
validação Zod

services
   ↓
regras de negócio

lib
   ↓
infraestrutura compartilhada

Prisma
   ↓
acesso ao banco

PostgreSQL

web/
└── src/
    ├── components/
    ├── pages/
    ├── layouts/
    ├── services/
    ├── hooks/
    ├── contexts/
    ├── styles/
    ├── utils/
    └── lib/

