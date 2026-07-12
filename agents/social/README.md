# Social Agent MVP foundation

This API-free module defines the safe data and approval contracts for Social work before any publishing tool is connected.

## Content calendar item

`createCalendarItem` normalizes client, campaign, platform, objective, pillar, format, caption, asset, schedule, timezone, and approval fields. New content always starts as `draft` and always requires human approval.

## Post lifecycle

The enforced flow is:

`draft -> internal_review -> approval_required -> approved -> scheduled -> published -> archived`

Rejection returns work to `draft`. Scheduling requires both a timestamp and a recorded approver. Publishing cannot be reached without passing through approval.

## Caption rubric

`evaluateCaption` scores five deterministic checks: hook, audience value, call to action, readable length, and brand-safe claims. A score of 80 or more is ready for human review, never automatic publishing.

Run `npm run social:test` to verify these contracts.

