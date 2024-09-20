import * as fs from 'fs'
import { parseStringPromise } from 'xml2js'

export interface JunitReport {
  testsuites: TestSuites
}

export interface TestSuites {
  $: {
    time: string
  }
  testsuite?: TestSuite[]
}

export interface TestSuite {
  $: {
    name: string
    tests: string
    errors: string
    failures: string
    skipped: string
    time: string
    timestamp?: Date
  }
  testcase?: TestCase[]
}

export interface TestCase {
  $: {
    classname: string
    file?: string
    name: string
    time: string
  }
  failure?: string[]
  skipped?: string[]
}

type TestResult = 'passed' | 'failed' | 'skipped'

class _JunitReport {
  public static async fromXml(path: string): Promise<JunitReport> {
    const content = await fs.promises.readFile(path, {encoding: 'utf8'})
    return await parseStringPromise(content) as JunitReport
  }

  get result(): TestResult {
    return 'passed'
  }

  get numPassed(): number {
    return 0
  }

  get numFailed(): number {
    return 0
  }

  get numSkipped(): number {
    return 0
  }

  get elapsedSeconds(): number {
    return 0
  }

  get failedTestCases(): TestCase[] {
    return []
  }
}

class _TestSuite {
  get failedTestCases(): TestCase[] {
    return []
  }
}