import * as core from '@actions/core'
import * as github from '@actions/github'

import {
  getDirectories,
  getFilename,
  getGitHubToken,
  getPullRequestNumber,
  getSha,
  getLimitFailures
} from './input'
import { Client as GitHubClient } from './github'
import { Monorepo } from './monorepo'

const mark = '<!-- commented by junit-monorepo-go -->'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const directories = getDirectories()
    const filename = getFilename()
    const token = getGitHubToken()
    const pullNumber = getPullRequestNumber()
    const sha = getSha()
    const limitFailures = getLimitFailures()

    core.info(`* search and read junit reports: ${filename}`)
    const monorepo =
      directories.length === 0
        ? await Monorepo.fromFilename(filename)
        : await Monorepo.fromDirectories(directories, filename)

    core.info('* make markdown report')
    const { owner, repo } = github.context.repo
    const { runId, actor } = github.context
    const body = monorepo.makeMarkdownReport(
      {
        owner,
        repo,
        pullNumber,
        sha,
        runId,
        actor
      },
      limitFailures
    )

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

    core.info('* post summary to summary page')
    await core.summary.addRaw(body).write()

    core.info('* annotate failed tests')
    monorepo
      .makeAnnotationMessages()
      .forEach(annotation => core.info(annotation))

    core.info('* set output')
    core.setOutput('body', body)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
