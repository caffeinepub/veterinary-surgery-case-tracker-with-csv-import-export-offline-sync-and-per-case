import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  type CompletePatientDemographics = {
    name : Text;
    ownerLastName : Text;
    species : Text;
    breed : Text;
    sex : Text;
    dateOfBirth : Text;
  };

  type TaskItem = {
    required : Bool;
    checked : Bool;
  };

  type TasksChecklist = {
    dischargeNotes : TaskItem;
    pdvmNotified : TaskItem;
    labs : TaskItem;
    histo : TaskItem;
    surgeryReport : TaskItem;
    imaging : TaskItem;
    culture : TaskItem;
  };

  type SurgeryCase = {
    caseId : Nat;
    medicalRecordNumber : Text;
    presentingComplaint : Text;
    patientDemographics : CompletePatientDemographics;
    arrivalDate : Time.Time;
    tasksChecklist : TasksChecklist;
    notes : Text;
    lastSyncTimestamp : Time.Time;
    isSynchronized : Bool;
  };

  type OldActor = {
    cases : Map.Map<Principal, List.List<SurgeryCase>>;
  };

  type NewActor = {
    cases : Map.Map<Principal, Map.Map<Nat, SurgeryCase>>;
  };

  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Principal, List.List<SurgeryCase>, Map.Map<Nat, SurgeryCase>>(
      func(_principal, caseList) {
        let casesMap = Map.empty<Nat, SurgeryCase>();
        for (c in caseList.values()) {
          casesMap.add(c.caseId, c);
        };
        casesMap;
      }
    );
    { cases = newCases };
  };
};
