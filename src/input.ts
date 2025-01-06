import * as core from '@actions/core'
import * as github from '@actions/github'
import YAML from 'yaml'

import { Config, ConfigItemType } from './config'

export function getGitHubToken(): string {
  return core.getInput('github-token', { required: true })
}

export function getConfig(): Config {
  const raw = core.getInput('config', { required: true })
  const config = YAML.parse(raw) as Config

  const entries = Object.entries(config)
  if (entries.some(([_, value]) => value.annotationLimit !== undefined && value.annotationLimit < 0)) {
    throw new Error('`annotationLimit` must be a positive number')
  }
  return config
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