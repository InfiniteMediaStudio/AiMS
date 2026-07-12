const PLATFORMS = new Set(["instagram", "facebook", "linkedin", "tiktok", "x", "youtube"]);

export const POST_STATUS_FLOW = Object.freeze({
  draft: ["internal_review", "archived"],
  internal_review: ["draft", "approval_required", "archived"],
  approval_required: ["draft", "approved", "rejected"],
  rejected: ["draft", "archived"],
  approved: ["scheduled", "archived"],
  scheduled: ["approved", "published"],
  published: ["archived"],
  archived: [],
});

export function createCalendarItem(input) {
  const platform = requiredText(input.platform, "platform").toLowerCase();
  if (!PLATFORMS.has(platform)) throw new Error(`Unsupported social platform: ${platform}`);

  const scheduledFor = input.scheduledFor ? new Date(input.scheduledFor) : null;
  if (scheduledFor && Number.isNaN(scheduledFor.getTime())) throw new Error("scheduledFor must be a valid date.");

  return {
    id: input.id ?? `social_${crypto.randomUUID()}`,
    clientId: requiredText(input.clientId, "clientId"),
    campaignId: input.campaignId?.trim() || null,
    platform,
    objective: requiredText(input.objective, "objective"),
    contentPillar: requiredText(input.contentPillar, "contentPillar"),
    format: requiredText(input.format, "format"),
    caption: requiredText(input.caption, "caption"),
    assetRefs: Array.isArray(input.assetRefs) ? input.assetRefs.filter(Boolean) : [],
    scheduledFor: scheduledFor?.toISOString() ?? null,
    timezone: input.timezone?.trim() || "UTC",
    status: "draft",
    approval: { required: true, approvedBy: null, approvedAt: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function transitionPost(item, nextStatus, options = {}) {
  const allowed = POST_STATUS_FLOW[item.status];
  if (!allowed) throw new Error(`Unknown current post status: ${item.status}`);
  if (!allowed.includes(nextStatus)) throw new Error(`Invalid social post transition: ${item.status} -> ${nextStatus}`);

  const next = structuredClone(item);
  next.status = nextStatus;
  next.updatedAt = new Date().toISOString();

  if (nextStatus === "approved") {
    const approvedBy = requiredText(options.approvedBy, "approvedBy");
    next.approval = { required: true, approvedBy, approvedAt: new Date().toISOString() };
  }

  if (["scheduled", "published"].includes(nextStatus) && !next.approval?.approvedBy) {
    throw new Error("A social post cannot be scheduled or published without recorded human approval.");
  }

  if (nextStatus === "scheduled" && !next.scheduledFor) throw new Error("A scheduled post requires scheduledFor.");
  return next;
}

export function evaluateCaption(caption, options = {}) {
  const text = requiredText(caption, "caption");
  const lower = text.toLowerCase();
  const checks = {
    hook: /[?!:]|\b(how|why|discover|meet|stop|start|ready)\b/i.test(text.slice(0, 100)),
    value: /\b(help|learn|save|improve|build|grow|because|so you can)\b/i.test(lower),
    callToAction: /\b(comment|share|save|follow|visit|book|learn more|message|dm|reply)\b/i.test(lower),
    readable: text.length >= 40 && text.length <= (options.maxLength ?? 2200),
    brandSafe: !/\b(guaranteed|risk[- ]free|instant results|best ever)\b/i.test(lower),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { score: passed * 20, passed, total: 5, checks, readyForReview: passed >= 4 };
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`);
  return value.trim();
}

