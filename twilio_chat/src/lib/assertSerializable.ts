// src/lib/assertSerializable.ts
export function assertSerializable(value: any, path = 'prop') {
  const seen = new WeakSet();

  const visit = (v: any, p: string) => {
    if (v == null) return;

    const t = typeof v;
    if (t === 'function' || t === 'symbol' || t === 'bigint') {
      throw new Error(`Non-serializable ${t} at ${p}`);
    }
    if (t !== 'object') return;

    if (seen.has(v)) return;
    seen.add(v);

    const proto = Object.getPrototypeOf(v);
    const ctor = (v as any)?.constructor?.name;

    // Explicitly fail on null-prototype objects
    if (proto === null) throw new Error(`Null-prototype object at ${p}`);

    // Built-ins / class instances that must be converted
    if (ctor && !['Object', 'Array'].includes(ctor)) {
      if (
        v instanceof Date ||
        v instanceof URL ||
        v instanceof RegExp ||
        v instanceof Error ||
        v instanceof Map ||
        v instanceof Set ||
        (typeof Request !== 'undefined' && v instanceof Request) ||
        (typeof Response !== 'undefined' && v instanceof Response) ||
        (typeof Headers !== 'undefined' && v instanceof Headers)
      ) {
        throw new Error(`Convert ${ctor} at ${p} to a plain value first`);
      }
    }

    if (Array.isArray(v)) {
      v.forEach((item, i) => visit(item, `${p}[${i}]`));
    } else {
      for (const [k, val] of Object.entries(v)) visit(val, `${p}.${k}`);
    }
  };

  visit(value, path);
}
