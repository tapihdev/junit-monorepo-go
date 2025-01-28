import { Table } from '../table/typed'
import {
  FailureReport,
  GolangCILintSummaryReport,
  GotestsumSummaryReport,
  FailureRecord,
  GotestsumSummaryRecord,
  GolangCILintSummaryRecord
} from '../report/type'

export interface TableComposer {
  toGotestsumTable(
    reports: GotestsumSummaryReport[]
  ): Table<GotestsumSummaryRecord>
  toGolangCILintTable(
    reports: GolangCILintSummaryReport[]
  ): Table<GolangCILintSummaryRecord>
  toFailuresTable(
    reports: FailureReport[],
    limit?: number
  ): Table<FailureRecord>
}

export class TableComposerImpl implements TableComposer {
  toGotestsumTable(
    reports: GotestsumSummaryReport[]
  ): Table<GotestsumSummaryRecord> {
    return new Table(
      {
        index: 'Module',
        values: {
          version: 'Version',
          result: 'Result',
          passed: 'Passed',
          failed: 'Failed',
          time: 'Time'
        }
      },
      {
        index: ':-----',
        values: {
          version: '------:',
          result: ':---',
          passed: '-----:',
          failed: '-----:',
          time: '---:'
        }
      },
      reports.map(report => ({
        index: report.index,
        values: report.record
      }))
    )
  }

  toGolangCILintTable(
    reports: GolangCILintSummaryReport[]
  ): Table<GolangCILintSummaryRecord> {
    return new Table(
      {
        index: 'Module',
        values: {
          result: 'Result'
        }
      },
      {
        index: ':-----',
        values: {
          result: ':---'
        }
      },
      reports.map(report => ({
        index: report.index,
        values: report.record
      }))
    )
  }

  toFailuresTable(reports: FailureReport[], limit = 10): Table<FailureRecord> {
    const limited = reports.slice(0, limit).map(report => ({
      index: report.index,
      values: report.record
    }))
    if (reports.length > limit) {
      limited.push({
        index: '-',
        values: {
          type: '-',
          test: '-',
          message: `:warning: and ${reports.length - limit} more...`
        }
      })
    }
    return new Table(
      {
        index: 'File',
        values: {
          type: 'Type',
          test: 'Case',
          message: 'Message'
        }
      },
      {
        index: ':---',
        values: {
          type: ':---',
          test: ':---',
          message: ':------'
        }
      },
      limited
    )
  }
}
