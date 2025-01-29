import { Table } from "../../src/table/typed"

type TestRecord = {
  f1: string | undefined
  f2: string | undefined
}

const header = {
  index: "H",
  values: {
    f1: "F1",
    f2: "F2",
  }
}

const separator = {
  index: "-",
  values: {
    f1: "-",
    f2: "-",
  }
}

describe('Table#shape', () => {
  const testCases = [
    {
      name: 'should return a table',
      input: [
        {
          index: "R1",
          values: {
            f1: "V11",
            f2: "V12",
          }
        },
        {
          index: "R2",
          values: {
            f1: "V21",
            f2: "V22",
          }
        },
        {
          index: "R3",
          values: {
            f1: "V31",
            f2: "V32",
          }
        }
      ],
      expected: {
        rows: 3,
        columns: 2,
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const table = new Table<TestRecord>(header, separator, input)
    expect(table.columns).toEqual(expected.columns)
    expect(table.rows).toEqual(expected.rows)
  })
})

describe('Table#concat', () => {
    const testCases = [
      {
        name: 'should concat tables',
        input: {
          table1: [
            {
              index: "R1",
            values: {
              f1: "V11",
              f2: "V12",
            }
          },
          {
            index: "R2",
            values: {
              f1: "V21",
              f2: "V22",
            }
          }
        ],
        table2: [
          {
            index: "R3",
            values: {
              f1: "V31",
              f2: "V32",
            }
          }
        ]
      },
        expected: {
          rows: 3,
          columns: 2,
        }
      },
      {
        name: 'should concat table with empty table',
        input: {
          table1: [
            {
              index: "R1",
            values: {
              f1: "V11",
              f2: "V12",
            }
          },
          {
            index: "R2",
            values: {
              f1: "V21",
              f2: "V22",
            }
          }
        ],
        table2: []
      },
        expected: {
          rows: 2,
          columns: 2,
        }
      },
      {
        name: 'should concat empty table with table',
        input: {
          table1: [],
          table2: [
            {
              index: "R1",
            values: {
              f1: "V11",
              f2: "V12",
            }
          },
          {
            index: "R2",
            values: {
              f1: "V21",
              f2: "V22",
            }
          }
        ],
      },
        expected: {
          rows: 2,
          columns: 2,
        }
      },
      {
        name: 'should concat empty table with empty table',
        input: {
          table1: [],
          table2: []
      },
        expected: {
          rows: 2,
          columns: 2,
        }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
      const base = new Table<TestRecord>(header, separator, input.table1)
      const concatenated = base.concat(new Table<TestRecord>(header, separator, input.table2))
      expect(concatenated.columns).toEqual(expected.columns)
      expect(concatenated.rows).toEqual(expected.rows)
  })
})

describe('Table#toUntyped', () => {
  const testCases = [
    {
      name: 'should return an untyped table',
      input: [
        {
          index: "R1",
          values: {
            f1: "V11",
            f2: "V12",
          }
        },
        {
          index: "R2",
          values: {
            f1: "V21",
            f2: "V22",
          }
        },
      ],
      expected: {
        columns: 2,
        rows: 2,
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const table = new Table<TestRecord>(header, separator, input)
    expect(table.toUntyped().columns).toEqual(expected.columns)
    expect(table.toUntyped().rows).toEqual(expected.rows)
  })
})
