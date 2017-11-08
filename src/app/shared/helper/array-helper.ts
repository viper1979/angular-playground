export class ArrayHelper {
  static contains<T>( array: Array<T>, item: T ): boolean {
    let index = array.findIndex( arrItem => arrItem === item );
    return index >= 0;
  }
}
