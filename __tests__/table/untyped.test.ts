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
    expect(() => new UntypedTable(input.header, input.separator, input.values)).toThrow()
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

describe('UntypedTable#join', () => {
  const testCases = [
    {
      name: 'should join 2 tables with left join',
      input: {
        main: {
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
        others: [
          {
          header: {
            index: "H",
            values: ["F3", "F4"]
          },
          separator: {
            index: "-",
            values: ["-", "-"]
          },
          values: [
            {
              index: "R1",
              values: ["V13", "V14"]
            },
            {
              index: "R3",
              values: ["V33", "V34"]
            }
          ]
        }
      ]
      },
      expected: {
        header: {
          index: "H",
          values: ["F1", "F2", "F3", "F4"]
        },
        separator: {
          index: "-",
          values: ["-", "-", "-", "-"]
        },
        values: [
          {
            index: "R1",
            values: ["V11", "V12", "V13", "V14"]
          },
          {
            index: "R2",
            values: ["V21", "V22", undefined, undefined]
          }
        ]
      }
    },
      {
        name: 'should join 3 tables with left join',
        input: {
          main: {
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
          others: [
            {
            header: {
              index: "H",
              values: ["F3", "F4"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: [
              {
                index: "R1",
                values: ["V13", "V14"]
              },
              {
                index: "R3",
                values: ["V33", "V34"]
              }
            ]
          },
          {
            header: {
              index: "H",
              values: ["F5", "F6"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: [
              {
                index: "R1",
                values: ["V13", "V14"]
              },
              {
                index: "R2",
                values: ["V33", "V34"]
              }
            ]
          }
        ]
        },
        expected: {
          header: {
            index: "H",
            values: ["F1", "F2", "F3", "F4", "F5", "F6"]
          },
          separator: {
            index: "-",
            values: ["-", "-", "-", "-", "-", "-"]
          },
          values: [
            {
              index: "R1",
              values: ["V11", "V12", "V13", "V14", "V13", "V14"]
            },
            {
              index: "R2",
              values: ["V21", "V22", undefined, undefined, "V33", "V34"]
            }
          ]
      }
    },
      {
        name: 'should join 2 tables the second one of which has no records',
        input: {
          main: {
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
          others: [
            {
            header: {
              index: "H",
              values: ["F3", "F4"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: []
          }
        ],
      },
        expected: {
          header: {
            index: "H",
            values: ["F1", "F2", "F3", "F4"]
          },
          separator: {
            index: "-",
            values: ["-", "-", "-", "-"]
          },
          values: [
            {
              index: "R1",
              values: ["V11", "V12", undefined, undefined]
            },
            {
              index: "R2",
              values: ["V21", "V22", undefined, undefined]
            }
          ]
        },
      },
      {
        name: 'should join 2 tables the first one of which has no records',
        input: {
          main: {
            header: {
              index: "H",
              values: ["F1", "F2"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: [
            ]
          },
          others: [
            {
            header: {
              index: "H",
              values: ["F3", "F4"]
            },
            separator: {
              index: "-",
              values: ["-", "-"]
            },
            values: [
              {
                index: "R1",
                values: ["V13", "V14"]
              },
              {
                index: "R3",
                values: ["V33", "V34"]
              }
            ]
          }
        ],
      },
        expected: {
          header: {
            index: "H",
            values: ["F1", "F2", "F3", "F4"]
          },
          separator: {
            index: "-",
            values: ["-", "-", "-", "-"]
          },
          values: [
          ]
        },
      }]

  it.each(testCases)('%s', ({ input, expected }) => {
    const main = new UntypedTable(input.main.header, input.main.separator, input.main.values)
    const others = input.others.map(o => new UntypedTable(o.header, o.separator, o.values))
    const table = main.join(others)
    expect(table.header).toEqual(expected.header)
    expect(table.separator).toEqual(expected.separator)
    expect(table.records).toEqual(expected.values)
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

