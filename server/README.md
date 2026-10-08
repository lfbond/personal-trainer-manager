# Personal Trainer Manager — API

API REST do Personal Trainer Manager, desenvolvida com Node.js, TypeScript e Express.

## Tecnologias

- Node.js
- TypeScript
- Express
- Zod
- CORS
- dotenv
- tsx

## Arquitetura

O backend segue uma organização modular:

- **Routes:** definem os endpoints da API.
- **Controllers:** recebem requisições e retornam respostas HTTP.
- **Services:** executam as operações e regras de negócio.
- **Schemas:** serão utilizados para validar os dados.
- **Lib:** contém configurações e recursos compartilhados.

## Instalação

Acesse a pasta `server`:

```bash
cd server
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` utilizando `.env.example` como referência.

```env
PORT=3333
WEB_URL=http://localhost:5173
```

## Executar em desenvolvimento

```bash
npm run dev
```

A API estará disponível em:

`http://localhost:3333`

## Compilar para produção

```bash
npm run build
```

## Executar a versão compilada

```bash
npm start
```

## Endpoints disponíveis

### GET /health

Verifica se a API está funcionando.

Resposta HTTP 200:

```json
{
  "status": "ok",
  "message": "API funcionando corretamente."
}
```

### Rotas inexistentes

Resposta HTTP 404:

```json
{
  "message": "Rota não encontrada."
}
```

## Tratamento de erros

A API possui tratamento centralizado para erros conhecidos da aplicação, erros de validação com Zod e falhas inesperadas.

As mensagens destinadas ao usuário são apresentadas em português brasileiro.

## Idioma

O código-fonte, as classes, as funções, os endpoints e os identificadores técnicos utilizam inglês.

A comunicação apresentada ao usuário utiliza português brasileiro (`pt-BR`), com possibilidade de internacionalização futura.

## Próximas etapas

- Integração com PostgreSQL e Prisma ORM.
- Modelagem das entidades do sistema.
- Gerenciamento de alunos.
- Catálogo de exercícios.
- Gerenciamento de treinos e fichas.
- Integração com o frontend React.
- Preparação da API para o aplicativo Flutter.