import { JUnitReporterFactory } from '../src/junit/factory'
import { GoRepositoryFactory } from '../src/factory'
import { Reporter, ReporterType } from '../src/junit/type'
import { GotestsumReport } from '../src/junit/gotestsum'
import { GolangCILintReport } from '../src/junit/golangcilint'

describe('GoRepositoryFactory', () => {
  let factory: GoRepositoryFactory
  let reporterFactoryMock: JUnitReporterFactory
  beforeEach(() => {
    jest.clearAllMocks()
    reporterFactoryMock = {
      fromJSON: jest
        .fn()
        .mockImplementation(
          async (type: ReporterType, path: string): Promise<Reporter> => {
            if (type === ReporterType.GolangCILint) {
              return new GolangCILintReport(path, {
                testsuites: {
                  testsuite: [
                    {
                      $: {
                        name: 'Lint',
                        tests: '0',
                        failures: '0'
                      }
                    }
                  ]
                }
              })
            }

            return new GotestsumReport(path, {
              testsuites: {
                testsuite: [
                  {
                    $: {
                      name: 'Test',
                      tests: '0',
                      failures: '0'
                    }
                  }
                ]
              }
            })
          }
        )
    }
    factory = new GoRepositoryFactory(reporterFactoryMock)
  })

  const testCases = [
    {
      name: 'should create a GoRepository with no tests and lints',
      input: {
        tests: [],
        lints: [],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 0
    },
    {
      name: 'should create a GoRepository with a test',
      input: {
        tests: ['test'],
        lints: [],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 1
    },
    {
      name: 'should create a GoRepository with tests',
      input: {
        tests: ['test1', 'test2'],
        lints: [],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 2
    },
    {
      name: 'should create a GoRepository with a lint',
      input: {
        tests: [],
        lints: ['lint'],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 1
    },
    {
      name: 'should create a GoRepository with lints',
      input: {
        tests: [],
        lints: ['lint1', 'lint2'],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 2
    },
    {
      name: 'should create a GoRepository with tests',
      input: {
        tests: ['test'],
        lints: ['lint'],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 2
    },
    {
      name: 'should deduplicate tests and lints',
      input: {
        tests: ['test', 'test'],
        lints: ['lint', 'lint'],
        testXml: 'test.xml',
        lintXml: 'lint.xml'
      },
      expected: 2
    }
  ]

  it.each(testCases)(
    '%s',
    async ({ input: { tests, lints, testXml, lintXml }, expected }) => {
      const repo = await factory.fromXml(tests, lints, testXml, lintXml)
      expect(repo.numModules()).toBe(expected)

      const union = new Set([...tests, ...lints])
      const tested = new Set(tests)
      const linted = new Set(lints)
      const notTested = new Set(Array.from(union).filter(x => !tested.has(x)))
      const notLinted = new Set(Array.from(union).filter(x => !linted.has(x)))

      tested.forEach(d => {
        try {
          expect(repo.hasTestReport(d)).toBe(true)
        } catch (e) {
          throw new Error(`${e}: ${d} should be tested but is not`)
        }
      })
      linted.forEach(d => {
        try {
          expect(repo.hasLintReport(d)).toBe(true)
        } catch (e) {
          throw new Error(`${e}: ${d} should be linted but is not`)
        }
      })
      notTested.forEach(d => {
        try {
          expect(repo.hasTestReport(d)).toBe(false)
        } catch (e) {
          throw new Error(`${e}: ${d} should not be tested but is`)
        }
      })
      notLinted.forEach(d => {
        try {
          expect(repo.hasLintReport(d)).toBe(false)
        } catch (e) {
          throw new Error(`${e}: ${d} should not be linted but is`)
        }
      })
    }
  )
})
