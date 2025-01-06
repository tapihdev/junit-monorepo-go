export type Config = ConfigItem[]

export type ConfigItem = {
  /**
   * The title of the column.
   *
   * @TJS-type string
   */
  title: string

  /**
   * The type of the column.
   *
   * @TJS-type string
   */
  type: ConfigItemType

  /**
   * The directories to search for the reports.
   *
   * @TJS-type string[]
   */
  directories: string[]

  /**
   * The file name of the JUnit report.
   *
   * @TJS-type string
   */
  fileName: string

  /**
   * The limit number of annotations for failed tests.
   *
   * @TJS-type integer
   */
  annotationLimit?: number
}

export type ConfigItemType = 'gotestsum' | 'golangci-lint'
