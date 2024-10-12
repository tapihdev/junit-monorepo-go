/**
 * Types to parse JUnit XML reports
 */
import * as fs from 'fs'
import { parseStringPromise } from 'xml2js'

export async function parseJunitReport(path: string): Promise<JunitReport> {
  const content = await fs.promises.readFile(path, { encoding: 'utf8' })
  return (await parseStringPromise(content)) as JunitReport
}

export type JunitReport = {
  testsuites: TestSuites
}

type TestSuites = {
  $?: {
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
    time?: string
    timestamp?: Date
  }
  testcase?: TestCase[]
  properties?: Property[]
}

type Property = {
  property: {
    $: {
      name: string
      value: string
    }[]
  }
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
