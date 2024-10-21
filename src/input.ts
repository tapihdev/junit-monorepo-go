import * as core from '@actions/core'
import * as github from '@actions/github'

export function getGitHubToken(): string {
  return core.getInput('github-token', { required: true })
}

export function getDirectories(): string[] {
  const raw = core.getInput('directories', { required: true })
  return raw === ''
    ? []
    : raw
      .replace(/(,| |\n)+/g, ' ')
      .split(' ')
      .map(d => d.trim())
}

export function getTestReportXml(): string {
  return core.getInput('test-report-xml', { required: true })
}

export function getLintReportXml(): string | undefined {
  const raw = core.getInput('lint-report-xml', { required: false })
  if (raw === '') {
    return undefined
  }
  return raw
}

export function getPullRequestNumber(): number {
  const raw = core.getInput('pull-request-number', { required: false })
  if (raw === '') {
    if (github.context.payload.pull_request === undefined) {
      throw new Error(
        '`pull-request-number` is required when not running from a pull request'
      )
    }
    return github.context.payload.pull_request.number
  }

  if (raw.match(/^\d+$/) === null) {
    throw new Error('`pull-request-number` must be a number')
  }
  return Number(raw)
}

export function getSha(): string {
  return core.getInput('sha', { required: true })
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
