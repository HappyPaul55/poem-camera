import PrinterTypeSetting from '@/components/Settings/Printer/TypeSetting';
import PrinterThermalDriverSetting from '@/components/Settings/Printer/Thermal/DriverSetting';
import PrinterThermalBaudRateSetting from '@/components/Settings/Printer/Thermal/BaudRateSetting';
import PrinterThermalModelSetting from '@/components/Settings/Printer/Thermal/ModelSetting';
import PrinterInstantPrintSetting from '@/components/Settings/Printer/Thermal/InstantPrintSetting';

export default function PrinterSettings() {
  return <>
    <PrinterTypeSetting />
    <PrinterThermalDriverSetting />
    <PrinterThermalBaudRateSetting />
    <PrinterThermalModelSetting />
    <PrinterInstantPrintSetting />
  </>
}