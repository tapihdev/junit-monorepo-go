import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'

import { Result } from './common/type'
import {
  getGitHubToken,
  getConfig,
  getPullRequestNumber,
  getSha
} from './input'
import { Client as GitHubClient } from './github'
import { makeMarkdownReport } from './markdown'
import { JUnitReporterFactory } from './reporter/factory'
import { TableSetFactory } from './table/factory'
import { JUnitXmlReader } from './reporter/reader'

const mark = '<!-- commented by junit-monorepo-go -->'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = getGitHubToken()
    const { owner, repo } = github.context.repo
    const { runId, actor } = github.context
    const sha = getSha()
    const pullNumber = getPullRequestNumber()
    const config = getConfig({
      owner,
      repo,
      sha
    })

    core.info(`* make a junit report`)
    const junixXmlReader = new JUnitXmlReader(fs.promises.readFile)
    const jUnitReporterFactory = new JUnitReporterFactory(junixXmlReader)
    const tableSetFactory = new TableSetFactory(jUnitReporterFactory)
    const tableSets = await tableSetFactory.multi(
      {
        owner,
        repo,
        sha
      },
      config
    )

    const body = makeMarkdownReport(
      {
        owner,
        repo,
        sha,
        runId,
        pullNumber,
        actor
      },
      tableSets?.result ?? Result.Passed,
      tableSets?.summary.toString() ?? '',
      tableSets?.failures.toUntyped().toString() ?? ''
    )
    tableSets?.annotations.forEach(annotation => core.info(annotation))

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

    core.info('* set output')
    core.setOutput('body', body)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
