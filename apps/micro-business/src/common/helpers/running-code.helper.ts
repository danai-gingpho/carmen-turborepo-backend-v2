import { PatternMapper } from '../common.interface';

export const GenerateCode = (formatObj, date = null, last_no = null) => {
  // Validate formatObj
  if (!formatObj || typeof formatObj !== 'object') {
    throw new Error('Invalid format object provided to GenerateCode');
  }

  if (!formatObj.format) {
    throw new Error('Format string is missing in format object');
  }

  // Process the format string and replace the placeholders
  let result = formatObj.format;

  // Process each key in the format object
  for (const key in formatObj) {
    if (key === 'format') continue;

    const value = formatObj[key];
    let replacement = '';

    // Check if value is a string or a function call
    if (typeof value === 'string') {
      if (value.startsWith('now(')) {
        // Handle now() function - current date
        const formatPattern = value.match(/now\('(.+)'\)/)[1];
        replacement = formatDate(new Date(), formatPattern);
      } else if (value.startsWith('date(')) {
        // Handle date() function - provided date
        const formatPattern = value.match(/date\('(.+)'\)/)[1];
        const dateObj = date ? new Date(date) : new Date();
        replacement = formatDate(dateObj, formatPattern);
      } else if (value.startsWith('running(')) {
        // Handle running() function - sequential number
        const params = value.match(/running\((\d+),\s*'(.)'\)/);
        const digits = parseInt(params[1]);
        const padChar = params[2];
        const nextNumber = last_no !== null ? last_no + 1 : 1;
        replacement = padLeft(nextNumber.toString(), digits, padChar);
      } else if (value.startsWith('random(')) {
        // Handle random() function - random characters
        const params = value.match(/random\((\d+),\s*(\[.+\])\)/);
        const length = parseInt(params[1]);
        const charSet = JSON.parse(params[2].replace(/'/g, '"'));
        replacement = generateRandom(length, charSet);
      } else {
        // Handle plain string
        replacement = value;
      }
    } else {
      replacement = value;
    }

    // Replace placeholder in format string
    result = result.replace(`{${key}}`, replacement);
  }

  return result;
};

// Helper function to format dates
const formatDate = (date, pattern) => {
  const fullYear = date.getFullYear().toString();
  const shortYear = fullYear.slice(-2); // Last 2 digits of year
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Replace yyyy first, then yy (order matters to avoid partial replacement)
  return pattern
    .replace('yyyy', fullYear)
    .replace('yy', shortYear)
    .replace('MM', month)
    .replace('dd', day);
};

// Helper function to pad a string with specified character
const padLeft = (str, length, char) => {
  return str.length >= length
    ? str
    : new Array(length - str.length + 1).join(char) + str;
};

// Helper function to generate random string from character set
const generateRandom = (length, charSet) => {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    result += charSet[randomIndex];
  }
  return result;
};

export interface IPattern {
  type: string;
  pattern: string;
  ch?: string;
}

export function getPattern(pattern: PatternMapper) {
  // TODO NOW SUPPOER ONLY DATE AND RUNNING PATTERN
  const result: IPattern[] = [];

  if (!pattern || typeof pattern !== 'object') {
    return result;
  }

  for (const key in pattern) {
    const value = pattern[key];
    if (typeof value !== 'string') {
      continue;
    }
    if (value.includes('date')) {
      result.push(getDatePattern(value));
    } else if (value.includes('running')) {
      result.push(getRunningPattern(value));
    }
  }

  return result;
}

function getDatePattern(pattern: string): IPattern {
  let datePattern = '';
  const MATCH_INSIDE_PARENTHESES = /(?<=\(['"]).*?(?=['"]\))/;
  datePattern = pattern.match(MATCH_INSIDE_PARENTHESES)[0];

  return {
    type: 'date',
    pattern: datePattern,
  };
}

function getRunningPattern(pattern: string): IPattern {
  const RUNNING_PATTERN = /\((\d+),(.*?)\)/;
  const match = pattern.match(RUNNING_PATTERN);
  const [, running, setChar] = match;

  return {
    type: 'running',
    pattern: running,
    ch: setChar,
  };
}
