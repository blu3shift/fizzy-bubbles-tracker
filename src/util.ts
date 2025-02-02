import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export function debounce(fn: Function, ms = 300) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

export function filterUnique<T>(item: T, index: number, array: T[]) {
  return array.indexOf(item) === index;
}

export function uniqueOnProp<T>(prop: keyof T) {
  return (item: T, index: number, array: T[]) => {
    return array.findIndex((i) => i[prop] === item[prop]) === index;
  };
}

type WrapIfProps = {
  wrapIf: boolean;
  wrap: (wrapped: JSX.Element) => JSX.Element;
  children: JSX.Element;
};
export function WrapIf({ wrapIf, wrap, children }: WrapIfProps): JSX.Element {
  return wrapIf ? wrap(children) : children;
}

export function currentTime(): Dayjs {
  return dayjs().utc();
}

export function findLastIndex<T>(
  array: T[],
  predicate: (item: T, index: number, array: T[]) => boolean
): number {
  for (let i = array.length - 1; i > 0; i--) {
    if (predicate(array[i], i, array)) {
      return i;
    }
  }
  return -1;
}

export function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
}
