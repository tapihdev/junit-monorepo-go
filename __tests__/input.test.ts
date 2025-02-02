import * as core from '@actions/core'
import * as github from '@actions/github'

import * as inputFunc from '../src/input'

let getInputMock: jest.SpiedFunction<typeof core.getInput>

const context = {
  owner: 'owner',
  repo: 'repo',
  sha: 'sha'
}

describe('input', () => {
  beforeEach(() => {
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
  })

  it('should handle github-token', () => {
    const testCases = [{ input: 'abcdef123456', expected: 'abcdef123456' }]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getGitHubToken()).toEqual(expected)
    }
  })

  it('should handle config', () => {
    const testCases = [
      {
        name: 'should return a gotestsum config',
        input:
          'test: { "title": "Test", "type": "gotestsum", "directories": ["go/app1", "go/app2"], "fileName": "test.xml" }',
        expected: [
          {
            title: 'Test',
            type: 'gotestsum',
            directories: ['go/app1', 'go/app2'],
            fileName: 'test.xml'
          }
        ]
      },
      {
        name: 'should return a golangci-lint config',
        input:
          'test: { "title": "Lint", "type": "golangci-lint", "directories": ["go/app1", "go/app2"], "fileName": "lint.xml" }',
        expected: [
          {
            title: 'Lint',
            type: 'golangci-lint',
            directories: ['go/app1', 'go/app2'],
            fileName: 'lint.xml'
          }
        ]
      },
      {
        name: 'should return a gotestsum config with a file link',
        input:
          'test: { "title": "Test", "file": "README.md", "type": "gotestsum", "directories": ["go/app1", "go/app2"], "fileName": "test.xml" }',
        expected: [
          {
            title: '[Test](https://github.com/owner/repo/blob/sha/README.md)',
            type: 'gotestsum',
            directories: ['go/app1', 'go/app2'],
            fileName: 'test.xml'
          }
        ]
      }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getConfig(context)).toEqual(expected)
    }
  })

  it('should throw error when an invalid config is given', () => {
    const testCases = [
      {
        input:
          'test: { "type": "gotestsum", "directories": ["go/app1", "go/app2"], "fileName": "test.xml" }'
      },
      {
        input:
          'test: { "title": "Test", "directories": ["go/app1", "go/app2"], "fileName": "test.xml" }'
      },
      {
        input:
          'test: { "title": "Test", "type": "invalid type", "directories": ["go/app1", "go/app2"], "fileName": "test.xml" }'
      }
    ]
    for (const { input } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(() => inputFunc.getConfig(context)).toThrow()
    }
  })

  it('should handle pull-request-number', () => {
    const testCases = [
      { input: '456', context: undefined, expected: 456 },
      { input: '', context: { number: 456 }, expected: 456 },
      { input: '', context: {}, expected: undefined }
    ]
    for (const { input, expected, context } of testCases) {
      Object.defineProperties(github.context.payload, {
        pull_request: {
          value: context,
          writable: true
        }
      })

      getInputMock.mockReturnValue(input)
      expect(inputFunc.getPullRequestNumber()).toEqual(expected)
    }
  })

  it('should throw error when an invalid pull-request-number is given', () => {
    const testCases = [{ input: 'abc', context: undefined }]
    for (const { input, context } of testCases) {
      Object.defineProperties(github.context.payload, {
        pull_request: {
          value: context,
          writable: true
        }
      })

      getInputMock.mockReturnValue(input)
      expect(() => inputFunc.getPullRequestNumber()).toThrow()
    }
  })

  it('should handle sha', () => {
    const testCases = [
      { input: 'abc123', context: undefined, expected: 'abc123' },
      { input: '', context: { sha: 'xyz123' }, expected: 'xyz123' }
    ]
    for (const { input, context, expected } of testCases) {
      Object.defineProperties(github, {
        context: {
          value: context,
          writable: true
        }
      })

      getInputMock.mockReturnValue(input)
      expect(inputFunc.getSha()).toEqual(expected)
    }
  })
})
