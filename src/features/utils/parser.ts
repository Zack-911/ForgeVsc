export interface ParsedFunction {
  name: string
  insides: (string | (string | ParsedFunction)[] | ParsedFunction)[]
  silent: boolean
  negation: boolean
  separator: string | null
  argCount: number
  raw: string
  hasBrackets: boolean
  rangeInBlock: { start: number, end: number }
  escaped: boolean
}

export function parseExpression(input: string): ParsedFunction[] {
  let i = 0

  function isEscaped(index: number) {
    let backslashes = 0
    while (index > 0 && input[--index] === '\\') backslashes++
    return backslashes % 2 === 1
  }

  function parseModifiers() {
    let silent = false, negation = false
    while (i < input.length) {
      if (input[i] === '!') silent = true
      else if (input[i] === '@') negation = true
      else break
      i++
    }
    return { silent, negation }
  }

  function parseSeparator() {
    if (input[i] === '[') {
      i++
      let sep = ''
      while (i < input.length && input[i] !== ']') sep += input[i++]
      if (input[i] !== ']') throw new Error(`Expected ']' for separator at pos ${i}`)
      i++
      return sep
    }
    return null
  }

  function parseFunction(): ParsedFunction {
    const escaped = isEscaped(i)
    const rawStart = i
    if (escaped) i++
    if (input[i] !== '$') throw new Error(`Expected '$' at pos ${i}`)
    i++

    const { silent, negation } = parseModifiers()
    const separator = parseSeparator()

    let name = ''
    while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) name += input[i++]
    if (name === '') throw new Error(`Expected function name at pos ${i}`)

    const isEscapedFunction = name === "esc" || name === "escapeCode"

    if (input[i] !== '[') {
      const raw = input.slice(rawStart, i)
      return {
        name,
        insides: [],
        silent,
        negation,
        separator,
        argCount: 0,
        raw,
        hasBrackets: false,
        rangeInBlock: { start: rawStart, end: i },
        escaped
      }
    }

    i++
    const insides = parseArguments(isEscapedFunction)
    if (input[i] !== ']') throw new Error(`Expected ']' to close function '${name}' at pos ${i}`)
    i++

    const rawEnd = i
    const raw = input.slice(rawStart, rawEnd)

    return {
      name,
      insides,
      silent,
      negation,
      separator,
      argCount: insides.length,
      raw,
      hasBrackets: true,
      rangeInBlock: { start: rawStart, end: rawEnd },
      escaped
    }
  }

  function parseArguments(rawMode = false) {
    if (rawMode) {
      let raw = ''
      let depth = 1
      while (i < input.length) {
        const char = input[i]
        if (char === '[' && !isEscaped(i)) depth++
        else if (char === ']' && !isEscaped(i)) {
          depth--
          if (depth === 0) break
        }
        raw += input[i++]
      }
      return [raw]
    }

    const args = []
    let current: (string | ParsedFunction)[] = []
    let currentStr = ''
    let depth = 0

    while (i < input.length) {
      const char = input[i]
      const escaped = isEscaped(i)

      if (!escaped && char === '$' && depth === 0) {
        if (currentStr.trim()) current.push(currentStr.trim())
        currentStr = ''
        current.push(parseFunction())
      } else if (!escaped && char === '[') {
        depth++
        currentStr += input[i++]
      } else if (!escaped && char === ']') {
        if (depth === 0) break
        depth--
        currentStr += input[i++]
      } else if (!escaped && char === ';' && depth === 0) {
        if (currentStr.trim()) current.push(currentStr.trim())
        args.push(current.length === 1 ? current[0] : current)
        currentStr = ''
        current = []
        i++
      } else {
        currentStr += input[i++]
      }
    }

    if (currentStr.trim()) current.push(currentStr.trim())
    if (current.length > 0) args.push(current.length === 1 ? current[0] : current)
    return args
  }

  const result: ParsedFunction[] = []
    while (i < input.length) {
      if (input[i] === '\\' && input[i + 1] === '$') {
        i++
      }
    
      if (input[i] === '$' && input[i + 1] === '{') {
        i += 2
        let braceDepth = 1
        while (i < input.length && braceDepth > 0) {
          if (input[i] === '{') braceDepth++
          else if (input[i] === '}') braceDepth--
          i++
        }
        continue
      }
    
      if (input[i] === '$') result.push(parseFunction())
      else i++
    }
  console.log(JSON.stringify(result,undefined,2))
  return result
}