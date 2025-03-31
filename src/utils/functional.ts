export const nullMap = <T, Res>(value: T | null | undefined, mapper: (value: T) => Res): Res | null | undefined =>
  value === null || value === undefined ? value as null | undefined : mapper(value);