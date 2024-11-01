import * as fs from 'fs'
import { parseStringPromise } from 'xml2js'

export async function parseJUnitReport(path: string): Promise<JUnitReport> {
  const content = await fs.promises.readFile(path, { encoding: 'utf8' })
  return (await parseStringPromise(content)) as JUnitReport
}

export type JUnitReport = {
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
    errors?: string
    failures: string
    skipped?: string
    time?: string
    timestamp?: string
  }
  testcase?: TestCase[]
  properties?: Property[]
}

type Property = {
  property: [
    {
      $: {
        name: string
        value: string
      }
    }
  ]
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
