import { Module } from './module'

import { AnyRecord, ModuleTableRecord, FailedCaseTableRecord } from './type'

export type MarkdownContext = {
  owner: string
  repo: string
  sha: string
}

function renderTable<T extends AnyRecord>(
  header: T,
  separator: T,
  records: T[]
): string {
  if (records.length === 0) {
    return ''
  }

  return [
    `| ${Object.values(header).join(' | ')} |`,
    `| ${Object.values(separator).join(' | ')} |`,
    ...records.map(r => `| ${Object.values(r).join(' | ')} |`)
  ].join('\n')
}

export function createModuleTable(modules: ModuleTableRecord[]) {
  return renderTable(
    {
      name: 'Module',
      version: 'Version',
      testResult: 'Test',
      testPassed: 'Passed',
      testFailed: 'Failed',
      testElapsed: 'Time',
      lintResult: 'Lint'
    },
    {
      name: ':-----',
      version: '------:',
      testResult: ':---',
      testPassed: '-----:',
      testFailed: '-----:',
      testElapsed: '---:',
      lintResult: ':---'
    },
    modules,
  )
}

export function createFailedCaseTable(
  failed: FailedCaseTableRecord[],
  limit: number
) {
  const failedLimited = failed.slice(0, limit)
  if (failed.length > limit) {
    failedLimited.push({
      file: `:warning: and ${failed.length - limit} more...`,
      test: '-',
      message: '-'
    })
  }
  return renderTable(
    { file: 'File', test: 'Test', message: 'Message' },
    { file: ':---', test: ':---', message: ':------' },
    failedLimited
  )
}
