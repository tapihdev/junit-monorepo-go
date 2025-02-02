import { Table } from './base/typed'
import { Align } from './base/type'
import {
  ReportableGolangCILintSummary,
  GolangCILintSummaryRecord
} from '../report/type'

export class GolangCILintTable {
  private _table: Table<GolangCILintSummaryRecord>

  constructor(title: string, reports: ReportableGolangCILintSummary[]) {
    this._table = new Table(
      {
        index: 'Module',
        values: {
          result: title
        }
      },
      {
        index: Align.Left,
        values: {
          result: Align.Left
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
