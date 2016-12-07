declare module 'code-point-at' {
  interface charPointAtFunc {
    (str: string, pos: number): number,
  }
  const charPointAt: charPointAtFunc
  export = charPointAt
}