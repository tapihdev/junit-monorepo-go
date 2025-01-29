import { Result } from "../../src/type"
import { Table } from "../../src/table/typed"
import { GotestsumSummaryRecord } from "../../src/report/type"
import { ReportAggregator } from "../../src/composer/result"

describe('TableSetFactory#single', () => {
  const toResultMock = jest.spyOn(ReportAggregator.prototype, 'toResult').mockReturnValue(Result.Passed)
  const toAnnotationsMock = jest.spyOn(ReportAggregator.prototype, 'toAnnotations').mockReturnValue(["a", "b"])
  const toGotestsumTableMock = jest.spyOn(ReportAggregator.prototype, 'toGotestsumTable').mockReturnValue(new Table<GotestsumSummaryRecord>(
    {
      index: "",
      values: {
        version: "1.0.0",
        result: Result.Passed,
        passed: "1",
        failed: "0",
        time: "1.0",
      }
    },
    {
      version: "1.0.0",
      result: Result.Passed,
      passed: "1",
      failed: "0",
      time: "1.0",
    },
  [
      {
        version: "1.0.0",
        result: Result.Passed,
        passed: "1",
        failed: "0",
        time: "1.0",
      }
    ],
  ))

  const factory = new TableSetFactory()

})

describe('TableSetFactory#multi', () => {

})