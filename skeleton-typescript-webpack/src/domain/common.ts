import {Moment} from "moment";

export class Message {
    public componentId: string;
    public observatoryId: string;
    public type: string;
    public payload: any;
}

export type ScheduleType = "Advanced" | "Simple" | "Text";

export type ObservingProgramStatus = "Draft" | "Scheduled" | "Proceeded" | "Cancelled" | "Completed";

export class ObservingProgram {
    public id: string;
    public ownerId: string;
    public networkId: string;
    public name: string;
    public validFrom: Moment;
    public validTo: Moment;
    public timeBasedConstraint: boolean = false;
    public observingFields: Array<ObservingField> = [];
    public repeat: number = 1;
    public type: ScheduleType = "Simple";
    public status: ObservingProgramStatus = "Draft";

    public get totalObservingTime(): number {
      var offset = 0;
      this.observingFields.forEach((field) => {
        if (field.observingAtoms) {
          var fieldOffset = 0;
          field.observingAtoms.forEach((a) => {
            fieldOffset += a.repeat * (a.exposureTime + 60);
          });
        }

        offset += fieldOffset * field.repeat;
      });

      var t = offset * this.repeat;
      return t;
    }
}

export class ObservingField {
    public id: string;
    public observatoryId: string;
    public name: string;
    public ra: string = '00:00:00';
    public dec: string = '00:00:00';
    public alt: string = '';
    public az: string = '';
    public observingAtoms: Array<ObservingAtom> = [];
    public repeat: number = 1;
    public validFrom: Moment;
    public validTo: Moment;
    public weight: number;

    public reassignFilters(targetFilters) {
      if (targetFilters.length) {
        if (this.observingAtoms && this.observingAtoms.length) {
          this.observingAtoms.forEach((a) => {
            if (a.filter) {
              if (targetFilters.indexOf(a.filter) > -1) {
                // do not change
              } else {
                a.filter = targetFilters[0];
              }
            }
          });
        }
      }
    }

    public get totalObservingTime(): number {
      var offset = 0;
      if (this.observingAtoms) {
        this.observingAtoms.forEach((a) => {
          offset += a.repeat * (a.exposureTime + 60);
        });
      }

      var t = offset * this.repeat;
      return t;
    }
}

export class ObservingAtom {
    public id: string;
    public name: string;
    public filter: string;
    public exposureTime: number = 0.1;
    public repeat: number = 1;
    public dynamicExposure: boolean = false;
    public validFrom: Moment;
    public validTo: Moment;
    public binningX: number = 1;
    public binningY: number = 1;
    public weight: number;
}

export class CompletedObservingAtom {
  public id: string;
  public signature: string;
  public observingAtomId: string;
  public observingAtomName: string;
  public observingFieldId: string;
  public observingFieldName: string;
  public observingProgramId: string;
  public observingProgramName: string;
  public ownerName: string;
  public ownerId: string;
  public ownerGroupName: string;
  public ownerGroupId: string;
  public filter: string;
  public observatoryName: string;
  public observatoryId: string;
  public observationStatus: string;
  public endTime: Date;
  public exposureTime: number;
  public observedObjectId: string;
  public observedObjectName: string;
}
