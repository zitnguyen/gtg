const fanoutService = require("../services/notificationFanoutService");
const userTargetRepository = require("../repositories/userTargetRepository");

const ensureRecipients = async ({ recipients, roles, userIds }) => {
  if (Array.isArray(recipients) && recipients.length > 0) return recipients;
  if (Array.isArray(roles) && roles.length > 0) {
    return userTargetRepository.findUsersByFilter({
      role: { $in: roles },
      ...(Array.isArray(userIds) && userIds.length > 0
        ? { _id: { $in: userIds } }
        : {}),
    });
  }
  if (Array.isArray(userIds) && userIds.length > 0) {
    return userTargetRepository.findUsersByFilter({ _id: { $in: userIds } });
  }
  return [];
};

const notifyUsers = async ({
  recipients,
  roles,
  userIds,
  title,
  content,
  targetPath = "",
  createdBy,
  type = "SYSTEM_NOTIFICATION",
  dedupe = true,
}) => {
  const targetRecipients = await ensureRecipients({ recipients, roles, userIds });
  if (!targetRecipients.length) {
    return { notification: null, recipientsCount: 0, skipped: false };
  }
  return fanoutService.fanoutToUsers({
    title,
    content,
    targetPath,
    createdBy: createdBy || targetRecipients[0]._id,
    recipients: targetRecipients,
    type,
    dedupe,
  });
};

const notifyAdmins = async (payload) =>
  notifyUsers({ ...payload, roles: ["Admin"] });

const notifyParents = async (payload) =>
  notifyUsers({ ...payload, roles: ["Parent"] });

module.exports = {
  notifyUsers,
  notifyAdmins,
  notifyParents,
};
