/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as github from '@actions/github'

import * as main from '../src/main'
import { Client as GitHubClient } from '../src/github'
import { GoRepository } from '../src/repository'
import { GoRepositoryFactory } from '../src/factory'
import { Result } from '../src/junit/type'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let infoMock: jest.SpiedFunction<typeof core.info>
let errorMock: jest.SpiedFunction<typeof core.error>
let getInputMock: jest.SpiedFunction<typeof core.getInput>
let summaryAddRawMock: jest.SpiedFunction<typeof core.summary.addRaw>
let summaryWriteMock: jest.SpiedFunction<typeof core.summary.write>
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>
let setOutputMock: jest.SpiedFunction<typeof core.setOutput>

let upsertCommentMock: jest.SpiedFunction<GitHubClient['upsertComment']>
let repositoryFactoryFromXmlMock: jest.SpiedFunction<
  GoRepositoryFactory['fromXml']
>
let makeMarkdownReportMock: jest.SpiedFunction<
  GoRepository['makeMarkdownReport']
>
let makeAnnotationMessagesMock: jest.SpiedFunction<
  GoRepository['makeAnnotationMessages']
>

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock the GitHub core library functions
    infoMock = jest.spyOn(core, 'info').mockImplementation()
    errorMock = jest.spyOn(core, 'error').mockImplementation()
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    summaryAddRawMock = jest.spyOn(core.summary, 'addRaw').mockReturnThis()
    summaryWriteMock = jest.spyOn(core.summary, 'write').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

    // Mock self-defined classes
    upsertCommentMock = jest
      .spyOn(GitHubClient.prototype, 'upsertComment')
      .mockResolvedValue({ updated: false, id: 123 })
    repositoryFactoryFromXmlMock = jest
      .spyOn(GoRepositoryFactory.prototype, 'fromXml')
      .mockResolvedValue(new GoRepository([]))
    makeMarkdownReportMock = jest
      .spyOn(GoRepository.prototype, 'makeMarkdownReport')
      .mockReturnValue('markdown report')
    makeAnnotationMessagesMock = jest
      .spyOn(GoRepository.prototype, 'makeAnnotationMessages')
      .mockReturnValue(['annotation'])
  })

  it('should post comment and summary', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'github-token':
          return 'xxx'
        case 'config':
          return `
test:
  title: Test
  type: gotestsum
  fileName: test.xml
  directories:
  - go/app1
  - go/app2
  annotationLimit: 10
lint:
  title: '[Lint](./golangci.toml)'
  type: golangci-lint
  fileName: lint.xml
  directories:
  - go/app1
  - go/app3
  annotationLimit: 5
`.slice(1, -1)
        case 'pull-request-number':
          return ''
        case 'sha':
          return 'sha'
        default:
          return ''
      }
    })

    Object.defineProperties(github.context, {
      repo: { value: { owner: 'owner', repo: 'repo' }, writable: true },
      payload: { value: { pull_request: { number: 123 } }, writable: true },
      runId: { value: 123, writable: true },
      actor: { value: 'actor', writable: true }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      '* search and read junit reports'
    )
    expect(infoMock).toHaveBeenNthCalledWith(2, '* make markdown report')
    expect(infoMock).toHaveBeenNthCalledWith(
      3,
      '* upsert comment matching <!-- commented by junit-monorepo-go -->'
    )
    expect(infoMock).toHaveBeenNthCalledWith(4, 'created comment: 123')
    expect(infoMock).toHaveBeenNthCalledWith(
      5,
      '* post summary to summary page'
    )
    expect(infoMock).toHaveBeenNthCalledWith(6, '* annotate failed tests')
    expect(infoMock).toHaveBeenNthCalledWith(7, 'annotation')
    expect(infoMock).toHaveBeenNthCalledWith(8, '* set output')
    expect(repositoryFactoryFromXmlMock).toHaveBeenNthCalledWith(
      1,
      ['go/app1', 'go/app2'],
      ['go/app1', 'go/app3'],
      'test.xml',
      'lint.xml'
    )
    expect(upsertCommentMock).toHaveBeenNthCalledWith(1, {
      owner: 'owner',
      repo: 'repo',
      pullNumber: 123,
      mark: '<!-- commented by junit-monorepo-go -->',
      body: 'markdown report'
    })
    expect(makeMarkdownReportMock).toHaveBeenNthCalledWith(
      1,
      {
        owner: 'owner',
        repo: 'repo',
        pullNumber: 123,
        sha: 'sha',
        runId: 123,
        actor: 'actor'
      },
      Result.Passed,
      '',
      '',
      ''
    )
    expect(makeAnnotationMessagesMock).toHaveBeenNthCalledWith(1)
    expect(summaryAddRawMock).toHaveBeenNthCalledWith(1, 'markdown report')
    expect(summaryWriteMock).toHaveBeenNthCalledWith(1)
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'body', 'markdown report')
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('should post summary', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'github-token':
          return 'xxx'
        case 'config':
          return `
test:
  title: Test
  type: gotestsum
  fileName: test.xml
  directories:
  - go/app1
  - go/app2
  annotationLimit: 10
lint:
  title: '[Lint](./golangci.toml)'
  type: golangci-lint
  fileName: lint.xml
  directories:
  - go/app1
  - go/app3
  annotationLimit: 5
`.slice(1, -1)
        case 'pull-request-number':
          return ''
        case 'sha':
          return 'sha'
        default:
          return ''
      }
    })

    Object.defineProperties(github.context, {
      repo: { value: { owner: 'owner', repo: 'repo' }, writable: true },
      payload: { value: { pull_request: undefined }, writable: true },
      runId: { value: 123, writable: true },
      actor: { value: 'actor', writable: true }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    expect(infoMock).toHaveBeenNthCalledWith(
      1,
      '* search and read junit reports'
    )
    expect(infoMock).toHaveBeenNthCalledWith(2, '* make markdown report')
    expect(infoMock).toHaveBeenNthCalledWith(
      3,
      '* post summary to summary page'
    )
    expect(infoMock).toHaveBeenNthCalledWith(4, '* annotate failed tests')
    expect(infoMock).toHaveBeenNthCalledWith(5, 'annotation')
    expect(infoMock).toHaveBeenNthCalledWith(6, '* set output')
    expect(repositoryFactoryFromXmlMock).toHaveBeenNthCalledWith(
      1,
      ['go/app1', 'go/app2'],
      ['go/app1', 'go/app3'],
      'test.xml',
      'lint.xml'
    )
    expect(makeMarkdownReportMock).toHaveBeenNthCalledWith(
      1,
      {
        owner: 'owner',
        repo: 'repo',
        pullNumber: undefined,
        sha: 'sha',
        runId: 123,
        actor: 'actor'
      },
      Result.Passed,
      '',
      '',
      ''
    )
    expect(makeAnnotationMessagesMock).toHaveBeenNthCalledWith(1)
    expect(summaryAddRawMock).toHaveBeenNthCalledWith(1, 'markdown report')
    expect(summaryWriteMock).toHaveBeenNthCalledWith(1)
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'body', 'markdown report')
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('should set a failed status', async () => {
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'github-token':
          return 'xxx'
        case 'config':
          return `
test:
  title: Test
  type: gotestsum
  fileName: test.xml
  directories:
  - go/app1
  - go/app2
lint:
  title: '[Lint](./golangci.toml)'
  type: golangci-lint
  fileName: lint.xml
  directories:
  - go/app1
  - go/app3
`.slice(1, -1)
        case 'pull-request-number':
          return 'xxx'
        case 'sha':
          return 'sha'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    expect(setFailedMock).toHaveBeenNthCalledWith(
      1,
      '`pull-request-number` must be a number'
    )
    expect(errorMock).not.toHaveBeenCalled()
  })
})
