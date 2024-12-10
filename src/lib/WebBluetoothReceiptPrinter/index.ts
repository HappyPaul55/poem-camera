import EventEmitter from "./EventEmitter";
import CallbackQueue from "./CallbackQueue";

interface DeviceFunction {
  service: string;
  characteristic: string;
}

interface DeviceProfile {
  filters: Array<{
    name?: string;
    namePrefix?: string;
    services?: string[];
  }>;
  functions: {
    print: DeviceFunction;
    status?: DeviceFunction;
    notify?: DeviceFunction;
  };
  language: string | ((device: BluetoothDevice) => string | Promise<string>);
  codepageMapping: string | ((device: BluetoothDevice) => string | Promise<string>);
  messageSize?: number;
  sleepAfterCommand?: number;
}

const DeviceProfiles: DeviceProfile[] = [

  /* Epson TM-P series, for example the TM-P20II */
  {
    filters: [
      {
        namePrefix: 'TM-P'
      }
    ],

    functions: {
      'print': {
        service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        characteristic: '49535343-8841-43f4-a8d4-ecbe34729bb3'
      },

      'status': {
        service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        characteristic: '49535343-1e4d-4bd9-ba61-23c647249616'
      }
    },

    language: 'esc-pos',
    codepageMapping: 'epson'
  },

  /* Star SM-L series, for example the SM-L200 */
  {
    filters: [
      {
        namePrefix: 'STAR L'
      }
    ],

    functions: {
      'print': {
        service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        characteristic: '49535343-8841-43f4-a8d4-ecbe34729bb3'
      },

      'status': {
        service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        characteristic: '49535343-1e4d-4bd9-ba61-23c647249616'
      }
    },

    language: 'star-line',
    codepageMapping: 'star'
  },

  /* POS-5805, POS-8360 and similar printers */
  {
    filters: [
      {
        name: 'BlueTooth Printer',
        services: ['000018f0-0000-1000-8000-00805f9b34fb']
      }
    ],

    functions: {
      'print': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af1-0000-1000-8000-00805f9b34fb'
      },

      'status': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af0-0000-1000-8000-00805f9b34fb'
      }
    },

    language: 'esc-pos',
    codepageMapping: 'zjiang'
  },

  /* Xprinter */
  {
    filters: [
      {
        name: 'Printer001',
        services: ['000018f0-0000-1000-8000-00805f9b34fb']
      }
    ],

    functions: {
      'print': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af1-0000-1000-8000-00805f9b34fb'
      },

      'status': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af0-0000-1000-8000-00805f9b34fb'
      }
    },

    language: 'esc-pos',
    codepageMapping: 'xprinter'
  },

  /* MPT-II printer */
  {
    filters: [
      {
        name: 'MPT-II',
        services: ['000018f0-0000-1000-8000-00805f9b34fb']
      }
    ],

    functions: {
      'print': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af1-0000-1000-8000-00805f9b34fb'
      },

      'status': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af0-0000-1000-8000-00805f9b34fb'
      }
    },

    language: 'esc-pos',
    codepageMapping: 'mpt'
  },

  /* Cat printer */
  {
    filters: [
      {
        services: ['0000ae30-0000-1000-8000-00805f9b34fb']
      }
    ],

    functions: {
      'print': {
        service: '0000ae30-0000-1000-8000-00805f9b34fb',
        characteristic: '0000ae01-0000-1000-8000-00805f9b34fb'
      },

      'notify': {
        service: '0000ae30-0000-1000-8000-00805f9b34fb',
        characteristic: '0000ae02-0000-1000-8000-00805f9b34fb'
      }

    },

    language: 'meow',
    codepageMapping: 'default',
    messageSize: 200,
    sleepAfterCommand: 30
  },

  /* Generic printer */
  {
    filters: [
      {
        services: ['000018f0-0000-1000-8000-00805f9b34fb']
      }
    ],

    functions: {
      'print': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af1-0000-1000-8000-00805f9b34fb'
      },

      'status': {
        service: '000018f0-0000-1000-8000-00805f9b34fb',
        characteristic: '00002af0-0000-1000-8000-00805f9b34fb'
      }
    },

    language: 'esc-pos',
    codepageMapping: 'default'
  }
];

export type EmitterEvents = {
  "connected": [{
    type: "bluetooth",
    name: string,
    id: string,
    language: string,
    codepageMapping: string,
  }],
  "disconnected": [],
  "error": [string],
  "data": [any],
}

