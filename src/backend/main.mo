import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Nat "mo:core/Nat";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type TaskItem = {
    required : Bool;
    checked : Bool;
  };

  public type TasksChecklist = {
    dischargeNotes : TaskItem;
    pdvmNotified : TaskItem;
    labs : TaskItem;
    histo : TaskItem;
    surgeryReport : TaskItem;
    imaging : TaskItem;
    culture : TaskItem;
  };

  public type CompletePatientDemographics = {
    name : Text;
    ownerLastName : Text;
    species : Text;
    breed : Text;
    sex : Text;
    dateOfBirth : Text;
  };

  public type SurgeryCase = {
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

  public type SurgeryCaseUpdate = {
    medicalRecordNumber : ?Text;
    presentingComplaint : ?Text;
    patientDemographics : ?CompletePatientDemographics;
    arrivalDate : ?Time.Time;
    tasksChecklist : ?TasksChecklist;
    notes : ?Text;
  };

  var nextCaseId = 1;
  var cases = Map.empty<Principal, Map.Map<Nat, SurgeryCase>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func ping() : async () {
    ();
  };

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

  public shared ({ caller }) func createSurgeryCase(
    medicalRecordNumber : Text,
    presentingComplaint : Text,
    patientDemographics : CompletePatientDemographics,
    arrivalDate : Time.Time,
    tasksChecklist : TasksChecklist,
    notes : Text,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create surgery cases");
    };

    let userCases = switch (cases.get(caller)) {
      case (null) { Map.empty<Nat, SurgeryCase>() };
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
      notes;
      lastSyncTimestamp = Time.now();
      isSynchronized = false;
    };

    userCases.add(caseId, newCase);
    cases.add(caller, userCases);
    caseId;
  };

  public shared ({ caller }) func updateSurgeryCase(caseId : Nat, updates : SurgeryCaseUpdate) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update surgery cases");
    };

    switch (cases.get(caller)) {
      case (null) { false };
      case (?userCases) {
        switch (userCases.get(caseId)) {
          case (null) { false };
          case (?surgeryCase) {
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
              notes = switch (updates.notes) {
                case (null) { surgeryCase.notes };
                case (?update) { update };
              };
              lastSyncTimestamp = Time.now();
              isSynchronized = false;
            };

            userCases.add(caseId, updatedCase);
            true;
          };
        };
      };
    };
  };

  public query ({ caller }) func getSurgeryCases(start : Nat, limit : Nat) : async [SurgeryCase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view surgery cases");
    };
    let effectiveLimit = if (limit == 0) { 10 } else if (limit > 100) { 100 } else { limit };
    switch (cases.get(caller)) {
      case (null) { [] };
      case (?userCases) {
        // Use streaming approach for pagination
        let filteredCases = userCases.entries().drop(start).take(effectiveLimit);
        let casesList = List.empty<SurgeryCase>();
        let iter = filteredCases;
        iter.forEach(
          func((_, caseItem)) {
            casesList.add(caseItem);
          }
        );
        casesList.toArray();
      };
    };
  };

  public shared ({ caller }) func syncLocalChanges(localCases : [SurgeryCase]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sync surgery cases");
    };

    let mergedCases = Map.empty<Nat, SurgeryCase>();
    let currentCases = switch (cases.get(caller)) {
      case (null) { Map.empty<Nat, SurgeryCase>() };
      case (?userCases) { userCases };
    };

    // Add or update cases from incoming localChanges
    for (newCase in localCases.values()) {
      mergedCases.add(newCase.caseId, newCase);
    };

    // Add cases from the current persistent list that are not in the localChanges
    for ((caseId, persistentCase) in currentCases.entries()) {
      switch (mergedCases.get(caseId)) {
        case (?_) { () }; // Local changes takes precedence
        case (null) { mergedCases.add(caseId, persistentCase) };
      };
    };

    updateNextCaseId(mergedCases, nextCaseId);
    cases.add(caller, mergedCases);
  };

  func updateNextCaseId(mergedCases : Map.Map<Nat, SurgeryCase>, startingId : Nat) {
    var maxId = startingId;
    for ((caseId, _) in mergedCases.entries()) {
      if (caseId > maxId) { maxId := caseId };
    };
    nextCaseId := maxId + 1;
  };

  public query ({ caller }) func hasUnsyncedChanges() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check sync status");
    };
    switch (cases.get(caller)) {
      case (null) { false };
      case (?userCases) {
        var hasUnsynced = false;
        for ((_, c) in userCases.entries()) {
          if (not c.isSynchronized) {
            hasUnsynced := true;
          };
        };
        hasUnsynced;
      };
    };
  };

  public query ({ caller }) func getUpdatedCases(since : Time.Time) : async [SurgeryCase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view updated cases");
    };
    switch (cases.get(caller)) {
      case (null) { [] };
      case (?userCases) {
        let filteredCases = userCases.filter(
          func(_, c) {
            c.lastSyncTimestamp > since;
          }
        );
        let casesList = List.empty<SurgeryCase>();
        for ((_, caseItem) in filteredCases.entries()) {
          casesList.add(caseItem);
        };
        casesList.toArray().sort(SurgeryCase.compareByLastSyncTimestamp);
      };
    };
  };

  public shared ({ caller }) func deleteSurgeryCase(caseId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete surgery cases");
    };

    switch (cases.get(caller)) {
      case (null) { false };
      case (?userCases) {
        switch (userCases.get(caseId)) {
          case (null) { false };
          case (?_) {
            userCases.remove(caseId);
            true;
          };
        };
      };
    };
  };
};
