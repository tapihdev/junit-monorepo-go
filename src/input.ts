import * as core from '@actions/core'

export function getFilename(): string {
  return core.getInput('filename', {required: true})
}

export function getGitHubToken(): string {
  return core.getInput('github-token', {required: true})
}