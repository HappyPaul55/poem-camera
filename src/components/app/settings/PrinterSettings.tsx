import ReceiptPrinterEncoder from "@point-of-sale/receipt-printer-encoder";
import usePrinter from "../../../lib/app/use-printer";
import {
  type Printer,
  PrinterDriver,
  PrinterType,
} from "../../../lib/app/use-printer-settings";
import useAppSettings, {
  AppInstantPrint,
} from "../../../lib/app/use-app-settings";
import SelectField from "../ui/SelectField";

function getDefaultConfigForType(type: PrinterType): Printer {
  const defaultConfigs = {
    [PrinterType.native]: {
      type: PrinterType.native,
    },
    [PrinterType.thermal]: {
      type: PrinterType.thermal,
      driver: PrinterDriver.bluetooth,
      model: "generic",
    },
  } as const;

  return defaultConfigs[type];
}

export default function PrinterSettings() {
  const { printer, setPrinter } = usePrinter();
  const [settings, setAppSettings] = useAppSettings();

  const modelOptions = [
    { value: "generic", label: "Generic" },
    ...ReceiptPrinterEncoder.printerModels
      .map((model) => ({ value: model.id, label: model.name }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  return (
    <section className="settings-group">
      <h3 className="settings-group__title">Printer</h3>

      <SelectField
        id="printer-type"
        label="Type"
        value={String(printer.type)}
        options={[
          { value: String(PrinterType.native), label: "Native (print / PDF)" },
          { value: String(PrinterType.thermal), label: "Thermal printer" },
        ]}
        onChange={(value) =>
          setPrinter(getDefaultConfigForType(Number(value) as PrinterType))
        }
      />

      {printer.type === PrinterType.thermal && (
        <>
          <SelectField
            id="printer-driver"
            label="Driver"
            value={String(printer.driver)}
            options={[
              { value: String(PrinterDriver.usb), label: "USB" },
              { value: String(PrinterDriver.serial), label: "Serial" },
              { value: String(PrinterDriver.bluetooth), label: "Bluetooth" },
            ]}
            onChange={(value) => {
              const driver = Number(value) as PrinterDriver;
              setPrinter({
                type: printer.type,
                driver,
                ...(driver === PrinterDriver.serial ? { baudRate: 9600 } : {}),
              } as Printer);
            }}
          />

          {printer.driver === PrinterDriver.serial && (
            <SelectField
              id="printer-baud"
              label="Baud rate"
              value={String(printer.baudRate)}
              options={[
                { value: "9600", label: "9600" },
                { value: "38400", label: "38400" },
                { value: "115200", label: "115200" },
              ]}
              onChange={(value) =>
                setPrinter({
                  ...printer,
                  baudRate: Number(value) as 9600 | 38400 | 115200,
                })
              }
            />
          )}

          <SelectField
            id="printer-model"
            label="Model"
            value={printer.model}
            options={modelOptions}
            onChange={(value) => setPrinter({ ...printer, model: value })}
          />

          <SelectField
            id="printer-instant"
            label="Instant print"
            value={String(settings.instantPrint)}
            options={[
              { value: String(AppInstantPrint.yes), label: "Yes" },
              { value: String(AppInstantPrint.no), label: "No" },
            ]}
            onChange={(value) =>
              setAppSettings({
                ...settings,
                instantPrint: Number(value) as AppInstantPrint,
              })
            }
          />

          {printer.driver !== PrinterDriver.bluetooth && (
            <p className="alert alert--info">
              Only the Bluetooth driver is wired up today — USB and serial are
              remembered but not yet connected.
            </p>
          )}
        </>
      )}
    </section>
  );
}
