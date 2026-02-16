import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


import Order "mo:core/Order";
import Int "mo:core/Int";
import Nat "mo:core/Nat";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profile definition
  public type UserProfile = {
    name : Text;
  };

  // Task item definition
  public type TaskItem = {
    required : Bool;
    checked : Bool;
  };

  // Tasks checklist definition
  public type TasksChecklist = {
    dischargeNotes : TaskItem;
    pdvmNotified : TaskItem;
    labs : TaskItem;
    histo : TaskItem;
    surgeryReport : TaskItem;
    imaging : TaskItem;
    culture : TaskItem;
  };

  // Complete patient demographics definition
  public type CompletePatientDemographics = {
    name : Text;
    ownerLastName : Text;
    species : Text;
    breed : Text;
    sex : Text;
    dateOfBirth : Text;
  };

  // Surgery case definition (updated with presentingComplaint)
  public type SurgeryCase = {
    caseId : Nat;
    medicalRecordNumber : Text;
    presentingComplaint : Text;
    patientDemographics : CompletePatientDemographics;
    arrivalDate : Time.Time;
    tasksChecklist : TasksChecklist;
    lastSyncTimestamp : Time.Time;
    isSynchronized : Bool;
  };

  module SurgeryCase {
    public func compare(case1 : SurgeryCase, case2 : SurgeryCase) : Order.Order {
      switch (Int.compare(case1.arrivalDate, case2.arrivalDate)) {
        case (#equal) { Nat.compare(case1.caseId, case2.caseId) };
        case (order) { order };
      };
    };

    public func compareByLastSyncTimestamp(case1 : SurgeryCase, case2 : SurgeryCase) : Order.Order {
      Int.compare(case1.lastSyncTimestamp, case2.lastSyncTimestamp);
    };
  };

  // Surgery case update definition (now includes presentingComplaint)
  public type SurgeryCaseUpdate = {
    medicalRecordNumber : ?Text;
    presentingComplaint : ?Text;
    patientDemographics : ?CompletePatientDemographics;
    arrivalDate : ?Time.Time;
    tasksChecklist : ?TasksChecklist;
  };

  // Persistent state
  var nextCaseId = 1;
  let cases = Map.empty<Principal, List.List<SurgeryCase>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Surgery case creation with presentingComplaint
  public shared ({ caller }) func createSurgeryCase(medicalRecordNumber : Text, presentingComplaint : Text, patientDemographics : CompletePatientDemographics, arrivalDate : Time.Time, tasksChecklist : TasksChecklist) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create surgery cases");
    };

    let userCases = switch (cases.get(caller)) {
      case (null) { List.empty<SurgeryCase>() };
      case (?existing) { existing };
    };

    let caseId = nextCaseId;
    nextCaseId += 1;

    let newCase : SurgeryCase = {
      caseId;
      medicalRecordNumber;
      presentingComplaint;
      patientDemographics;
      arrivalDate;
      tasksChecklist;
      lastSyncTimestamp = Time.now();
      isSynchronized = false;
    };

    userCases.add(newCase);
    cases.add(caller, userCases);
    caseId;
  };

  // Update surgery case (with presentingComplaint)
  public shared ({ caller }) func updateSurgeryCase(caseId : Nat, updates : SurgeryCaseUpdate) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update surgery cases");
    };

    switch (cases.get(caller)) {
      case (null) { false };
      case (?userCases) {
        let caseIndex = userCases.findIndex(func(c) { c.caseId == caseId });
        switch (caseIndex) {
          case (null) { false };
          case (?index) {
            let surgeryCase = userCases.at(index);
            let updatedCase : SurgeryCase = {
              caseId = surgeryCase.caseId;
              medicalRecordNumber = switch (updates.medicalRecordNumber) {
                case (null) { surgeryCase.medicalRecordNumber };
                case (?mrn) { mrn };
              };
              presentingComplaint = switch (updates.presentingComplaint) {
                case (null) { surgeryCase.presentingComplaint };
                case (?complaint) { complaint };
              };
              patientDemographics = switch (updates.patientDemographics) {
                case (null) { surgeryCase.patientDemographics };
                case (?demographics) { demographics };
              };
              arrivalDate = switch (updates.arrivalDate) {
                case (null) { surgeryCase.arrivalDate };
                case (?date) { date };
              };
              tasksChecklist = switch (updates.tasksChecklist) {
                case (null) { surgeryCase.tasksChecklist };
                case (?checklist) { checklist };
              };
              lastSyncTimestamp = Time.now();
              isSynchronized = false;
            };

            let updatedCases = List.empty<SurgeryCase>();
            let iter = userCases.values();
            var currentIndex = 0;
            for (caseItem in iter) {
              if (currentIndex == index) {
                updatedCases.add(updatedCase);
              } else {
                updatedCases.add(caseItem);
              };
              currentIndex += 1;
            };
            cases.add(caller, updatedCases);
            true;
          };
        };
      };
    };
  };

  // Get all surgery cases for the caller
  public query ({ caller }) func getAllSurgeryCases() : async [SurgeryCase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view surgery cases");
    };

    switch (cases.get(caller)) {
      case (null) { [] };
      case (?userCases) {
        userCases.toArray().sort();
      };
    };
  };

  // Sync local changes from frontend
  public shared ({ caller }) func syncLocalChanges(localCases : [SurgeryCase]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sync surgery cases");
    };

    let mergedCases = List.empty<SurgeryCase>();
    let currentCases = switch (cases.get(caller)) {
      case (null) { List.empty<SurgeryCase>() };
      case (?userCases) { userCases };
    };

    // Add or update cases from incoming localChanges
    for (newCase in localCases.values()) {
      var found = false;
      for (c in currentCases.values()) {
        if (c.caseId == newCase.caseId) {
          found := true;
        };
      };
      mergedCases.add(newCase);
    };

    // Add cases from the current persistent list that are not in the localChanges
    for (persistentCase in currentCases.values()) {
      var found = false;
      for (c in localCases.values()) {
        if (c.caseId == persistentCase.caseId) {
          found := true;
        };
      };
      if (not found) {
        mergedCases.add(persistentCase);
      };
    };

    updateNextCaseId(mergedCases, nextCaseId);
    cases.add(caller, mergedCases);
  };

  func updateNextCaseId(mergedCases : List.List<SurgeryCase>, startingId : Nat) {
    let casesArray = mergedCases.toArray();
    let maxId = casesArray.foldLeft<Nat, Nat>(startingId, maxNat);
    nextCaseId := maxId + 1;
  };

  func maxNat(x : Nat, y : Nat) : Nat {
    if (x >= y) { x } else { y };
  };

  // Check for unsynchronized changes
  public query ({ caller }) func hasUnsyncedChanges() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check sync status");
    };
    switch (cases.get(caller)) {
      case (null) { false };
      case (?userCases) {
        let casesArray = userCases.toArray();
        var hasUnsynced = false;
        for (c in casesArray.values()) {
          if (not c.isSynchronized) {
            hasUnsynced := true;
          };
        };
        hasUnsynced;
      };
    };
  };

  // Get cases updated since last sync
  public query ({ caller }) func getUpdatedCases(since : Time.Time) : async [SurgeryCase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view updated cases");
    };
    switch (cases.get(caller)) {
      case (null) { [] };
      case (?userCases) {
        let casesArray = userCases.toArray();
        let filteredCases = casesArray.filter(func(c) { c.lastSyncTimestamp > since });
        filteredCases.sort(SurgeryCase.compareByLastSyncTimestamp);
      };
    };
  };
};
