export interface ChecklistItemState {
  id: string;
  label: string;
  checked: boolean;
  role: string;
  comment?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  quantity: number;
  items: ChecklistItemState[];
  /** manually toggled, and set automatically the moment every item becomes checked */
  collapsed?: boolean;
}

export interface ChecklistProject {
  id: string;
  name: string;
  rawText: string;
  sections: ChecklistSection[];
  updatedAt: number;
}

/** a checklist role/poste — `name` is its stable identity (matched against ChecklistItemState.role), `assigneeName` is a display override (e.g. a person's name) */
export interface Role {
  name: string;
  color: string;
  assigneeName?: string;
}

export const ROLE_COLOR_PALETTE = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
  "#6366f1",
  "#84cc16",
];

export function defaultRoles(names: string[]): Role[] {
  return names.map((name, i) => ({ name, color: ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length] }));
}

const CURRENT_KEY = "aynil-checklist:current";
const PROJECTS_KEY = "aynil-checklist:projects";
const ROLES_KEY = "aynil-checklist:roles";

export function loadCurrent(): ChecklistProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as ChecklistProject) : null;
  } catch {
    return null;
  }
}

export function saveCurrent(project: ChecklistProject) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_KEY, JSON.stringify(project));
}

export function listProjects(): ChecklistProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as ChecklistProject[]) : [];
  } catch {
    return [];
  }
}

export function upsertProject(project: ChecklistProject) {
  const projects = listProjects().filter((p) => p.id !== project.id);
  projects.unshift(project);
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 30)));
}

export function deleteProject(id: string) {
  const projects = listProjects().filter((p) => p.id !== id);
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function newProjectId(): string {
  return `chk_${Math.random().toString(36).slice(2, 10)}`;
}

/** accepts both the current Role[] shape and the legacy plain string[] shape, so existing localStorage keeps working */
export function loadRoles(defaultNames: string[]): Role[] {
  if (typeof window === "undefined") return defaultRoles(defaultNames);
  try {
    const raw = window.localStorage.getItem(ROLES_KEY);
    if (!raw) return defaultRoles(defaultNames);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultRoles(defaultNames);
    return parsed.map((r, i) =>
      typeof r === "string"
        ? { name: r, color: ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length] }
        : {
            name: (r as Role).name,
            color: (r as Role).color || ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length],
            assigneeName: (r as Role).assigneeName,
          }
    );
  } catch {
    return defaultRoles(defaultNames);
  }
}

export function saveRoles(roles: Role[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}
