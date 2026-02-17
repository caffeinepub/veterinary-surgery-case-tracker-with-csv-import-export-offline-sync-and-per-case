import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
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

  type CompletePatientDemographics = {
    name : Text;
    ownerLastName : Text;
    species : Text;
    breed : Text;
    sex : Text;
    dateOfBirth : Text;
  };

  type OldSurgeryCase = {
    caseId : Nat;
    medicalRecordNumber : Text;
    presentingComplaint : Text;
    patientDemographics : CompletePatientDemographics;
    arrivalDate : Int;
    tasksChecklist : TasksChecklist;
    lastSyncTimestamp : Int;
    isSynchronized : Bool;
  };

  type OldActor = {
    cases : Map.Map<Principal, List.List<OldSurgeryCase>>;
  };

  type NewSurgeryCase = {
    caseId : Nat;
    medicalRecordNumber : Text;
    presentingComplaint : Text;
    patientDemographics : CompletePatientDemographics;
    arrivalDate : Int;
    tasksChecklist : TasksChecklist;
    notes : Text;
    lastSyncTimestamp : Int;
    isSynchronized : Bool;
  };

  type NewActor = {
    cases : Map.Map<Principal, List.List<NewSurgeryCase>>;
  };

  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Principal, List.List<OldSurgeryCase>, List.List<NewSurgeryCase>>(
      func(_userId, oldCases) {
        oldCases.map<OldSurgeryCase, NewSurgeryCase>(
          func(oldCase) {
            { oldCase with notes = "" };
          }
        );
      }
    );
    { cases = newCases };
  };
};
