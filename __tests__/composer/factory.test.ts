import { Result } from "../../src/type"
import { Table } from "../../src/table/typed"
import { GotestsumTable } from "../../src/composer/gotestsum"

describe('TableSetFactory#single', () => {
  const gotestsumTableMock = jest.spyOn(GotestsumTable.prototype, 'toTable').mockReturnValue()
  const golangCILintTableMock = jest.spyOn(GolangCILintTable.prototype, 'toTable').mockReturnValue()
  const failureTableMock = jest.spyOn(FailureTable.prototype, 'toTable').mockReturnValue()

  const factory = new TableSetFactory()

})

describe('TableSetFactory#multi', () => {

})