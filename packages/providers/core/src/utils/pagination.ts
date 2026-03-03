import { PaginationOptions, PaginatedResult } from "@/types/models";

export function buildCursorPagination<T extends { id: string }, U>(
  items: T[],
  hasMore: boolean,
  pagination: PaginationOptions,
  mapperFn: (item: T) => U,
): PaginatedResult<U> {
  return {
    data: items.map(mapperFn),
    hasMore,
    nextCursor: items.at(-1)?.id,
    hasPrevious:
      !!pagination.startingAfter || (!!pagination.endingBefore && hasMore),
    previousCursor: items.at(0)?.id,
  };
}

export function buildPagePagination<T, U>(
  items: T[],
  targetPage: number,
  maxPage: number,
  mapperFn: (item: T) => U,
): PaginatedResult<U> {
  return {
    data: items.map(mapperFn),
    hasMore: targetPage < maxPage,
    nextCursor: targetPage < maxPage ? (targetPage + 1).toString() : undefined,
    hasPrevious: targetPage > 1,
    previousCursor: targetPage > 1 ? (targetPage - 1).toString() : undefined,
  };
}
