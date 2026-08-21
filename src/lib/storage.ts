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

/** quick-pick swatches offered in the role color picker (an 8th, custom slot opens a native picker), also cycled through for new roles' default color — pale and spread across distinct hues so adjacent ones don't blend together */
export const ROLE_COLOR_PALETTE = [
  "#ffd5d2",
  "#fedec8",
  "#f8e6a0",
  "#baf3db",
  "#c6edfb",
  "#cce0ff",
  "#dfd8fd",
];

export function defaultRoles(names: string[]): Role[] {
  return names.map((name, i) => ({ name, color: ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length] }));
}

/** earlier palettes this replaced — colors auto-assigned from any of them are remapped to the current one at the same index, so already-saved roles pick up each new look too */
const LEGACY_PALETTES = [
  ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#a855f7"],
  ["#f4a6a0", "#f5c396", "#f0e08a", "#a8d8a2", "#8fd4c1", "#a8c8f0", "#c9a8e0"],
];

function migrateLegacyColor(color: string): string {
  for (const palette of LEGACY_PALETTES) {
    const idx = palette.indexOf(color);
    if (idx !== -1) return ROLE_COLOR_PALETTE[idx % ROLE_COLOR_PALETTE.length];
  }
  return color;
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

/**
 * Accepts both the current Role[] shape and the legacy plain string[] shape, so existing
 * localStorage keeps working. Default roles always come back in their canonical order (healing
 * back in any that went missing from a previously saved list, from before role deletion was
 * disabled — otherwise every checklist item still pointing at that role name would show as
 * unassigned); any role the user added beyond the defaults follows, in the order it was added.
 */
export function loadRoles(defaultNames: string[]): Role[] {
  if (typeof window === "undefined") return defaultRoles(defaultNames);
  try {
    const raw = window.localStorage.getItem(ROLES_KEY);
    if (!raw) return defaultRoles(defaultNames);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultRoles(defaultNames);
    const loaded: Role[] = parsed.map((r, i) =>
      typeof r === "string"
        ? { name: r, color: ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length] }
        : {
            name: (r as Role).name,
            color: migrateLegacyColor((r as Role).color) || ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length],
            assigneeName: (r as Role).assigneeName,
          }
    );
    const byName = new Map(loaded.map((r) => [r.name, r]));
    const orderedDefaults = defaultNames.map(
      (name, i): Role => byName.get(name) ?? { name, color: ROLE_COLOR_PALETTE[i % ROLE_COLOR_PALETTE.length] }
    );
    const customRoles = loaded.filter((r) => !defaultNames.includes(r.name));
    return [...orderedDefaults, ...customRoles];
  } catch {
    return defaultRoles(defaultNames);
  }
}

export function saveRoles(roles: Role[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}
