const BINARY_CHUNK_SIZE = 0x8000;

export const encodeUtf8Base64 = (value: string): string => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BINARY_CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, offset + BINARY_CHUNK_SIZE);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
};

export const decodeUtf8Base64 = (value: string): string => {
  const binary = atob(value.trim());
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};
