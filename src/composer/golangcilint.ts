import { Table } from '../table/typed'
import {
  GolangCILintSummaryReport,
  GolangCILintSummaryRecord
} from '../report/type'

export class GolangCILintTable {
  private _table: Table<GolangCILintSummaryRecord>

  constructor(reports: GolangCILintSummaryReport[]) {
    this._table = new Table(
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

  toTable(): Table<GolangCILintSummaryRecord> {
    return this._table
  }
}
