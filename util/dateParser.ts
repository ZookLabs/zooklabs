import { format as formatDate, parse as parseDate } from "date-fns";

const format = "EEE MMM d HH:mm:ss yyyy '(GMT)'";

/**
 * Converts a date string to a JavaScript Date object.
 * @param dateStr - The date string to parse.
 * @returns A Date object.
 */
export const stringToLocalDate = (dateStr: string) => {
    return parseDate(dateStr, format, new Date());
}

/**
 * Converts a JavaScript Date object to a formatted string.
 * @param date - The Date object to format.
 * @returns A formatted date string.
 */
export const localDateToString = (date: Date) => {
    return formatDate(date, format);
}
