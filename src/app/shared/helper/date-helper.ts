// export class DateHelper {
//   public static toISOString( date: Date ): string {
//     return date.getUTCFullYear() +
//       '-' + DateHelper.pad(date.getUTCMonth() + 1) +
//       '-' + DateHelper.pad(date.getUTCDate()) +
//       'T' + DateHelper.pad(date.getUTCHours()) +
//       ':' + DateHelper.pad(date.getUTCMinutes()) +
//       ':' + DateHelper.pad(date.getUTCSeconds()) +
//       '.' + (date.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
//       'Z';
//   };

//   private static pad( number: number ): string {
//     if (number < 10) {
//       return '0' + number;
//     }
//     return number.toString( );
//   }
// }
