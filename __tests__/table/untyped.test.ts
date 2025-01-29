import { UntypedTable } from "../../src/table/untyped"

describe('UntypedTable#new', () => {
  const testCases = [
    {
      name: 'should throw error when header length is not equal to separator length',
      input: {
        header: {
          index: "H",
          values: ["F1", "F2"]
        },
        separator: {
          index: "-",
          values: ["-"]
        },
        values: [
          {
            index: "R1",
            values: ["V11", "V12"]
          }
        ]
      }
    },
    {
      name: 'should throw error when values length is not equal to header length',
      input: {
        header: {
          index: "H",
          values: ["F1", "F2"]
        },
        separator: {
          index: "-",
          values: ["-", "-"]
        },
        values: [
          {
            index: "R1",
            values: ["V11"]
          }
        ]
      }
    }
  ]

  it.each(testCases)('%s', ({ input }) => {
    expect(() => new UntypedTable(input.header, input.separator, input.values))
  })
})

describe('UntypedTable#shape', () => {
  const testCases = [
    {
      name: 'should return a table',
      input: {
          header: {
            index: "H",
            values: ["F1", "F2"]
          },
          separator: {
            index: "-",
            values: ["-", "-"]
          },
          values: [
            {
              index: "R1",
              values: ["V11", "V12"]
            },
            {
              index: "R2",
              values: ["V21", "V22"]
            }
          ]
    },
    expected: {
        rows: 2,
        columns: 2,
      }
    }
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
    const table = new UntypedTable(input.header, input.separator, input.values)
    expect(table.columns).toEqual(expected.columns)
    expect(table.rows).toEqual(expected.rows)
  })
})

describe('UntypedTable#toString', () => {
    const testCases = [
      {
        name: 'should return an empty string',
        input: {
            header: {
              index: "H",
              values: ["F1", "F2"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: []
        },
        expected: ''
      },
      {
        name: 'should return a table in string',
        input: {
            header: {
              index: "H",
              values: ["F1", "F2"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: [
              {
                index: "R1",
                values: ["V11", undefined]
              }
            ]
        },
        expected: `
| H | F1 | F2 |
| - | - | - |
| R1 | V11 | - |
`.slice(1, -1)
      },
  ]

  it.each(testCases)('%s', ({ input, expected }) => {
      const table = new UntypedTable(input.header, input.separator, input.values)
      expect(table.toString()).toEqual(expected)
  })
})

