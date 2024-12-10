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
    .align('center')
    .text(poem.title)
    .newline()
    .size(1, 1)
    .text('By Poem Camera')
    .align('left')
    .newline()
    .newline()
    .newline()
    .newline();

  const lines = poem.body.split("\n")
  for (const line of lines) {
    data = data.line(line);
  }

  data = data.newline().newline().newline();

  /* Print the header. */
  driver.print(data.encode());
}