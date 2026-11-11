import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { DemoModal } from "../../components/DemoModal";

type Level = "Iniciante" | "Intermediário" | "Avançado";
type Status = "ACTIVE" | "INACTIVE";

type Student = {
  id: number;
  name: string;
  goal: string;
  level: Level;
  status: Status;
  workouts: number;
};

type Workout = {
  id: number;
  name: string;
  student: string;
  focus: string;
  level: Level;
  exercises: string[];
};

type Organization = {
  id: number;
  name: string;
  type: string;
  status: string;
  teachers: string[];
};

type EditorialItem = {
  id: number;
  name: string;
  group: string;
  status: string;
};

const students: Student[] = [
  {
    id: 1,
    name: "Ana Martins",
    goal: "Hipertrofia",
    level: "Intermediário",
    status: "ACTIVE",
    workouts: 4,
  },
  {
    id: 2,
    name: "Bruno Almeida",
    goal: "Condicionamento físico",
    level: "Iniciante",
    status: "ACTIVE",
    workouts: 3,
  },
  {
    id: 3,
    name: "Carla Oliveira",
    goal: "Fortalecimento muscular",
    level: "Intermediário",
    status: "ACTIVE",
    workouts: 3,
  },
  {
    id: 4,
    name: "Diego Ferreira",
    goal: "Hipertrofia",
    level: "Avançado",
    status: "ACTIVE",
    workouts: 5,
  },
  {
    id: 5,
    name: "Fernanda Costa",
    goal: "Condicionamento físico",
    level: "Iniciante",
    status: "INACTIVE",
    workouts: 2,
  },
  {
    id: 6,
    name: "Gabriel Souza",
    goal: "Resistência muscular",
    level: "Intermediário",
    status: "ACTIVE",
    workouts: 4,
  },
];

const workouts: Workout[] = [
  {
    id: 1,
    name: "Treino A — Peito e tríceps",
    student: "Ana Martins",
    focus: "Membros superiores",
    level: "Intermediário",
    exercises: [
      "Supino reto — 3 séries de 12 repetições",
      "Crucifixo — 3 séries de 12 repetições",
      "Tríceps na polia — 3 séries de 15 repetições",
    ],
  },
  {
    id: 2,
    name: "Treino B — Costas e bíceps",
    student: "Ana Martins",
    focus: "Membros superiores",
    level: "Intermediário",
    exercises: [
      "Puxada frontal — 3 séries de 12 repetições",
      "Remada baixa — 3 séries de 12 repetições",
      "Rosca direta — 3 séries de 12 repetições",
    ],
  },
  {
    id: 3,
    name: "Treino inicial — Corpo inteiro",
    student: "Bruno Almeida",
    focus: "Adaptação",
    level: "Iniciante",
    exercises: [
      "Agachamento livre — 3 séries de 10 repetições",
      "Remada sentada — 3 séries de 12 repetições",
      "Elevação de panturrilhas — 3 séries de 15 repetições",
    ],
  },
  {
    id: 4,
    name: "Treino C — Membros inferiores",
    student: "Carla Oliveira",
    focus: "Pernas e glúteos",
    level: "Intermediário",
    exercises: [
      "Leg press — 3 séries de 12 repetições",
      "Cadeira extensora — 3 séries de 12 repetições",
      "Mesa flexora — 3 séries de 12 repetições",
    ],
  },
  {
    id: 5,
    name: "Treino avançado — Superiores",
    student: "Diego Ferreira",
    focus: "Hipertrofia",
    level: "Avançado",
    exercises: [
      "Supino inclinado — 4 séries de 10 repetições",
      "Remada curvada — 4 séries de 10 repetições",
      "Desenvolvimento — 4 séries de 10 repetições",
    ],
  },
];

const organizations: Organization[] = [
  {
    id: 1,
    name: "Academia Movimento",
    type: "Academia",
    status: "Ativa",
    teachers: ["Mariana Lopes", "Rafael Santos", "Patrícia Lima"],
  },
  {
    id: 2,
    name: "Equipe Performance",
    type: "Assessoria esportiva",
    status: "Ativa",
    teachers: ["Lucas Pereira", "Juliana Rocha"],
  },
  {
    id: 3,
    name: "Studio Equilíbrio",
    type: "Estúdio de treinamento",
    status: "Ativa",
    teachers: ["Camila Ribeiro", "Eduardo Martins"],
  },
];

