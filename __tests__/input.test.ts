import * as core from '@actions/core'
import * as github from '@actions/github'

import * as inputFunc from '../src/input'

let getInputMock: jest.SpiedFunction<typeof core.getInput>

describe('input', () => {
  beforeEach(() => {
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
  })

  it('should handle github-token', () => {
    const testCases = [
      { input: 'abcdef123456', expected: 'abcdef123456' }
    ]
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

  it('should handle directories', () => {
    const testCases = [
      { input: '', expected: [] },
      { input: 'go/app1,go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1\n go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1, go/app2', expected: ['go/app1', 'go/app2'] },
      { input: 'go/app1 go/app2', expected: ['go/app1', 'go/app2'] }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getDirectories()).toEqual(expected)
    }
  })

  it('should handle lint-report-xml', () => {
    const testCases = [
      { input: '', expected: undefined },
      { input: 'path/to/lint.xml', expected: 'path/to/lint.xml' }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getLintReportXml()).toEqual(expected)
    }
  })

  it('should handle pull-request-number with an input', () => {
    const testCases = [
      { input: '456', expected: 456 }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getPullRequestNumber()).toEqual(expected)
    }
  })

  it('should handle pull-request-number without an input', () => {
    const testCases = [
      { input: '', expected: '', shouldThrow: true },
      { input: '456', expected: 456, shouldThrow: false }
    ]
    for (const { input, expected, shouldThrow } of testCases) {
        Object.defineProperties(github.context.payload, {
          pull_request: { value: { number: input }, writable: true }
        })

      getInputMock.mockReturnValue('')
      if (shouldThrow) {
        expect(inputFunc.getPullRequestNumber()).toThrow(Error)
      } else {
        expect(inputFunc.getPullRequestNumber()).toEqual(expected)
      }
    }
  })

  it('should handle sha', () => {
    const testCases = [
      { input: 'abcdef123456', expected: 'abcdef123456' }
    ]
    for (const { input, expected } of testCases) {
      getInputMock.mockReturnValue(input)
      expect(inputFunc.getSha()).toEqual(expected)
    }
  })

  it('should handle failed-test-limit', () => {
    const testCases = [
      { input: '5', expected: 5, shouldThrow: false },
      { input: '', expected: '', shouldThrow: true },
      { input: 'abc', expected: '', shouldThrow: true }
    ]
    for (const { input, expected, shouldThrow } of testCases) {
      getInputMock.mockReturnValue(input)
      if (shouldThrow) {
        expect(inputFunc.getFailedTestLimit()).toThrow(Error)
      } else {
        expect(inputFunc.getFailedTestLimit()).toEqual(expected)
      }
    }
  })

  it('should handle failed-lint-limit', () => {
    const testCases = [
      { input: '5', expected: 5, shouldThrow: false },
      { input: '', expected: '', shouldThrow: true },
      { input: 'abc', expected: '', shouldThrow: true }
    ]
    for (const { input, expected, shouldThrow } of testCases) {
      getInputMock.mockReturnValue(input)
      if (shouldThrow) {
        expect(inputFunc.getFailedLintLimit()).toThrow(Error)
      } else {
        expect(inputFunc.getFailedLintLimit()).toEqual(expected)
      }
    }
  })
})