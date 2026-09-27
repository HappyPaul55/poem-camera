/**
 * Minimal type declarations for `@point-of-sale/receipt-printer-encoder`, which
 * ships no types of its own. Only the surface the app uses is declared.
 */
declare module "@point-of-sale/receipt-printer-encoder" {
  interface PrinterModel {
    id: string;
    name: string;
  }

  interface ReceiptPrinterEncoderOptions {
    printerModel: string;
    imageMode?: "raster" | "column";
    newline?: string;
    feedBeforeCut?: number;
    columns?: number;
    language?: "esc-pos" | "star-prnt" | "star-line";
  }

  interface ReceiptPrinterEncoder {
    initialize(): this;
    text(content: string): this;
    line(content: string): this;
    image(
      input: object,
      width: number,
      height: number,
      algorithm: "floydsteinberg" | "atkinson",
    ): this;
    image(
      input: object,
      width: number,
      height: number,
      algorithm: "threshold" | "bayer",
      threshold: number,
    ): this;
    rule(options?: { style?: "single" | "double"; width?: number }): this;
    font(value: "A" | "B"): this;
    invert(value?: boolean): this;
    italic(value?: boolean): this;
    bold(value?: boolean): this;
    cut(): this;
    box(
      options: {
        style: "single" | "double";
        width: number;
        marginLeft: number;
        marginRight: number;
        paddingLeft: number;
        paddingRight: number;
      },
      content: string,
    ): this;
    align(value: "left" | "center" | "right"): this;
    codepage(codepage: string): this;
    size(x: number, y: number): this;
    newline(): this;
    qrcode(content: string): this;
    encode(): Uint8Array;
  }

  const ReceiptPrinterEncoder: {
    new (
      options?: Partial<ReceiptPrinterEncoderOptions>,
    ): ReceiptPrinterEncoder;
    printerModels: PrinterModel[];
  };

  export default ReceiptPrinterEncoder;
}
