/**
 * Prisma devuelve BigInt para las PK del esquema introspectado.
 * JSON.stringify no soporta BigInt por defecto, así que lo serializamos como string.
 */
const bigIntPrototype = BigInt.prototype as unknown as { toJSON?: () => string };

if (typeof bigIntPrototype.toJSON !== "function") {
  bigIntPrototype.toJSON = function (this: bigint) {
    return this.toString();
  };
}

export {};
