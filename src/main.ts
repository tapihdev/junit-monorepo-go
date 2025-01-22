import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs'

import {
  getGitHubToken,
  getConfig,
  getPullRequestNumber,
  getSha
} from './input'
import { Client as GitHubClient } from './github'
import { createFailedCaseTable, createModuleTable } from './table'
import { JUnitReporterFactoryImpl } from './junit/factory'
import { Result } from './type'
import { makeMarkdownReport, GoModulesFactory } from './table'

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

    core.info(`* search and read junit reports`)
    const repoterFactory = new JUnitReporterFactoryImpl(fs.promises.readFile)
    const factory = new GoModulesFactory(repoterFactory)
    const modules = await factory.fromXml(
      owner,
      repo,
      sha,
      testDirs,
      lintDirs,
      testReportXml,
      lintReportXml
    )

    const moduleTable = createModuleTable(
      modules.map(module => module.makeModuleTableRecord())
    )
    const failedTestTable = createFailedCaseTable(
      modules.map(m => m.makeFailedTestTableRecords()).flat(),
      failedTestLimit
    )
    const failedLintTable = createFailedCaseTable(
      modules.map(m => m.makeFailedLintTableRecords()).flat(),
      failedLintLimit
    )
    const result = modules.every(m => m.result === Result.Passed)
      ? Result.Passed
      : Result.Failed

    modules.forEach(m =>
      m.makeAnnotationMessages().forEach(annotation => core.info(annotation))
    )

    const body = makeMarkdownReport(
      {
        owner,
        repo,
        pullNumber,
        sha,
        runId,
        actor
      },
      result,
      moduleTable,
      failedTestTable,
      failedLintTable
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

    core.info('* set output')
    core.setOutput('body', body)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
