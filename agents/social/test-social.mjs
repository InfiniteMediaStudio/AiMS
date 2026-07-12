import assert from "node:assert/strict";
import { createCalendarItem, evaluateCaption, transitionPost } from "./social-agent.mjs";

const item = createCalendarItem({
  id: "social_test",
  clientId: "client_1",
  campaignId: "campaign_1",
  platform: "LinkedIn",
  objective: "Generate qualified discovery calls",
  contentPillar: "Practical AI operations",
  format: "single image",
  caption: "Ready to simplify agency operations? Learn how a clear workflow helps your team save time. Book a discovery call.",
  scheduledFor: "2026-07-15T09:00:00+05:00",
  timezone: "Asia/Karachi",
});

assert.equal(item.status, "draft");
assert.equal(item.approval.required, true);
assert.equal(item.platform, "linkedin");

const review = transitionPost(item, "internal_review");
const approval = transitionPost(review, "approval_required");
assert.throws(() => transitionPost(approval, "scheduled"), /Invalid social post transition/);

const approved = transitionPost(approval, "approved", { approvedBy: "owner@example.com" });
const scheduled = transitionPost(approved, "scheduled");
const published = transitionPost(scheduled, "published");
assert.equal(published.status, "published");
assert.equal(published.approval.approvedBy, "owner@example.com");

assert.throws(() => createCalendarItem({ platform: "unknown" }), /Unsupported social platform/);
assert.equal(evaluateCaption(item.caption).readyForReview, true);
assert.equal(evaluateCaption("Buy now! Guaranteed instant results.").readyForReview, false);

console.log("social agent tests passed");

