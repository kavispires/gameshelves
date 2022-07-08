/**
 * Console log stuff with color
 * @param str
 * @param color
 * @param value
 * @returns
 */
export function print(str: string, color: string = '#2a9d8f', value?: any) {
  return console.log(`%c${str}`, `background-color:${color}`, value ? value : '');
}
