const { getTeam, setTeam, hasTeam } = require("../cache/teamCache");
const { fetchTeamMembers } = require("../services/team.service");

async function teamMiddleware(req, res, next) {
  const { userId } = req.auth;
  const requestedUserIds =
  req.body?.userList ||
  req.query?.userList ||
  [];

  let team;

  if (hasTeam(userId)) {
    team = getTeam(userId);
  } else {
    const members = await fetchTeamMembers(userId);
    setTeam(userId, members);
    team = getTeam(userId);
  }

  // Always allow self
  team.users.add(userId);


  if (requestedUserIds.length === 0) {
    req.allowedUserIds = Array.from(team.users);
    return next();
  }

  // Validate requested users
  for (const uid of requestedUserIds) {
    if (!team.users.has(uid)) {
      return res.status(403).json({
        message: "Unauthorized user scope"
      });
    }
  }

  req.allowedUserIds = requestedUserIds;
  next();
}

module.exports = teamMiddleware;