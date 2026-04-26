export function createPreview(value: unknown, maxPreviewSize: number): unknown {
  try {
    const serialized = JSON.stringify(value);

    if (!serialized) {
      return value;
    }

    if (serialized.length <= maxPreviewSize) {
      return value;
    }

    return {
      __reqscope_truncated: true,
      message: `Preview is larger than ${maxPreviewSize} characters`,
      size: serialized.length,
    };
  } catch {
    return {
      __reqscope_unserializable: true,
      message: "Value could not be serialized",
    };
  }
}
