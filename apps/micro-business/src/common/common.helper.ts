import { PatternMapper } from './common.interface'

interface IPattern {
  type: string,
  pattern: string,
  ch?: string
}

export function getPattern(pattern: PatternMapper) {
  // TODO NOW SUPPOER ONLY DATE AND RUNNING PATTERN 
  const result: IPattern[] = []
  for (const key in pattern) {
    const value = pattern[key]
    if(value.includes('date')) {
      result.push(getDatePattern(value))
    } else if(value.includes('running')) {
      result.push(getRunningPattern(value))
    }
  }

  return result
}

function getDatePattern(pattern: string): IPattern {
  let datePattern = ''
  const MATCH_INSIDE_PARENTHESES = /(?<=\(['"]).*?(?=['"]\))/
  datePattern = pattern.match(MATCH_INSIDE_PARENTHESES)[0]

  return {
    type: 'date',
    pattern: datePattern,
  }
}

function getRunningPattern(pattern: string): IPattern {
  const RUNNING_PATTERN = /\((\d+),(.*?)\)/
  const match = pattern.match(RUNNING_PATTERN)
  const [, running, setChar] = match

  return {
    type: 'running',
    pattern: running,
    ch: setChar
  }
}