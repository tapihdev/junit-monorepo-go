import * as core from '@actions/core'
import * as github from '@actions/github'
import YAML from 'yaml'

import { Config, ConfigSchema } from './config'

export function getGitHubToken(): string {
  return core.getInput('github-token', { required: true })
}

export function getConfig(): Config {
  const raw = core.getInput('config', { required: true })
  try {
    return ConfigSchema.parse(YAML.parse(raw))
  } catch (error) {
    throw new Error(`Invalid config: ${error}`)
  }
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
