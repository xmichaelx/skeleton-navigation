export class ObservatoryLocation {
  public latitude;
  public longitude;
  public altitude;
}

export class ObservatoryComponentConfiguration {
  constructor(public id: string, public type: string, public name: string, public groups: Array<string>, public configuration: any = null) { }
}
export type ObservatoryDeviceOperationType = "Default" | "Primary" | "Warning" | "Danger";

// @todo move to general DeviceOperation
export class ObservatoryDeviceOperation {
  public id: string;
  public name: string;
  public description: string = '';
  public requirements: any = null;
  public claims: {};
  public configuration: {};
  public hidden: boolean = false;
  public type: string;
}

export class ObservatoryStreamConfiguration {
  constructor(public name: string, public src: string, public type: string, public configuration: any) { }
}

export class ObservatorySite {
  constructor(public name: string) { }
}

export class ObservatoryStatus {
  public status: string;
}


export class ObservatoryConfiguration {
  public id: string;
  public name: string;
  public shortName: string;
  public site: ObservatorySite;
  public location: ObservatoryLocation;
  public type: string;
  public networks;
  public components: Array<ObservatoryComponentConfiguration>;
  public streams: Array<ObservatoryStreamConfiguration>;
  public state: ObservatoryStatus;

  constructor() { }
}
