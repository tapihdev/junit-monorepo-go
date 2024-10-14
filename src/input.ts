import * as core from '@actions/core'
import * as github from '@actions/github'

export function getGitHubToken(): string {
  return core.getInput('github-token', { required: true })
}

export function getDirectories(): string[] {
  const raw = core.getInput('directories', { required: true })
  return raw === '' ? [] : raw.split(/,|\n/)
}

export function getFilename(): string {
  return core.getInput('filename', { required: true })
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

export function getLimitFailures(): number {
  const raw = core.getInput('limit-failures', { required: true })
  if (raw.match(/^\d+$/) === null) {
    throw new Error('`limit-failures` must be a number')
  }
  return Number(raw)
}
