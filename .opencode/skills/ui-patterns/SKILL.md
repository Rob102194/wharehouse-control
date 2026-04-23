---
name: ui-patterns
description: Strict UI and UX guidance for operational and consultation modules
---

# UI patterns

Use this skill whenever the task involves:
- screen design
- component design
- flow design
- responsiveness
- movement forms
- stock consultation screens
- transfer confirmation UI

## UX split is mandatory
This product has two distinct UX modes.

Do not blur them unless explicitly requested.

## Operational UX
Audience:
- warehouse operators

Primary goal:
- complete inventory movements quickly with low error rate

Characteristics:
- tactile
- fast
- low-friction
- mobile/tablet optimized
- POS-like interaction model

Preferred patterns:
- large primary actions
- product search first
- optional category shortcuts
- quick quantity editing
- stepper and numeric input patterns
- movement summary/cart pattern
- strong final confirmation action

Avoid:
- dense admin forms
- hidden movement summaries
- multi-screen flows when one structured flow would do
- excessive typing when tapping/selecting can solve it

## Consultation/admin UX
Audience:
- admin
- owner/read-only

Primary goal:
- inspect, filter, compare, and understand data

Characteristics:
- traditional layout
- tables
- filters
- status labels
- detail views
- less urgency, more clarity

Preferred patterns:
- stock tables
- movement history tables
- transfer status indicators
- row detail or dedicated detail screens
- clear filter controls

Avoid:
- forcing POS-like interaction into reporting screens
- over-visual dashboards that hide detail

## Responsive priority
Design priority order:
1. tablet
2. mobile
3. desktop for admin/consultation depth

Operational screens must remain efficient on tablet and mobile.
Consultation screens must remain readable on desktop and tablet.

## Movement screen expectations
A movement creation flow should usually expose:
- movement type
- origin and/or destination warehouse
- product search/add
- quantity editing
- movement summary
- confirm action

Do not make users navigate through unnecessary nested forms.

## Transfer confirmation expectations
A transfer receipt screen should clearly show:
- origin
- destination
- dispatch actor if available
- dispatched items
- receipt action
- incident/difference handling if supported

## UI decision policy
When choosing between:
- visual flair
- operational speed
Prefer operational speed.

When choosing between:
- generic design consistency
- workflow efficiency
Prefer workflow efficiency.