export default class WebBluetoothReceiptPrinter {
  private emitter: EventEmitter<EmitterEvents>;
  private queue: CallbackQueue;
  private device: BluetoothDevice | undefined = undefined;
  private profile: DeviceProfile | undefined = undefined;
  private characteristics: { print: BluetoothRemoteGATTCharacteristic | null; status: BluetoothRemoteGATTCharacteristic | null } = {
    print: null,
    status: null,
  };

  constructor() {
    this.emitter = new EventEmitter<EmitterEvents>();
    this.queue = new CallbackQueue();

    navigator.bluetooth.addEventListener("disconnect", (event: Event) => {
      if (this.device === (event as any).device) {
        this.emitter.emit("disconnected");
      }
    });
  }

  async connect(): Promise<void> {
    const filters = DeviceProfiles.flatMap((profile) => profile.filters);
    const optionalServices = [
      ...new Set(DeviceProfiles.flatMap((profile) => Object.values(profile.functions).map((func) => func.service))),
    ];

    try {
      const device = await navigator.bluetooth.requestDevice({ filters, optionalServices });
      if (device) {
        await this.open(device);
      }
    } catch (error) {
      console.error("Could not connect! " + error);
      this.emitter.emit("disconnected")
    }
  }

  async reconnect(previousDevice: BluetoothDevice): Promise<void> {
    if (!navigator.bluetooth.getDevices) return;

    const devices = await navigator.bluetooth.getDevices();
    const device = devices.find((d) => d.id === previousDevice.id);

    if (device) {
      await this.open(device);
    }
  }

  private async open(device: BluetoothDevice): Promise<void> {
    this.device = device;
    const server = await this.device.gatt?.connect();
    if (!server) return;

    const services = await server.getPrimaryServices();
    const uuids = services.map((service) => service.uuid);

    this.profile = DeviceProfiles.find((profile) =>
      profile.filters.some((filter) => this.evaluateFilter(filter, uuids))
    );
    if (!this.profile) return;

    const printService = await server.getPrimaryService(this.profile.functions.print.service);
    this.characteristics.print = await printService.getCharacteristic(this.profile.functions.print.characteristic);

    if (this.profile.functions.status) {
      const statusService = await server.getPrimaryService(this.profile.functions.status.service);
      this.characteristics.status = await statusService.getCharacteristic(this.profile.functions.status.characteristic);
    }

    this.emitter.emit("connected", {
      type: "bluetooth",
      name: this.device.name ?? 'Unknown Name',
      id: this.device.id,
      language: await this.evaluate(this.profile.language),
      codepageMapping: await this.evaluate(this.profile.codepageMapping),
    });
  }

  private async evaluate(expression: string | ((device: BluetoothDevice) => string | Promise<string>)): Promise<string> {
    if (typeof expression === "function") {
      return await expression(this.device!);
    }
    return expression;
  }

  private evaluateFilter(filter: DeviceProfile["filters"][0], uuids: string[]): boolean {
    if (filter.services && !filter.services.every((service) => uuids.includes(service))) return false;
    if (filter.name && this.device?.name !== filter.name) return false;
    if (filter.namePrefix && !this.device?.name?.startsWith(filter.namePrefix)) return false;

    return true;
  }

  async listen(): Promise<boolean> {
    if (this.characteristics.status) {
      await this.characteristics.status.startNotifications();
      this.characteristics.status.addEventListener("characteristicvaluechanged", (event) => {
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        this.emitter.emit("data", target.value);
      });
      return true;
    }
    return false;
  }

  async disconnect(): Promise<void> {
    if (!this.device) return;

    this.device.gatt?.disconnect();

    this.device = undefined;
    this.characteristics.print = null;
    this.characteristics.status = null;
    this.profile = undefined;

    this.emitter.emit("disconnected");
  }

  print(commands: Uint8Array | Uint8Array[]): Promise<void> {
    return new Promise((resolve) => {
      if (!Array.isArray(commands)) commands = [commands];

      commands.forEach((command) => {
        const maxLength = this.profile?.messageSize || 100;
        for (let i = 0; i < command.length; i += maxLength) {
          const chunk = command.slice(i, i + maxLength);
          this.queue.add(() => this.characteristics.print!.writeValueWithResponse(chunk));
          if (this.profile?.sleepAfterCommand) {
            this.queue.sleep(this.profile.sleepAfterCommand);
          }
        }
      });

      this.queue.add(() => resolve());
    });
  }

  addEventListener<T extends keyof EmitterEvents>(eventName: T, listener: Function): void {
    this.emitter.on(eventName, listener as any);
  }
}