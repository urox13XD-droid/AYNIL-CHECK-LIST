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

export function loadRoles(defaults: string[]): string[] {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(ROLES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : defaults;
  } catch {
    return defaults;
  }
}

export function saveRoles(roles: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}
