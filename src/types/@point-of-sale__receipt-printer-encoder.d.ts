declare module "@point-of-sale/receipt-printer-encoder" {
  /**
   * Represents a printer model preset.
   */
  interface PrinterModel {
    /**
     * Unique identifier for the printer model.
     */
    id: string;

    /**
     * Human-readable name of the printer model.
     */
    name: string;
  }

  /**
   * Configuration options for the ReceiptPrinterEncoder.
   */
  interface ReceiptPrinterEncoderOptions {
    /**
     * The easiest way to configure this library is by specifying the model of the printer that you are using. 
     * It will then automatically configure the most important configuration options,
     * such as the printer language, supported code pages, image mode and more.
     */
    printerModel: string;

    /**
     * Defines the image rendering mode.
     * - `'raster'`: Images are rendered as raster graphics (newer)
     * - `'column'`: Images are rendered using column-based rendering (older)
     */
    imageMode?: 'raster' | 'column';

    /**
     * Commonly "\n" but could also be "\r" or "\r\n"
     */
    newline?: strling;

    /**
     * In most printers the cutter is located above the printing mechanism,
     * that means that if you cut immediately after printing a line of text,
     * the cut will be above the text.
     * 
     * To prevent this, you can feed the paper a number of lines before cutting the paper.
     */
    feedBeforeCut: 4;

    /**
     * Specify the number of characters that one line can hold.
     * This will ensure that words will properly wrap to the next line at the end of the paper.
     * 
     * The number of characters are measured using Font A which is 12 pixels wide.
     * If you choose a smaller font the point where words will be wrapped will be automatically adjusted to take the new font width into account.
     */
    columns: 48;

    /**
     * It is possible to specify the language of the printer you want to use by providing a options object with the property language set to either esc-pos, star-prnt or star-line.
     * By default the library uses ESC/POS.
     */
    language: 'esc-pos' | 'star-prnt' | 'star-line';
  }

  interface ReceiptPrinterEncoder {
    /**
     * Initializes the encoder.
     * @returns The instance of the encoder for chaining.
     */
    initialize(): this;

    /**
     * Adds text to the receipt.
     * @param content The text content to add.
     * @returns The instance of the encoder for chaining.
     */
    text(content: string): this;

    /**
     * Adds a newline to the receipt.
     * @returns The instance of the encoder for chaining.
     */
    newline(): this;

    /**
     * Adds a QR code to the receipt.
     * @param content The data to encode in the QR code.
     * @returns The instance of the encoder for chaining.
     */
    qrcode(content: string): this;

    /**
     * Encodes the receipt data into a format suitable for printing.
     * @returns A Uint8Array representing the encoded receipt data.
     */
    encode(): Uint8Array;
  }

  const ReceiptPrinterEncoder: {
    /**
     * Constructor for ReceiptPrinterEncoder.
     * @param options Optional configuration for the encoder.
     */
    new(options?: Partial<ReceiptPrinterEncoderOptions>): ReceiptPrinterEncoder;
    /**
     * Static property containing a list of supported printer models.
     */
    printerModels: PrinterModel[];
  };

  export default ReceiptPrinterEncoder;
}