import * as github from '@actions/github'

import { Client as GitHubClient } from '../src/github'

const listCommentsMock = jest.fn()
const updateCommentMock = jest.fn()
const createCommentMock = jest.fn()
const paginateMock = jest.fn()

describe('github', () => {
  beforeEach(() => {
    jest.spyOn(github, 'getOctokit').mockReturnValue({
      rest: {
        issues: {
          listComments: listCommentsMock,
          updateComment: updateCommentMock,
          createComment: createCommentMock
        }
      },
      paginate: paginateMock.mockImplementation(
        async (fn, args) => await fn(args)
      )
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('creates a comment', async () => {
    const client = new GitHubClient(github.getOctokit('token'))
    listCommentsMock.mockResolvedValueOnce([])
    createCommentMock.mockResolvedValueOnce({ data: { id: 123 } })
    const output = await client.upsertComment({
      owner: 'owner',
      repo: 'repo',
      pullNumber: 123,
      mark: 'mark',
      body: 'body'
    })

    expect(output).toEqual({ updated: false, id: 123 })
    expect(createCommentMock).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      issue_number: 123,
      body: 'mark\nbody'
    })
  })

  it('updates a comment', async () => {
    const client = new GitHubClient(github.getOctokit('token'))
    listCommentsMock.mockResolvedValueOnce([
      { id: 123, body: 'mark\nold body' }
    ])
    updateCommentMock.mockResolvedValueOnce({ data: { id: 123 } })

    const output = await client.upsertComment({
      owner: 'owner',
      repo: 'repo',
      pullNumber: 123,
      mark: 'mark',
      body: 'new body'
    })

    expect(output).toEqual({ updated: true, id: 123 })
    expect(updateCommentMock).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      comment_id: 123,
      body: 'mark\nnew body'
    })
  })
})
