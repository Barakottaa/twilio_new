// src/lib/toPlain.ts
type Replacer = (key: string, value: any) => any;

const defaultReplacer: Replacer = (_k, v) => {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'bigint') return v.toString();
  if (v instanceof URL) return v.toString();
  if (v instanceof Map) return Object.fromEntries(v);
  if (v instanceof Set) return Array.from(v);
  if (v instanceof Error) return {
    name: v.name,
    message: v.message,
    stack: process.env.NODE_ENV === 'development' ? v.stack : undefined,
  };

  // Null-prototype objects -> clone into a normal object
  if (v && Object.getPrototypeOf(v) === null) return { ...v };

  // Class instances (incl. Twilio SDK objects): keep only enumerable own fields
  if (v && typeof v === 'object' && v.constructor && v.constructor !== Object && !Array.isArray(v)) {
    const o: Record<string, any> = {};
    for (const k of Object.keys(v)) o[k] = (v as any)[k];
    return o;
  }

  return v;
};

export function toPlain<T>(value: T, replacer: Replacer = defaultReplacer): T {
  return JSON.parse(JSON.stringify(value, replacer));
}