const editorialItems: EditorialItem[] = [
  {
    id: 1,
    name: "Supino reto com barra",
    group: "Peito",
    status: "Aguardando revisão",
  },
  {
    id: 2,
    name: "Remada baixa na máquina",
    group: "Costas",
    status: "Aguardando revisão",
  },
  { id: 3, name: "Agachamento livre", group: "Pernas", status: "Aprovado" },
  {
    id: 4,
    name: "Elevação lateral",
    group: "Ombros",
    status: "Aguardando revisão",
  },
];

const cardClass =
  "rounded-2xl border border-border-default bg-surface p-5 sm:p-6";

const inputClass =
  "w-full rounded-xl border border-border-default bg-page px-4 py-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const buttonClass =
  "rounded-xl border border-border-default bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-page";

function StatusBadge({
  children,
  positive = false,
}: {
  children: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <span
      className={
        positive
          ? "inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          : "inline-flex rounded-full border border-border-default bg-page px-3 py-1 text-xs font-semibold text-text-secondary"
      }
    >
      {children}
    </span>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-2">
      <h2 className="text-xl font-bold text-text-primary sm:text-2xl">
        {title}
      </h2>
      <p className="text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className={cardClass}>
      <p className="text-sm text-text-secondary">{label}</p>
      <strong className="mt-3 block text-3xl font-extrabold">{value}</strong>
      <p className="mt-2 text-xs text-text-secondary">{detail}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-1 rounded-xl bg-page p-4">
      <span className="text-xs text-text-secondary">{label}</span>
      <strong className="break-words text-sm text-text-primary">{value}</strong>
    </div>
  );
}

function DashboardDemo() {
  const activeStudents = students.filter(
    (student) => student.status === "ACTIVE",
  ).length;

  const totalPrescriptions = students.reduce(
    (total, student) => total + student.workouts,
    0,
  );

  return (
    <div className="grid gap-6">
      <SectionHeader
        title="Visão geral"
        description="Indicadores e atividades ilustrativas de uma plataforma de gestão de treinamentos."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alunos cadastrados"
          value={students.length}
          detail="Dados fictícios"
        />
        <StatCard
          label="Alunos ativos"
          value={activeStudents}
          detail="Dados fictícios"
        />
        <StatCard
          label="Treinos prescritos"
          value={totalPrescriptions}
          detail="Total ilustrativo"
        />
        <StatCard
          label="Modelos de treino"
          value={workouts.length}
          detail="Exemplos disponíveis"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={cardClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">Alunos recentes</h3>
            <Link
              to="/demo/students"
              className="text-sm font-semibold text-primary"
            >
              Ver alunos
            </Link>
          </div>

          <div className="grid gap-3">
            {students.slice(0, 4).map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 border-b border-border-default pb-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-xs text-text-secondary">{student.goal}</p>
                </div>
                <StatusBadge positive={student.status === "ACTIVE"}>
                  {student.status === "ACTIVE" ? "Ativo" : "Inativo"}
                </StatusBadge>
              </div>
            ))}
          </div>
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">Treinos em destaque</h3>
            <Link
              to="/demo/workouts"
              className="text-sm font-semibold text-primary"
            >
              Ver treinos
            </Link>
          </div>

          <div className="grid gap-3">
            {workouts.slice(0, 4).map((workout) => (
              <div
                key={workout.id}
                className="border-b border-border-default pb-3 last:border-0"
              >
                <p className="font-semibold">{workout.name}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {workout.student} · {workout.level}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <h3 className="text-lg font-bold">Catálogo público de exercícios</h3>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          Explore exercícios reais disponibilizados pela API pública. As demais
          informações desta demonstração são fictícias.
        </p>
        <Link
          to="/demo/exercises"
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold !text-white no-underline hover:bg-primary-hover"
        >
          Explorar catálogo
        </Link>
      </section>
    </div>
  );
}

function StudentsDemo() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch = [student.name, student.goal, student.level]
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR"));

        return matchesSearch && (status === "ALL" || student.status === status);
      }),
    [search, status],
  );

  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Gestão de alunos"
        description="Pesquise, filtre e abra a ficha demonstrativa de cada aluno."
      />

      <section className={cardClass}>
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">Pesquisar aluno</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nome, objetivo ou nível..."
              className={inputClass}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">Situação</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </label>
        </div>

        <p aria-live="polite" className="mt-4 text-sm text-text-secondary">
          {filtered.length} alunos encontrados
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((student) => (
          <article key={student.id} className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {student.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>

              <StatusBadge positive={student.status === "ACTIVE"}>
                {student.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </StatusBadge>
            </div>

            <h3 className="mt-4 text-lg font-bold">{student.name}</h3>
            <p className="mt-1 text-sm text-text-secondary">{student.goal}</p>

            <div className="mt-5 grid gap-2 border-t border-border-default pt-4 text-sm">
              <p>
                <strong>Nível:</strong> {student.level}
              </p>
              <p>
                <strong>Treinos cadastrados:</strong> {student.workouts}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelected(student)}
              className={`${buttonClass} mt-5 w-full`}
            >
              Visualizar aluno
            </button>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className={`${cardClass} text-sm text-text-secondary`}>
          Nenhum aluno encontrado com esses filtros.
        </p>
      )}

      <DemoModal
        open={selected !== null}
        title={selected?.name ?? "Ficha do aluno"}
        description="Ficha demonstrativa — dados fictícios"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="grid gap-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary">
                Informações gerais
              </span>
              <StatusBadge positive={selected.status === "ACTIVE"}>
                {selected.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </StatusBadge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Nome" value={selected.name} />
              <Detail label="Objetivo" value={selected.goal} />
              <Detail label="Nível" value={selected.level} />
              <Detail label="Treinos cadastrados" value={selected.workouts} />
            </div>

            <p className="text-xs leading-5 text-text-secondary">
              Esta ficha é apenas uma representação visual e não contém
              informações pessoais de alunos reais.
            </p>
          </div>
        )}
      </DemoModal>
    </div>
  );
}

