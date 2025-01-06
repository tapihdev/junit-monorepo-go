import * as core from '@actions/core'
import * as github from '@actions/github'

export function getGitHubToken(): string {
  return core.getInput('github-token', { required: true })
}

export function getPullRequestNumber(): number | undefined {
  const raw = core.getInput('pull-request-number', { required: false })
  if (raw === '') {
    return github.context.payload.pull_request?.number
  }

  if (raw.match(/^\d+$/) === null) {
    throw new Error('`pull-request-number` must be a number')
  }
  return Number(raw)
}

export function getSha(): string {
  const raw = core.getInput('sha', { required: false })
  return raw === '' ? github.context.sha : raw
}

export function getFailedTestLimit(): number {
  const raw = core.getInput('failed-test-limit', { required: true })
  if (raw.match(/^\d+$/) === null) {
    throw new Error('`failed-test-limit` must be a number')
  }
  const value = Number(raw)
  if (value <= 0) {
    throw new Error('`failed-test-limit` must be greater than 0')
  }
  return value
}

export function getFailedLintLimit(): number {
  const raw = core.getInput('failed-lint-limit', { required: true })
  if (raw.match(/^\d+$/) === null) {
    throw new Error('`failed-lint-limit` must be a number')
  }

  const value = Number(raw)
  if (value <= 0) {
    throw new Error('`failed-lint-limit` must be greater than 0')
  }
  return value
}
