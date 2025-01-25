import {
  FailureRecord,
  GolangCILintSummaryReport,
  FailureReport
} from '../report/type'
import { GotestsumSummaryReport } from '../report/type'
import { Table } from '../table/typed'
import { UntypedTable } from '../table/untyped'

export interface TableComposer {
  toGotestsumTable(
    reports: GotestsumSummaryReport[]
  ): UntypedTable
  toGolangCILintTable(
    reports: GolangCILintSummaryReport[]
  ): UntypedTable
  toFailuresTable(
    reports: FailureReport[],
    limit?: number
  ): Table<FailureRecord>
}

export class TableComposerImpl implements TableComposer {
  toGotestsumTable(
    reports: GotestsumSummaryReport[]
  ): UntypedTable {
    return new UntypedTable(
      {
        index: 'Module',
        values: ['Version', 'Test', 'Passed', 'Failed', 'Time']
      },
      {
        index: ':-----',
        values: ['------:', ':---', '-----:', '-----:', '---:']
      },
      reports.map(report => ({
        index: report.index,
        values: [report.record.version, report.record.result, report.record.passed, report.record.failed, report.record.time]
      }))
    )
  }

  toGolangCILintTable(
    reports: GolangCILintSummaryReport[]
  ): UntypedTable {
    return new UntypedTable(
      {
        index: 'Module',
        values: ['Lint']
      },
      {
        index: ':-----',
        values: [':---']
      },
      reports.map(report => ({
        index: report.index,
        values: [report.record.result]
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
