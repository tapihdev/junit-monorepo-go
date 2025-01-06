import * as core from '@actions/core'
import * as github from '@actions/github'

import {
  getGitHubToken,
  getConfig,
  getPullRequestNumber,
  getSha,
} from './input'
import { Client as GitHubClient } from './github'
import { GoRepositoryFactory } from './factory'
import { parseJUnitReport } from './junit/xml'

const mark = '<!-- commented by junit-monorepo-go -->'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = getGitHubToken()
    const config = getConfig()
    const pullNumber = getPullRequestNumber()
    const sha = getSha()

    // TODO: this is a temporary logic just to make modification easier
    if (config.length !== 2) {
      throw new Error('config must have 2 elements')
    }
    const test = config[0]
    const lint = config[1]
    const testDirs = test.directories
    const lintDirs = lint.directories
    const testReportXml = test.fileName
    const lintReportXml = lint.fileName
    const failedTestLimit = test.annotationLimit || 10
    const failedLintLimit = lint.annotationLimit || 10

    core.info(`* search and read junit reports`)
    const factory = new GoRepositoryFactory(parseJUnitReport)
    const repository = await factory.fromXml(
      testDirs,
      lintDirs,
      testReportXml,
      lintReportXml
    )

    core.info('* make markdown report')
    const { owner, repo } = github.context.repo
    const { runId, actor } = github.context
    const body = repository.makeMarkdownReport(
      {
        owner,
        repo,
        pullNumber,
        sha,
        runId,
        actor
      },
      failedTestLimit,
      failedLintLimit
    )

    if (pullNumber !== undefined) {
      core.info(`* upsert comment matching ${mark}`)
      const client = new GitHubClient(github.getOctokit(token))
      const result = await client.upsertComment({
        owner,
        repo,
        pullNumber,
        mark,
        body
      })
      if (result.updated) {
        core.info(`updated comment: ${result.id}`)
      } else {
        core.info(`created comment: ${result.id}`)
      }
    }

    core.info('* post summary to summary page')
    await core.summary.addRaw(body).write()

    core.info('* annotate failed tests')
    repository
      .makeAnnotationMessages()
      .forEach(annotation => core.info(annotation))

    core.info('* set output')
    core.setOutput('body', body)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
