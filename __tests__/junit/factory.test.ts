import fs from 'fs'

import {
  SingleJUnitReporterFactoryImpl,
  MultiJunitReportersFactoryImpl
} from '../../src/junit/factory'
import { ReporterType } from '../../src/type'
import { Result } from '../../src/type'

jest.mock('../../src/junit/gotestsum', () => {
  return {
    GotestsumReportImpl: jest.fn()
  }
})
jest.mock('../../src/junit/golangcilint', () => {
  return {
    GolangCILintReportImpl: jest.fn()
  }
})

describe('JUnitReporterFactoryImpl', () => {
  const directory = 'path/to'
  const fileName = 'junit.xml'
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }

  describe('Gotestsum', () => {
    const testCases = [
      {
        name: 'should parse the junit report with empty testsuites',
        input: {
          xml: `
          <?xml version="1.0" encoding="UTF-8"?>
          <testsuites></testsuites>
          `
        },
        expected: {
          path: 'path/to',
          parsed: {
            testsuites: {}
          }
        }
      },
      {
        name: 'should parse the junit report with no testsuite',
        input: {
          xml: `
          <?xml version="1.0" encoding="UTF-8"?>
          <testsuites tests="0" failures="0" errors="0" time="0.000000">
            <testsuite tests="0" failures="0" time="0.000000" name="." timestamp="2024-10-21T18:16:20+09:00">
              <properties>
                <property name="go.version" value="go1.23.2 linux/amd64"></property>
              </properties>
            </testsuite>
          </testsuites>
          `
        },
        expected: {
          path: 'path/to',
          parsed: {
            testsuites: {
              $: {
                tests: '0',
                failures: '0',
                errors: '0',
                time: '0.000000'
              },
              testsuite: [
                {
                  $: {
                    tests: '0',
                    failures: '0',
                    time: '0.000000',
                    name: '.',
                    timestamp: '2024-10-21T18:16:20+09:00'
                  },
                  properties: [
                    {
                      property: [
                        {
                          $: {
                            name: 'go.version',
                            value: 'go1.23.2 linux/amd64'
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        }
      },
      {
        name: 'should parse the junit report with testsuite',
        input: {
          xml: `
          <?xml version="1.0" encoding="UTF-8"?>
          <testsuites tests="4" failures="2" errors="0" time="0.001000">
            <testsuite tests="2" failures="1" time="0.001000" name="foo" timestamp="2024-09-17T21:07:31+09:00">
              <properties>
                <property name="go.version" value="go1.22.1 linux/amd64"></property>
              </properties>
              <testcase classname="foo/bar" name="Test1" time="0.000000"></testcase>
              <testcase classname="foo/bar" name="Test2" time="0.000000">
                <failure message="Failed" type="">=== RUN   Test2&#xA;    baz_test.go:1: error;</failure>
              </testcase>
            </testsuite>
            <testsuite tests="2" failures="1" time="0.001000" name="foo" timestamp="2024-09-17T21:07:31+09:00">
              <properties>
                <property name="go.version" value="go1.22.1 linux/amd64"></property>
              </properties>
              <testcase classname="foo/bar" name="Test3" time="0.000000"></testcase>
              <testcase classname="foo/bar" name="Test4" time="0.000000">
                <failure message="Failed" type="">=== RUN   Test4&#xA;--- FAIL: Test4 (0.00s)&#xA;</failure>
              </testcase>
            </testsuite>
          </testsuites>
          `
        },
        expected: {
          path: 'path/to',
          parsed: {
            testsuites: {
              $: {
                tests: '4',
                failures: '2',
                errors: '0',
                time: '0.001000'
              },
              testsuite: [
                {
                  $: {
                    name: 'foo',
                    tests: '2',
                    failures: '1',
                    time: '0.001000',
                    timestamp: '2024-09-17T21:07:31+09:00'
                  },
                  properties: [
                    {
                      property: [
                        {
                          $: {
                            name: 'go.version',
                            value: 'go1.22.1 linux/amd64'
                          }
                        }
                      ]
                    }
                  ],
                  testcase: [
                    {
                      $: {
                        classname: 'foo/bar',
                        name: 'Test1',
                        time: '0.000000'
                      }
                    },
                    {
                      $: {
                        classname: 'foo/bar',
                        name: 'Test2',
                        time: '0.000000'
                      },
                      failure: [
                        {
                          $: {
                            message: 'Failed',
                            type: ''
                          },
                          _: '=== RUN   Test2\n    baz_test.go:1: error;'
                        }
                      ]
                    }
                  ]
                },
                {
                  $: {
                    tests: '2',
                    failures: '1',
                    time: '0.001000',
                    name: 'foo',
                    timestamp: '2024-09-17T21:07:31+09:00'
                  },
                  properties: [
                    {
                      property: [
                        {
                          $: {
                            name: 'go.version',
                            value: 'go1.22.1 linux/amd64'
                          }
                        }
                      ]
                    }
                  ],
                  testcase: [
                    {
                      $: {
                        classname: 'foo/bar',
                        name: 'Test3',
                        time: '0.000000'
                      }
                    },
                    {
                      $: {
                        classname: 'foo/bar',
                        name: 'Test4',
                        time: '0.000000'
                      },
                      failure: [
                        {
                          $: {
                            message: 'Failed',
                            type: ''
                          },
                          _: '=== RUN   Test4\n--- FAIL: Test4 (0.00s)\n'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    ]

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it.each(testCases)('%s', async ({ input, expected }) => {
      const { GotestsumReportImpl: gotestsumMock } = jest.requireMock(
        '../../src/junit/gotestsum'
      )
      gotestsumMock.mockReturnValue({
        context,
        path: 'path/to',
        summary: {
          result: Result.Passed,
          passed: 0,
          failed: 0,
          time: 0
        },
        failures: []
      })
      const fileReaderMock = jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValue(input.xml)
      const factory = new SingleJUnitReporterFactoryImpl(fs.promises.readFile)
      await factory.fromXml(
        context,
        ReporterType.Gotestsum,
        directory,
        fileName
      )

      expect(fileReaderMock).toHaveBeenCalledWith('path/to/junit.xml', {
        encoding: 'utf8'
      })
      expect(gotestsumMock).toHaveBeenCalledWith(expected.path, expected.parsed)
    })
  })

  describe('GolangCILint', () => {
    const testCases = [
      {
        name: 'should parse the junit report with empty testsuites',
        input: {
          xml: `
          <?xml version="1.0" encoding="UTF-8"?>
          <testsuites></testsuites>
          `
        },
        expected: {
          path: 'path/to',
          parsed: {
            testsuites: {}
          }
        }
      },
      {
        name: 'should parse the junit report with testsuites that do not have properties',
        input: {
          xml: `
          <?xml version="1.0" encoding="UTF-8"?>
          <testsuites>
            <testsuite name="go/app/foo_test.go" tests="3" errors="0" failures="3">
              <testcase name="errcheck" classname="go/app/foo_test.go:12:34">
                <failure message="go/app/foo_test.go:39:21: Error" type=""><![CDATA[: Error
Category: errcheck
File: go/app/foo_test.go
Line: 12
Details: Foo]]></failure>
              </testcase>
            </testsuite>
            <testsuite name="go/app/bar_test.go" tests="2" errors="0" failures="2">
              <testcase name="errcheck" classname="go/app/bar_test.go:56:78">
                <failure message="go/app/bar_test.go:56:78: Error" type=""><![CDATA[: Error
Category: errcheck
File: go/app/bar_test.go
Line: 56
Details: Bar]]></failure>
              </testcase>
            </testsuite>
          </testsuites>
          `
        },
        expected: {
          path: 'path/to',
          parsed: {
            testsuites: {
              testsuite: [
                {
                  $: {
                    name: 'go/app/foo_test.go',
                    tests: '3',
                    errors: '0',
                    failures: '3'
                  },
                  testcase: [
                    {
                      $: {
                        classname: 'go/app/foo_test.go:12:34',
                        name: 'errcheck'
                      },
                      failure: [
                        {
                          $: {
                            message: 'go/app/foo_test.go:39:21: Error',
                            type: ''
                          },
                          _: ': Error\nCategory: errcheck\nFile: go/app/foo_test.go\nLine: 12\nDetails: Foo'
                        }
                      ]
                    }
                  ]
                },
                {
                  $: {
                    name: 'go/app/bar_test.go',
                    tests: '2',
                    errors: '0',
                    failures: '2'
                  },
                  testcase: [
                    {
                      $: {
                        classname: 'go/app/bar_test.go:56:78',
                        name: 'errcheck'
                      },
                      failure: [
                        {
                          $: {
                            message: 'go/app/bar_test.go:56:78: Error',
                            type: ''
                          },
                          _: ': Error\nCategory: errcheck\nFile: go/app/bar_test.go\nLine: 56\nDetails: Bar'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    ]

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it.each(testCases)('%s', async ({ input, expected }) => {
      const { GolangCILintReportImpl: golangCILintMock } = jest.requireMock(
        '../../src/junit/golangcilint'
      )
      golangCILintMock.mockReturnValue({
        context,
        path: 'path/to',
        summary: {
          result: Result.Passed
        },
        failures: []
      })
      const fileReaderMock = jest
        .spyOn(fs.promises, 'readFile')
        .mockResolvedValue(input.xml)
      const factory = new SingleJUnitReporterFactoryImpl(fs.promises.readFile)
      await factory.fromXml(
        context,
        ReporterType.GolangCILint,
        directory,
        fileName
      )

      expect(fileReaderMock).toHaveBeenCalledWith('path/to/junit.xml', {
        encoding: 'utf8'
      })
      expect(golangCILintMock).toHaveBeenCalledWith(
        expected.path,
        expected.parsed
      )
    })
  })
})

// TODO: use mock
describe('MultiJunitReportersFactory', () => {
  const context = {
    owner: 'owner',
    repo: 'repo',
    sha: 'sha'
  }
  const testCases = [
    {
      name: 'should create empty arrays',
      input: {
        testDirectories: [],
        lintDirectories: [],
        testReportXml: 'test.xml',
        lintReportXml: 'lint.xml'
      },
      expected: {
        tests: 0,
        lints: 0,
        called: 0
      }
    },
    {
      name: 'should create tests and lints',
      input: {
        testDirectories: ['path/to'],
        lintDirectories: ['path/to'],
        testReportXml: 'test.xml',
        lintReportXml: 'lint.xml'
      },
      expected: {
        tests: 1,
        lints: 1,
        called: 2
      }
    },
    {
      name: 'should create tests',
      input: {
        testDirectories: ['path/to'],
        lintDirectories: [],
        testReportXml: 'test.xml',
        lintReportXml: 'lint.xml'
      },
      expected: {
        tests: 1,
        lints: 0,
        called: 1
      }
    },
    {
      name: 'should create lints',
      input: {
        testDirectories: [],
        lintDirectories: ['path/to'],
        testReportXml: 'test.xml',
        lintReportXml: 'lint.xml'
      },
      expected: {
        tests: 0,
        lints: 1,
        called: 1
      }
    }
  ]

  it.each(testCases)('%s', async ({ input, expected }) => {
    const fromXmlMock = jest
      .spyOn(SingleJUnitReporterFactoryImpl.prototype, 'fromXml')
      .mockResolvedValue({
        path: 'path/to/junit.xml',
        summary: {
          result: Result.Passed
        },
        failures: []
      })
    const singleFactory = new SingleJUnitReporterFactoryImpl(
      fs.promises.readFile
    )
    const multiFactory = new MultiJunitReportersFactoryImpl(singleFactory)
    const report = await multiFactory.fromXml(
      context,
      input.testDirectories,
      input.lintDirectories,
      input.testReportXml,
      input.lintReportXml
    )
    expect(report[0].length).toEqual(expected.tests)
    expect(report[1].length).toEqual(expected.lints)
    expect(fromXmlMock).toHaveBeenCalledTimes(expected.called)
  })
})
