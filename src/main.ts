import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'

import {
  getGitHubToken,
  getConfig,
  getPullRequestNumber,
  getSha
} from './input'
import { Client as GitHubClient } from './github'
import { makeMarkdownReport } from './markdown'
import { TableComposer } from './composer'

import {
  SingleJUnitReporterFactoryImpl,
  MultiJunitReportersFactoryImpl
} from './junit/factory'

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
    const test = config['test']
    if (test === undefined) {
      throw new Error('`test` is required')
    }
    const lint = config['lint']

    const testDirs = test.directories
    const lintDirs = lint?.directories ?? []
    const testReportXml = test.fileName
    const lintReportXml = lint?.fileName ?? ''
    const { owner, repo } = github.context.repo
    const { runId, actor } = github.context

    core.info(`* make a junit report`)
    const singleFactory = new SingleJUnitReporterFactoryImpl(
      fs.promises.readFile
    )
    const multiFactory = new MultiJunitReportersFactoryImpl(singleFactory)
    const githubContext = {
      owner,
      repo,
      sha
    }

    const [tests, lints] = await multiFactory.fromXml(
      githubContext,
      testDirs,
      lintDirs,
      testReportXml,
      lintReportXml
    )

    const composer = new TableComposer(tests, lints)
    const result = composer.result()
    const summary = composer.summary(githubContext)
    const failures = composer.failures(githubContext)
    const annotations = composer.annotations()

    const body = makeMarkdownReport(
      {
        owner,
        repo,
        sha,
        runId,
        pullNumber,
        actor
      },
      result,
      summary,
      failures
    )
    annotations.forEach(annotation => core.info(annotation))

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
