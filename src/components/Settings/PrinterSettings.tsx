import PrinterTypeSetting from "./Printer/TypeSetting";
import PrinterThermalDriverSetting from "./Printer/ThermalDriverSetting";
import PrinterThermalBaudRateSetting from "./Printer/ThermalBaudRateSetting";
import PrinterThermalModelSetting from "./Printer/ThermalModelSetting";
import PrinterInstantPrintSetting from "./Printer/ThermalInstantPrintSetting";

export default function PrinterSettings() {
  return <>
    <PrinterTypeSetting />
    <PrinterThermalDriverSetting />
    <PrinterThermalBaudRateSetting />
    <PrinterThermalModelSetting />
    <PrinterInstantPrintSetting />
  </>
}