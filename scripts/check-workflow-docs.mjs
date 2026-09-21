#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const requiredFiles = [
  'AGENTS.md',
  'PLAN.md',
  'docs/llm-workflow.md',
  'docs/decisions/README.md',
  'docs/decisions/0001-llm-assisted-development-workflow.md',
  'docs/milestones/README.md',
  'docs/templates/adr-template.md',
  'docs/templates/milestone-template.md',
  'docs/templates/plan-template.md',
  'docs/templates/review-template.md',
  'docs/templates/handoff-template.md',
]

const requiredHeadings = {
  'docs/llm-workflow.md': [
    '## Documentation layout',
    '## Constitution',
    '## Agent roles and handoffs',
    '## Milestone lifecycle',
    '## Decision records and journals',
  ],
  'docs/templates/milestone-template.md': [
    '## Context',
    '## Approved scope',
    '## Verification',
    '## Review status',
  ],
  'docs/templates/adr-template.md': [
    '## Context',
    '## Decision',
    '## Consequences',
  ],
}

const failures = []

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required workflow file: ${file}`)
}

for (const [file, headings] of Object.entries(requiredHeadings)) {
  if (!existsSync(file)) continue
  const content = readFileSync(file, 'utf8')
  for (const heading of headings) {
    if (!content.includes(heading)) failures.push(`${file} missing heading: ${heading}`)
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Workflow documentation structure looks complete.')