function WorkoutsDemo() {
  const [level, setLevel] = useState("ALL");
  const [selected, setSelected] = useState<Workout | null>(null);

  const filtered = workouts.filter(
    (workout) => level === "ALL" || workout.level === level,
  );

  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Gestão de treinos"
        description="Explore fichas demonstrativas e seus exercícios prescritos."
      />

      <section className={cardClass}>
        <label className="grid max-w-xs gap-2">
          <span className="text-sm font-semibold">Filtrar por nível</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className={inputClass}
          >
            <option value="ALL">Todos os níveis</option>
            <option value="Iniciante">Iniciante</option>
            <option value="Intermediário">Intermediário</option>
            <option value="Avançado">Avançado</option>
          </select>
        </label>

        <p aria-live="polite" className="mt-4 text-sm text-text-secondary">
          {filtered.length} treinos encontrados
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((workout) => (
          <article key={workout.id} className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-lg font-bold">{workout.name}</h3>
              <StatusBadge>{workout.level}</StatusBadge>
            </div>

            <p className="mt-3 text-sm text-text-secondary">
              Aluno: {workout.student}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Foco: {workout.focus}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {workout.exercises.length} exercícios
            </p>

            <button
              type="button"
              onClick={() => setSelected(workout)}
              className={`${buttonClass} mt-5 w-full`}
            >
              Visualizar ficha
            </button>
          </article>
        ))}
      </div>

      <DemoModal
        open={selected !== null}
        title={selected?.name ?? "Ficha de treino"}
        description="Prescrição demonstrativa — dados fictícios"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Aluno" value={selected.student} />
              <Detail label="Nível" value={selected.level} />
              <Detail label="Foco" value={selected.focus} />
              <Detail
                label="Quantidade de exercícios"
                value={selected.exercises.length}
              />
            </div>

            <div>
              <h3 className="mb-3 text-base font-bold">
                Exercícios prescritos
              </h3>

              <ol className="grid list-decimal gap-3 pl-5 text-sm leading-6 text-text-secondary">
                {selected.exercises.map((exercise) => (
                  <li key={exercise}>{exercise}</li>
                ))}
              </ol>
            </div>

            <p className="text-xs text-text-secondary">
              Exemplo ilustrativo, não é uma prescrição individualizada.
            </p>
          </div>
        )}
      </DemoModal>
    </div>
  );
}

