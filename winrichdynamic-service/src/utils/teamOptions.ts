export interface AdminTeamSource {
  team?: string | null;
}

export const deriveTeamOptions = (admins: AdminTeamSource[]) => {
  const unique = new Set<string>();
  for (const admin of admins) {
    const team = typeof admin.team === "string" ? admin.team.trim() : "";
    if (team) {
      unique.add(team);
    }
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b, "th-TH"));
};
