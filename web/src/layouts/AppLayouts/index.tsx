import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import {
  api,
  getActiveOrganizationId,
  setActiveOrganizationId,
} from "../../lib/api";

type ManagedOrganization = {
  id: string;
  role: "OWNER" | "ADMIN" | "TRAINER";
  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

type OrganizationResult = {
  userId: string;
  organizations: ManagedOrganization[];
};

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [organizationResult, setOrganizationResult] =
    useState<OrganizationResult | null>(null);

  const [activeOrganizationId, setActiveOrganizationIdState] = useState<
    string | null
  >(getActiveOrganizationId);

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { preference, resolvedTheme, setPreference } = useTheme();

  const isDark = resolvedTheme === "dark";
  const userId = user?.id;
  const isPlatformAdmin = user?.isPlatformAdmin;

  useEffect(() => {
    if (!userId || isPlatformAdmin) {
      return;
    }

    let active = true;

    api
      .get<ManagedOrganization[]>("/organizations/mine")
      .then(({ data }) => {
        if (!active) return;

        setOrganizationResult({
          userId,
          organizations: data,
        });
      })
      .catch(() => {
        if (!active) return;

        setOrganizationResult({
          userId,
          organizations: [],
        });
      });

    return () => {
      active = false;
    };
  }, [userId, isPlatformAdmin]);

  const managedOrganizations =
    userId && !isPlatformAdmin && organizationResult?.userId === userId
      ? organizationResult.organizations
      : [];

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleSelectOrganization(organizationId: string) {
    setActiveOrganizationId(organizationId);
    setActiveOrganizationIdState(organizationId);

    closeMenu();
    navigate("/", { replace: true });

    // Atualiza Dashboard e páginas que carregam dados no mount.
    window.location.reload();
  }

  function handleLogout() {
    closeMenu();
    setActiveOrganizationId(null);
    setActiveOrganizationIdState(null);
    signOut();
    navigate("/login", { replace: true });
  }

  const themeOptions = [
    { value: "light", label: "Claro", icon: "☀" },
    { value: "dark", label: "Escuro", icon: "☾" },
    { value: "system", label: "Sistema", icon: "▣" },
  ] as const;

  const sidebarClassName = isDark
    ? "bg-gray-900 text-white"
    : "bg-white text-gray-900 border-r border-gray-200";

  const navigationBaseClassName =
    "block rounded-lg px-4 py-3 no-underline transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500";

  const getNavigationClassName = ({ isActive }: { isActive: boolean }) =>
    [
      navigationBaseClassName,
      isActive
        ? "!bg-green-600 !text-white font-semibold shadow-sm"
        : isDark
          ? "!text-gray-300 hover:!bg-gray-800 hover:!text-white"
          : "!text-gray-700 hover:!bg-gray-100 hover:!text-gray-900",
    ].join(" ");

  const mutedTextClassName = isDark ? "!text-gray-400" : "!text-gray-500";

  const dividerClassName = isDark ? "border-gray-700" : "border-gray-200";

  const themeContainerClassName = isDark ? "bg-gray-800" : "bg-gray-100";

  const themeButtonClassName = isDark
    ? "!bg-transparent !text-gray-400 hover:!bg-gray-700 hover:!text-white"
    : "!bg-transparent !text-gray-600 hover:!bg-gray-200 hover:!text-gray-900";

  const logoutButtonClassName = isDark
    ? "border-gray-700 !text-red-300 hover:!bg-gray-800"
    : "border-gray-200 !text-red-700 hover:!bg-red-50";

  return (
    <div className="flex min-h-screen min-w-0 flex-col md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
      <aside
        className={[
          "w-full min-w-0 shrink-0 self-start",
          "px-4 py-4 md:px-6 md:py-8",
          "md:sticky md:top-0 md:h-screen md:overflow-y-auto",
          "transition-colors duration-200",
          sidebarClassName,
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3 md:block">
          <strong className="flex flex-col text-xl md:mb-12">
            Personal Trainer
            <span className={`text-sm font-normal ${mutedTextClassName}`}>
              Manager
            </span>
          </strong>

          <button
            type="button"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((current) => !current)}
            className={[
              "flex h-11 w-11 shrink-0 items-center justify-center",
              "rounded-lg border transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-green-500 md:hidden",
              isDark
                ? "border-gray-600 !bg-gray-800 !text-white hover:!bg-gray-700"
                : "border-gray-300 !bg-gray-100 !text-gray-900 hover:!bg-gray-200",
            ].join(" ")}
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              {menuOpen ? "×" : "☰"}
            </span>
          </button>
        </div>

        <div
          className={`${menuOpen ? "block" : "hidden"} mt-4 md:mt-0 md:block`}
        >
          <nav
            id="main-navigation"
            aria-label="Navegação principal"
            className="flex flex-col gap-2"
          >
            <NavLink
              to="/"
              end
              className={getNavigationClassName}
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/students"
              className={getNavigationClassName}
              onClick={closeMenu}
            >
              Alunos
            </NavLink>

            <NavLink
              to="/exercises"
              className={getNavigationClassName}
              onClick={closeMenu}
            >
              Exercícios
            </NavLink>

            <NavLink
              to="/workouts"
              className={getNavigationClassName}
              onClick={closeMenu}
            >
              Treinos
            </NavLink>

            {managedOrganizations.length > 0 && (
              <>
                <div className={`mt-4 border-t pt-4 ${dividerClassName}`}>
                  <p
                    className={`mb-2 px-4 text-xs font-semibold tracking-wider ${mutedTextClassName}`}
                  >
                    MINHAS EMPRESAS
                  </p>
                </div>

                {managedOrganizations.map((membership) => {
                  const organization = membership.organization;
                  const selected = activeOrganizationId === organization.id;

                  return (
                    <div
                      key={membership.id}
                      className={[
                        "rounded-lg border p-2",
                        selected
                          ? isDark
                            ? "border-green-500 bg-green-950/30"
                            : "border-green-500 bg-green-50"
                          : isDark
                            ? "border-gray-700"
                            : "border-gray-200",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleSelectOrganization(organization.id)
                        }
                        aria-pressed={selected}
                        className={[
                          "w-full rounded-md px-2 py-2 text-left",
                          "transition-colors duration-200",
                          "focus-visible:outline-2 focus-visible:outline-green-500",
                          selected
                            ? isDark
                              ? "!text-green-300"
                              : "!text-green-800"
                            : isDark
                              ? "!text-gray-200 hover:!bg-gray-800"
                              : "!text-gray-800 hover:!bg-gray-100",
                        ].join(" ")}
                      >
                        <span className="block break-words font-semibold">
                          {organization.name}
                        </span>

                        <span className="mt-1 block text-xs opacity-75">
                          {membership.role === "OWNER"
                            ? "Proprietário"
                            : membership.role === "ADMIN"
                              ? "Administrador"
                              : "Treinador"}
                        </span>

                        {selected && (
                          <span className="mt-2 block text-xs font-semibold">
                            ✓ Empresa selecionada
                          </span>
                        )}
                      </button>

                      <NavLink
                        to={`/organizations/${organization.id}`}
                        onClick={closeMenu}
                        className={[
                          "mt-1 block rounded-md px-2 py-2 text-xs",
                          "font-medium no-underline transition-colors",
                          isDark
                            ? "!text-gray-300 hover:!bg-gray-800"
                            : "!text-gray-600 hover:!bg-gray-100",
                        ].join(" ")}
                      >
                        Gerenciar empresa
                      </NavLink>
                    </div>
                  );
                })}
              </>
            )}

            {user?.isPlatformAdmin && (
              <>
                <div className={`mt-4 border-t pt-4 ${dividerClassName}`}>
                  <p
                    className={`mb-2 px-4 text-xs font-semibold tracking-wider ${mutedTextClassName}`}
                  >
                    ADMINISTRAÇÃO
                  </p>
                </div>

                <NavLink
                  to="/admin/exercises"
                  className={getNavigationClassName}
                  onClick={closeMenu}
                >
                  Administração
                </NavLink>

                <NavLink
                  to="/admin/images"
                  className={getNavigationClassName}
                  onClick={closeMenu}
                >
                  Imagens dos Exercícios
                </NavLink>

                <NavLink
                  to="/admin/organizations"
                  className={getNavigationClassName}
                  onClick={closeMenu}
                >
                  Empresas
                </NavLink>
              </>
            )}
          </nav>

          <div className={`mt-8 border-t pt-6 ${dividerClassName}`}>
            <p
              className={`mb-3 text-xs font-semibold tracking-wider ${mutedTextClassName}`}
            >
              APARÊNCIA
            </p>

            <div
              role="group"
              aria-label="Selecionar aparência"
              className={`grid grid-cols-3 gap-1 rounded-lg p-1 ${themeContainerClassName}`}
            >
              {themeOptions.map((option) => {
                const selected = preference === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPreference(option.value)}
                    className={[
                      "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1",
                      "rounded-md border-0 px-1 py-2 text-xs",
                      "transition-all duration-200 ease-in-out",
                      "focus-visible:outline-2 focus-visible:outline-offset-2",
                      "focus-visible:outline-green-500",
                      selected
                        ? "!bg-green-600 !text-white shadow-md ring-1 ring-green-400"
                        : themeButtonClassName,
                    ].join(" ")}
                  >
                    <span aria-hidden="true" className="text-lg leading-none">
                      {option.icon}
                    </span>

                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`mt-8 border-t pt-6 ${dividerClassName}`}>
            <p
              className={`mb-3 text-xs font-semibold tracking-wider ${mutedTextClassName}`}
            >
              MINHA CONTA
            </p>

            {user && (
              <div className="mb-4 min-w-0 rounded-lg border border-border-default p-3">
                <p className="break-words text-sm font-semibold">{user.name}</p>

                <p
                  className={`mt-2 w-full min-w-0 break-all text-[10px] leading-relaxed ${mutedTextClassName}`}
                  title={user.email}
                >
                  {user.email}
                </p>

                <div
                  className={[
                    "mt-4 flex w-full min-w-0 items-center justify-center gap-2",
                    "border-t pt-3 text-center",
                    "text-[11px] font-medium",
                    isDark
                      ? "border-gray-700 text-emerald-400"
                      : "border-gray-200 text-emerald-700",
                  ].join(" ")}
                >
                  <span aria-hidden="true" className="shrink-0 text-[9px]">
                    ●
                  </span>

                  <span className="min-w-0 break-words leading-relaxed">
                    {user.isPlatformAdmin
                      ? "Administrador da plataforma"
                      : "Usuário"}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className={[
                "flex min-h-11 w-full items-center justify-center gap-2",
                "rounded-lg border px-4 py-3",
                "text-sm font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-red-500",
                logoutButtonClassName,
              ].join(" ")}
            >
              <span aria-hidden="true">↪</span>
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-page px-4 py-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