function AdminExercisesDemo() {
  const steps = [
    {
      title: "Cadastro",
      description: "Organização de exercícios-base e suas variações.",
    },
    {
      title: "Revisão",
      description: "Conferência das informações e materiais editoriais.",
    },
    {
      title: "Publicação",
      description: "Disponibilização de conteúdo aprovado.",
    },
  ];

  const [selectedStep, setSelectedStep] = useState<
    (typeof steps)[number] | null
  >(null);

  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Administração de exercícios"
        description="Conheça o fluxo demonstrativo de gerenciamento editorial."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Exercícios-base"
          value={142}
          detail="Valor ilustrativo"
        />
        <StatCard label="Variações" value={249} detail="Valor ilustrativo" />
        <StatCard
          label="Etapas editoriais"
          value={steps.length}
          detail="Fluxo demonstrativo"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className={cardClass}>
            <span className="text-xs font-bold text-primary">
              ETAPA {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {step.description}
            </p>
            <button
              type="button"
              onClick={() => setSelectedStep(step)}
              className={`${buttonClass} mt-5 w-full`}
            >
              Ver etapa
            </button>
          </article>
        ))}
      </div>

      <section className={cardClass}>
        <p className="text-sm leading-6 text-text-secondary">
          A demonstração não permite criar, editar, excluir ou publicar
          registros reais.
        </p>
        <Link
          to="/demo/exercises"
          className="mt-4 inline-flex text-sm font-bold text-primary"
        >
          Explorar catálogo público
        </Link>
      </section>

      <DemoModal
        open={selectedStep !== null}
        title={selectedStep?.title ?? "Etapa editorial"}
        description="Fluxo administrativo demonstrativo"
        onClose={() => setSelectedStep(null)}
      >
        <p className="text-sm leading-7 text-text-secondary">
          {selectedStep?.description}
        </p>
        <p className="mt-4 text-xs text-text-secondary">
          Nenhuma operação administrativa é executada nesta demonstração.
        </p>
      </DemoModal>
    </div>
  );
}

function AdminImagesDemo() {
  const [selected, setSelected] = useState<EditorialItem | null>(null);

  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Revisão de imagens"
        description="Acompanhe exemplos fictícios de estados editoriais."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Itens de exemplo"
          value={editorialItems.length}
          detail="Dados fictícios"
        />
        <StatCard
          label="Aguardando revisão"
          value={
            editorialItems.filter(
              (item) => item.status === "Aguardando revisão",
            ).length
          }
          detail="Fluxo simulado"
        />
        <StatCard
          label="Aprovados"
          value={
            editorialItems.filter((item) => item.status === "Aprovado").length
          }
          detail="Fluxo simulado"
        />
      </div>

      <section className={cardClass}>
        <div className="grid gap-3">
          {editorialItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-page p-4"
            >
              <div>
                <h3 className="text-sm font-bold">{item.name}</h3>
                <p className="mt-1 text-xs text-text-secondary">
                  Grupo: {item.group}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge positive={item.status === "Aprovado"}>
                  {item.status}
                </StatusBadge>

                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className={buttonClass}
                >
                  Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <DemoModal
        open={selected !== null}
        title={selected?.name ?? "Revisão editorial"}
        description="Exemplo de revisão — dados fictícios"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Exercício" value={selected.name} />
              <Detail label="Grupo muscular" value={selected.group} />
              <Detail label="Situação editorial" value={selected.status} />
            </div>

            <div className="rounded-xl border border-border-default bg-page p-5 text-center text-sm text-text-secondary">
              Prévia de imagem não disponível nesta simulação.
            </div>

            <p className="text-xs text-text-secondary">
              O status exibido não corresponde a registros reais. Aprovações e
              rejeições não estão disponíveis aqui.
            </p>
          </div>
        )}
      </DemoModal>
    </div>
  );
}

