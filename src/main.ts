import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import glob from 'fast-glob'

import { getFilename, getGitHubToken } from './input'
import { JunitReport } from './junit'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const filename = getFilename()
    const token = getGitHubToken()

    core.info(`* search junit reports: ${filename}`)
    const contents = new Map<string, JunitReport>();
    for (const file of await glob(`**/${filename}`, {dot: true})) {
      const junit = JunitReport.fromXml(file)
      contents.set(file, junit)
    }

    const reporter = new MarkdownReporter(contents)

    const mark = "<!-- commented by junit-monorepo-go -->"
    const body = `${mark}\n${reporter.table()}`

    const octokit = github.getOctokit(token)
    const { owner, repo } = github.context.repo

    core.info('* get all comments and update if exists')
    const allComments = await octokit.paginate(
      octokit.rest.issues.listComments,
      {
        owner,
        repo,
        issue_number: github.context.issue.number,
      },
    )
    const pastComments = allComments.filter(
      c => c.body !== undefined && c.body.startsWith(mark),
    )
    if (pastComments.length > 0) {
      core.info(`update past comment: ${pastComments[0].id}`)
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: pastComments[0].id,
        body,
      })
    } else {
      core.info('create new comment')
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: github.context.issue.number,
        body,
      })
    }

    core.info('* post summary to summary page')
    core.summary.addRaw(body)

    core.info('* annotate failed tests')
    for (const [file, junit] of contents) {
      if (junit.testsuites.testsuite === undefined) {
        continue
      }
      for (const suite of junit.testsuites.testsuite) {
        if (suite.testcase === undefined) {
          continue
        }
        for (const testcase of suite.testcase) {
          if (testcase.failure !== undefined) {
            core.info(`::notice file=${file},line={line},endLine={endLine},title={title}::{message}`)
          }
        }
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}