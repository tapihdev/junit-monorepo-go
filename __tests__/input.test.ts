import * as core from '@actions/core'
import * as github from '@actions/github'

import * as inputFunc from '../src/input'

let getInputMock: jest.SpiedFunction<typeof core.getInput>

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

  it('should handle test-report-xml', () => {
    const testCases = [
      { input: 'path/to/test.xml', expected: 'path/to/test.xml' }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getTestReportXml()).toEqual(expected)
    }
  })

  it('should handle test directories', () => {
    const testCases = [
      { input: '', expected: [] },
      { input: 'go/app1,go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1\n go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1, go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1 go/app2', expected: ['go/app1', 'go/app2'] }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getTestDirs()).toEqual(expected)
    }
  })

  it('should handle lint directories', () => {
    const testCases = [
      { input: '', expected: [] },
      { input: 'go/app1,go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1\n go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1, go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1 go/app2', expected: ['go/app1', 'go/app2'] }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getLintDirs()).toEqual(expected)
    }
  })

  it('should handle lint-report-xml', () => {
    const testCases = [
      { input: 'path/to/lint.xml', expected: 'path/to/lint.xml' }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getLintReportXml()).toEqual(expected)
    }
  })

  it('should handle pull-request-number', () => {
    const testCases = [
      { input: '456', context: undefined, expected: 456 },
      { input: '', context: { number: 456 }, expected: 456 }
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
    const testCases = [
      { input: 'abc', context: undefined },
      { input: '', context: undefined }
    ]
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
    const testCases = [{ input: 'abcdef123456', expected: 'abcdef123456' }]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getSha()).toEqual(expected)
    }
  })

  it('should handle failed-test-limit', () => {
    const testCases = [
      { input: '5', expected: 5 },
      { input: '10', expected: 10 }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getFailedTestLimit()).toEqual(expected)
    }
  })

  it('should throw error when an invalid failed-test-limit is given', () => {
    const testCases = [
      { input: '-1' },
      { input: '0' },
      { input: '' },
      { input: 'abc' }
    ]
    for (const { input } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(() => inputFunc.getFailedTestLimit()).toThrow()
    }
  })

  it('should handle failed-lint-limit', () => {
    const testCases = [
      { input: '5', expected: 5 },
      { input: '10', expected: 10 }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getFailedLintLimit()).toEqual(expected)
    }
  })

  it('should throw error when an invalid failed-lint-limit is given', () => {
    const testCases = [
      { input: '-1' },
      { input: '0' },
      { input: '' },
      { input: 'abc' }
    ]
    for (const { input } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(() => inputFunc.getFailedLintLimit()).toThrow()
    }
  })

  it('should handle skip-comment', () => {
    const testCases = [
      { input: 'true', expected: true },
      { input: 'false', expected: false }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getSkipComment()).toEqual(expected)
    }
  })

  it('should throw error when an invalid skip-comment is given', () => {
    const testCases = [{ input: 'abc' }, { input: '' }]
    for (const { input } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(() => inputFunc.getSkipComment()).toThrow()
    }
  })
})
