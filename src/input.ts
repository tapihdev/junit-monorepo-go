import * as core from '@actions/core'
import * as github from '@actions/github'
import YAML from 'yaml'

import { ConfigSchema } from './config.generated'
import { XmlFileGroup } from './table/factory'
import { GitHubContext, ReporterType } from './common/type'

export function getGitHubToken(): string {
  return core.getInput('github-token', { required: true })
}

export function getConfig(context: GitHubContext): XmlFileGroup[] {
  const raw = core.getInput('config', { required: true })
  const { owner, repo, sha } = context
  const current = `https://github.com/${owner}/${repo}/blob/${sha}/`
  try {
    const config = ConfigSchema.parse(YAML.parse(raw))
    return Object.values(config).map(c => {
      let reporterType: ReporterType
      switch (c.type) {
        case 'gotestsum':
          reporterType = ReporterType.Gotestsum
          break
        case 'golangci-lint':
          reporterType = ReporterType.GolangCILint
          break
        default:
          throw new Error(`Invalid reporter type: ${c.type}`)
      }
      return {
        title: c.file ? `[${c.title}](${new URL(c.file, current)})` : c.title,
        type: reporterType,
        directories: c.directories,
        fileName: c.fileName
      }
    })
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
