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
import fs from 'fs'

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
let readerMock: jest.SpiedFunction<(typeof fs.promises)['readFile']>

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

    readerMock = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(`
        <?xml version="1.0" encoding="UTF-8"?>
        <testsuites></testsuites>
        `)
  })

  it('should post comment and summary', async () => {
    const body = `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/123)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/sha/go/app1) | - | ✅Passed | 0 | 0 | - | ✅Passed |
| [go/app2](https://github.com/owner/repo/blob/sha/go/app2) | - | ✅Passed | 0 | 0 | - | - |
| [go/app3](https://github.com/owner/repo/blob/sha/go/app3) | - | - | - | - | - | ✅Passed |

---
*This comment is created for the commit [sha](https://github.com/owner/repo/pull/123/commits/sha) pushed by @actor.*
`.slice(1, -1)

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
    expect(infoMock).toHaveBeenNthCalledWith(1, '* make a junit report')
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      '* upsert comment matching <!-- commented by junit-monorepo-go -->'
    )
    expect(infoMock).toHaveBeenNthCalledWith(3, 'created comment: 123')
    expect(infoMock).toHaveBeenNthCalledWith(
      4,
      '* post summary to summary page'
    )
    expect(infoMock).toHaveBeenNthCalledWith(5, '* set output')
    expect(readerMock).toHaveBeenNthCalledWith(1, 'go/app1/test.xml', {
      encoding: 'utf8'
    })
    expect(readerMock).toHaveBeenNthCalledWith(2, 'go/app2/test.xml', {
      encoding: 'utf8'
    })
    expect(readerMock).toHaveBeenNthCalledWith(3, 'go/app1/lint.xml', {
      encoding: 'utf8'
    })
    expect(readerMock).toHaveBeenNthCalledWith(4, 'go/app3/lint.xml', {
      encoding: 'utf8'
    })
    expect(upsertCommentMock).toHaveBeenNthCalledWith(1, {
      owner: 'owner',
      repo: 'repo',
      pullNumber: 123,
      mark: '<!-- commented by junit-monorepo-go -->',
      body: body
    })
    expect(summaryAddRawMock).toHaveBeenNthCalledWith(1, body)
    expect(summaryWriteMock).toHaveBeenNthCalledWith(1)
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'body', body)
    expect(errorMock).not.toHaveBeenCalled()
  })

  it('should post summary', async () => {
    const body = `
## 🥽 Go Test Report <sup>[CI](https://github.com/owner/repo/actions/runs/123)</sup>

#### Result: \`Passed\`🙆‍♀️

| Module | Version | Test | Passed | Failed | Time | Lint |
| :----- | ------: | :--- | -----: | -----: | ---: | :--- |
| [go/app1](https://github.com/owner/repo/blob/sha/go/app1) | - | ✅Passed | 0 | 0 | - | ✅Passed |
| [go/app2](https://github.com/owner/repo/blob/sha/go/app2) | - | ✅Passed | 0 | 0 | - | - |
| [go/app3](https://github.com/owner/repo/blob/sha/go/app3) | - | - | - | - | - | ✅Passed |

---
*This comment is created for the commit [sha](https://github.com/owner/repo/commit/sha) pushed by @actor.*
`.slice(1, -1)

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
    expect(infoMock).toHaveBeenNthCalledWith(1, '* make a junit report')
    expect(infoMock).toHaveBeenNthCalledWith(
      2,
      '* post summary to summary page'
    )
    expect(readerMock).toHaveBeenNthCalledWith(1, 'go/app1/test.xml', {
      encoding: 'utf8'
    })
    expect(readerMock).toHaveBeenNthCalledWith(2, 'go/app2/test.xml', {
      encoding: 'utf8'
    })
    expect(readerMock).toHaveBeenNthCalledWith(3, 'go/app1/lint.xml', {
      encoding: 'utf8'
    })
    expect(readerMock).toHaveBeenNthCalledWith(4, 'go/app3/lint.xml', {
      encoding: 'utf8'
    })
    expect(infoMock).toHaveBeenNthCalledWith(3, '* set output')
    expect(summaryAddRawMock).toHaveBeenNthCalledWith(1, body)
    expect(summaryWriteMock).toHaveBeenNthCalledWith(1)
    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'body', body)
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
