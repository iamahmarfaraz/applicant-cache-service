

const teamCache = new Map();

/**
 * managerUserId -> {
 *   users: Set<userId>,
 *   lastSyncedAt: number
 * }
 */

function bulkLoadTeams(teamMap) {
  for (const [managerUserId, userIds] of teamMap.entries()) {
    teamCache.set(managerUserId, {
      users: new Set(userIds),
      lastSyncedAt: Date.now()
    });
  }
}

function getTeam(managerUserId) {
  return teamCache.get(managerUserId);
}

function hasTeam(managerUserId) {
  return teamCache.has(managerUserId);
}

module.exports = {
  bulkLoadTeams,
  getTeam,
  hasTeam
};