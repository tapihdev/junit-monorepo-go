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
import { report } from './table'
import { makeMarkdownReport } from './markdown'

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
    const failedTestLimit = test?.annotationLimit || 10
    const failedLintLimit = lint?.annotationLimit || 10
    const { owner, repo } = github.context.repo
    const { runId, actor } = github.context

    core.info(`* make a junit report`)
    const singleFactory = new SingleJUnitReporterFactoryImpl(
      fs.promises.readFile
    )
    const multiFactory = new MultiJunitReportersFactoryImpl(singleFactory)
    const [tests, lints] = await multiFactory.fromXml(
      testDirs,
      lintDirs,
      testReportXml,
      lintReportXml
    )

    const reported = await report(
      { owner, repo, sha },
      tests,
      lints,
      failedTestLimit,
      failedLintLimit
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
      reported.result,
      reported.moduleTable,
      reported.failedTestTable,
      reported.failedLintTable
    )
    reported.annotations.forEach(annotation => core.info(annotation))

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
