export type RoleName = 'seller' | 'manager' | 'admin' | '';

export function buildDealsFilter(params: URLSearchParams, auth: { role?: RoleName; adminId?: string; team?: string } = {}) {
  const filter: Record<string, any> = {};
  const q = params.get('q') || '';
  const stageId = params.get('stageId') || undefined;
  const ownerIdParam = params.get('ownerId') || undefined;
  const teamParam = params.get('team') || undefined;
  const status = params.get('status') || undefined;

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { customerName: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ];
  }
  if (stageId) filter.stageId = stageId;
  if (status) filter.status = status;

  const role = (auth.role || '').toLowerCase() as RoleName;
  const userTeam = auth.team;

  if (role === 'seller') {
    filter.ownerId = auth.adminId;
    if (userTeam) filter.team = userTeam;
  } else if (role === 'manager') {
    if (userTeam) filter.team = userTeam;
    if (ownerIdParam) filter.ownerId = ownerIdParam;
  } else {
    if (ownerIdParam) filter.ownerId = ownerIdParam;
    if (teamParam) filter.team = teamParam;
  }

  return filter;
}


