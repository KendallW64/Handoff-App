// Only a BOM is accepted as evidence of UTF-16; do not guess legacy encodings.
export function decodeBusinessText(bytes: Uint8Array): string {
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le'
    : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  try {
    // UTF-32 BOMs share prefixes with UTF-16 but are not supported.
    if ((bytes[0] === 0xff && bytes[1] === 0xfe && bytes[2] === 0 && bytes[3] === 0) ||
        (bytes[0] === 0 && bytes[1] === 0 && bytes[2] === 0xfe && bytes[3] === 0xff)) throw Error('UTF-32');
    return new TextDecoder(encoding, {fatal:true}).decode(bytes);
  } catch {
    throw Error('This text file has an unsupported or invalid encoding. Save it as UTF-8, or UTF-16 with a byte-order mark (BOM), and try again.');
  }
}
