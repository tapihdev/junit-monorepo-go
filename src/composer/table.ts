import {
  GotestsumSummaryRecord,
  GolangCILintSummaryRecord,
  FailureRecord,
  GolangCILintSummaryReport,
  FailureReport
} from '../report/type'
import { Table } from '../table'
import { GotestsumSummaryReport } from '../report/type'

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
    return new Table<GotestsumSummaryRecord>(
      {
        index: 'Module',
        record: {
          version: 'Version',
          result: 'Test',
          passed: 'Passed',
          failed: 'Failed',
          time: 'Time'
        }
      },
      {
        index: ':-----',
        record: {
          version: '------:',
          result: ':---',
          passed: '-----:',
          failed: '-----:',
          time: '---:'
        }
      },
      reports.map(report => ({
        index: report.index,
        record: report.record
      }))
    )
  }

  toGolangCILintTable(
    reports: GolangCILintSummaryReport[]
  ): Table<GolangCILintSummaryRecord> {
    return new Table(
      {
        index: 'Module',
        record: {
          result: 'Lint'
        }
      },
      {
        index: ':-----',
        record: {
          result: ':---'
        }
      },
      reports.map(report => ({
        index: report.index,
        record: report.record
      }))
    )
  }

  toFailuresTable(reports: FailureReport[], limit = 10): Table<FailureRecord> {
    const limited = reports.slice(0, limit).map(report => ({
      index: report.index,
      record: report.record
    }))
    if (reports.length > limit) {
      limited.push({
        index: '-',
        record: {
          type: '-',
          test: '-',
          message: `:warning: and ${reports.length - limit} more...`
        }
      })
    }
    return new Table(
      {
        index: 'File',
        record: {
          type: 'Type',
          test: 'Case',
          message: 'Message'
        }
      },
      {
        index: ':---',
        record: {
          type: ':---',
          test: ':---',
          message: ':------'
        }
      },
      limited
    )
  }
}
