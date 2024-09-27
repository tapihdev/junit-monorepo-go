/**
 * Types to parse JUnit XML reports
 */
export type JunitReport = {
  testsuites: TestSuites
}

type TestSuites = {
  $: {
    tests: string
    errors: string
    failures: string
    skipped?: string
    time: string
  }
  testsuite?: TestSuite[]
}

type TestSuite = {
  $: {
    name: string
    tests: string
    errors: string
    failures: string
    skipped?: string
    time: string
    timestamp?: Date
  }
  testcase?: TestCase[]
}

type TestCase = {
  $: {
    classname: string
    file?: string
    name: string
    time: string
  }
  failure?: Test[]
  skipped?: Test[]
}

type Test = {
  $: {
    message: string
    type: string
  }
  _?: string
}
