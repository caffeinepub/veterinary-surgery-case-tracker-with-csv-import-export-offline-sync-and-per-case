import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  // Old task item definition
  type OldTaskItem = {
    checked : Bool;
  };

  // Old tasks checklist definition
  type OldTasksChecklist = {
    dischargeNotes : OldTaskItem;
    pdvmNotified : OldTaskItem;
  };

  // Old patient demographics definition
  type OldPatientDemographics = {
    name : Text;
    species : Text;
    breed : Text;
    age : Nat;
  };

  // Old surgery case definition
  type OldSurgeryCase = {
    caseId : Nat;
    medicalRecordNumber : Text;
    patientDemographics : OldPatientDemographics;
    arrivalDate : Int;
    tasksChecklist : OldTasksChecklist;
    lastSyncTimestamp : Int;
    isSynchronized : Bool;
  };

  // Old actor type
  type OldActor = {
    nextCaseId : Nat;
    cases : Map.Map<Principal, List.List<OldSurgeryCase>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  // New task item definition
  type NewTaskItem = {
    required : Bool;
    checked : Bool;
  };

  // New tasks checklist definition
  type NewTasksChecklist = {
    dischargeNotes : NewTaskItem;
    pdvmNotified : NewTaskItem;
    labs : NewTaskItem;
    histo : NewTaskItem;
    surgeryReport : NewTaskItem;
    imaging : NewTaskItem;
    culture : NewTaskItem;
  };

  // New patient demographics definition
  type NewPatientDemographics = {
    name : Text;
    species : Text;
    breed : Text;
    age : Nat;
  };

  // New surgery case definition
  type NewSurgeryCase = {
    caseId : Nat;
    medicalRecordNumber : Text;
    patientDemographics : NewPatientDemographics;
    arrivalDate : Int;
    tasksChecklist : NewTasksChecklist;
    lastSyncTimestamp : Int;
    isSynchronized : Bool;
  };

  // New actor type
  type NewActor = {
    nextCaseId : Nat;
    cases : Map.Map<Principal, List.List<NewSurgeryCase>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newCases = old.cases.map<Principal, List.List<OldSurgeryCase>, List.List<NewSurgeryCase>>(
      func(_principal, oldCases) {
        oldCases.map<OldSurgeryCase, NewSurgeryCase>(
          func(oldCase) {
            {
              oldCase with
              patientDemographics = oldCase.patientDemographics;
              tasksChecklist = {
                dischargeNotes = {
                  required = true;
                  checked = oldCase.tasksChecklist.dischargeNotes.checked;
                };
                pdvmNotified = {
                  required = true;
                  checked = oldCase.tasksChecklist.pdvmNotified.checked;
                };
                // Default values for new tasks set to not required and unchecked
                labs = {
                  required = false;
                  checked = false;
                };
                histo = {
                  required = false;
                  checked = false;
                };
                surgeryReport = {
                  required = false;
                  checked = false;
                };
                imaging = {
                  required = false;
                  checked = false;
                };
                culture = {
                  required = false;
                  checked = false;
                };
              };
            };
          }
        );
      }
    );

    {
      old with
      cases = newCases;
    };
  };
};
