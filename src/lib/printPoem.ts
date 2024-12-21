import Poem from "@/types/Poem";
import WebBluetoothReceiptPrinter from "./WebBluetoothReceiptPrinter";
import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";

export default function printPoem(
  poem: Poem,
  driver: WebBluetoothReceiptPrinter,
  printerModel: string,
) {
  const encoder = new ReceiptPrinterEncoder({
    printerModel,
  });

  let data = encoder
    .initialize()
    .size(2, 2)
    .bold(true)
    .align('center')
    .text(poem.title)
    .newline()
    .bold(false)
    .size(1, 1)
    .italic(true)
    .text('By Poem Camera')
    .align('left')
    .newline()
    .italic(false)
    .newline()
    .newline()
    .newline();

  const lines = poem.body.split("\n")
  for (const line of lines) {
    let remainingLine = line;
    while (remainingLine !== '') {
      const boldMarkerStart = remainingLine.indexOf('**');
      const boldMarkerEnd = remainingLine.substring(boldMarkerStart + 2).indexOf("**");
      if (boldMarkerStart === -1 || boldMarkerEnd === -1) {
        data.text(remainingLine);
        remainingLine = '';
        break;
      }

      if (boldMarkerStart > 0) {
        data = data.text(line.substring(0, boldMarkerStart));
      }
      data = data.bold(true);
      data = data.text(remainingLine.substring(boldMarkerStart + 2, boldMarkerStart + 2 + boldMarkerEnd))
      data = data.bold(false);
      remainingLine = remainingLine.substring(boldMarkerStart + 2 + boldMarkerEnd + 2);
    }

    data = data.newline();
  }

  data = data.newline().newline().newline();

  /* Print the header. */
  driver.print(data.encode());
}