function AdminOrganizationsDemo() {
  const [selected, setSelected] = useState<Organization | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  const teacherCount = organizations.reduce(
    (total, organization) => total + organization.teachers.length,
    0,
  );

  return (
    <div className="grid gap-5">
      <SectionHeader
        title="Gestão de empresas"
        description="Explore organizações e professores fictícios."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Organizações"
          value={organizations.length}
          detail="Dados fictícios"
        />
        <StatCard
          label="Professores"
          value={teacherCount}
          detail="Integrantes de exemplo"
        />
        <StatCard
          label="Organizações ativas"
          value={organizations.length}
          detail="Situação simulada"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {organizations.map((organization) => (
          <article key={organization.id} className={cardClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                {organization.name.charAt(0)}
              </span>
              <StatusBadge positive>{organization.status}</StatusBadge>
            </div>

            <h3 className="text-lg font-bold">{organization.name}</h3>
            <p className="mt-2 text-sm text-text-secondary">
              {organization.type}
            </p>
            <p className="mt-4 text-sm text-text-secondary">
              {organization.teachers.length} professores de exemplo
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedTeacher(null);
                setSelected(organization);
              }}
              className={`${buttonClass} mt-5 w-full`}
            >
              Visualizar empresa
            </button>
          </article>
        ))}
      </div>

      <DemoModal
        open={selected !== null}
        title={selected?.name ?? "Empresa"}
        description="Organização demonstrativa — dados fictícios"
        onClose={() => {
          setSelected(null);
          setSelectedTeacher(null);
        }}
      >
        {selected && (
          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Nome da organização" value={selected.name} />
              <Detail label="Tipo" value={selected.type} />
              <Detail label="Situação" value={selected.status} />
              <Detail label="Professores" value={selected.teachers.length} />
            </div>

            <div className="grid gap-3">
              <h3 className="font-bold">Professores vinculados</h3>

              {selected.teachers.map((teacher) => (
                <button
                  key={teacher}
                  type="button"
                  onClick={() =>
                    setSelectedTeacher(
                      selectedTeacher === teacher ? null : teacher,
                    )
                  }
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-page p-4 text-left text-sm transition-colors hover:border-primary"
                >
                  <span className="font-semibold">{teacher}</span>
                  <span className="text-xs text-primary">
                    {selectedTeacher === teacher ? "Ocultar" : "Ver perfil"}
                  </span>
                </button>
              ))}
            </div>

            {selectedTeacher && (
              <section className="grid gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <h4 className="font-bold">Perfil do professor</h4>
                <Detail label="Nome" value={selectedTeacher} />
                <Detail label="Função" value="Professor / Treinador" />
                <Detail label="Organização" value={selected.name} />
                <p className="text-xs text-text-secondary">
                  Perfil ilustrativo, sem informações profissionais verificadas.
                </p>
              </section>
            )}
          </div>
        )}
      </DemoModal>
    </div>
  );
}

export function PublicDemo() {
  const { pathname } = useLocation();

  const titles: Record<string, string> = {
    "/demo": "Dashboard",
    "/demo/students": "Alunos",
    "/demo/workouts": "Treinos",
    "/demo/admin/exercises": "Administração de exercícios",
    "/demo/admin/images": "Revisão de imagens",
    "/demo/admin/organizations": "Empresas",
  };

  function renderPage() {
    switch (pathname) {
      case "/demo":
        return <DashboardDemo />;
      case "/demo/students":
        return <StudentsDemo />;
      case "/demo/workouts":
        return <WorkoutsDemo />;
      case "/demo/admin/exercises":
        return <AdminExercisesDemo />;
      case "/demo/admin/images":
        return <AdminImagesDemo />;
      case "/demo/admin/organizations":
        return <AdminOrganizationsDemo />;
      default:
        return <DashboardDemo />;
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6">
      <header className="grid gap-4 rounded-2xl border border-border-default bg-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge positive>Modo demonstração</StatusBadge>
          <StatusBadge>Dados fictícios</StatusBadge>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              {titles[pathname] ?? "Demonstração"}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-text-secondary">
              Explore uma simulação interativa do Personal Trainer Manager.
              Nenhuma ação nesta área altera informações reais.
            </p>
          </div>

          <Link
            to="/login"
            className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold !text-white no-underline hover:bg-primary-hover"
          >
            Acessar área profissional
          </Link>
        </div>
      </header>

      {renderPage()}

      <footer className="rounded-xl border border-border-default bg-surface p-4 text-xs leading-6 text-text-secondary">
        <strong>Sobre esta demonstração:</strong> os dados de alunos, treinos,
        empresas, professores e revisão editorial são fictícios. O catálogo
        público consulta a API real e exibe somente conteúdo disponibilizado
        para acesso público. Operações administrativas exigem autenticação e
        permissões apropriadas.
      </footer>
    </div>
  );
}
