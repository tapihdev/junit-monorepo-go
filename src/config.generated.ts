import { z } from 'zod'

export const ConfigSchema = z.record(
  z
    .object({
      annotationLimit: z
        .number()
        .gte(0)
        .describe('Limit number of annotations of failed tests.')
        .optional(),
      directories: z
        .array(z.string())
        .describe('Directories to search for JUnit reports.'),
      fileName: z.string().describe('File name of JUnit report.'),
      title: z.string().describe('Title of column.'),
      type: z
        .enum(['gotestsum', 'golangci-lint'])
        .describe('Type of JUnit reporter.')
    })
    .strict()
)
export type Config = z.infer<typeof ConfigSchema>
