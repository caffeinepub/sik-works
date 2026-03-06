import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type WorkerId = Nat;
  type OwnerId = Nat;
  type LaborRecordId = Nat;

  type Worker = {
    id : WorkerId;
    name : Text;
    mobile : Text;
    site : Text;
    dailyRate : Nat;
    active : Bool;
  };

  let workers = Map.empty<WorkerId, Worker>();
  var nextWorkerId = 1;

  type Attendance = {
    workerId : WorkerId;
    date : Text;
    morningPresent : Bool;
    afternoonPresent : Bool;
  };

  var attendanceRecords = List.empty<Attendance>();

  type Advance = {
    workerId : WorkerId;
    amount : Nat;
    date : Text;
    note : Text;
  };

  var advances = List.empty<Advance>();

  var sites = List.empty<Text>();

  type Owner = {
    id : OwnerId;
    name : Text;
    site : Text;
  };

  let owners = Map.empty<OwnerId, Owner>();
  var nextOwnerId = 1;

  type LaborRecord = {
    id : LaborRecordId;
    ownerId : OwnerId;
    category : Text;
    date : Text;
    morningCount : Int;
    afternoonCount : Int;
    dailyRate : Nat;
    totalAmount : Int;
  };

  let laborRecords = Map.empty<LaborRecordId, LaborRecord>();
  var nextLaborRecordId = 1;

  type WeeklyBalance = {
    ownerId : OwnerId;
    week : Text;
    prevBalance : Int;
    advanceDeduction : Int;
    thisWeekTotal : Int;
    finalPayable : Int;
  };

  let weeklyBalances = Map.empty<Text, WeeklyBalance>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

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

  // Worker Management - Admin only (sensitive employee data)

  public shared ({ caller }) func createWorker(name : Text, mobile : Text, site : Text, dailyRate : Nat) : async Worker {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create workers");
    };

    let id = nextWorkerId;
    nextWorkerId += 1;

    let worker : Worker = {
      id;
      name;
      mobile;
      site;
      dailyRate;
      active = true;
    };

    workers.add(id, worker);
    worker;
  };

  public query ({ caller }) func getWorker(id : WorkerId) : async ?Worker {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view workers");
    };
    workers.get(id);
  };

  public shared ({ caller }) func updateWorker(id : WorkerId, name : Text, mobile : Text, site : Text, dailyRate : Nat, active : Bool) : async Worker {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update workers");
    };

    switch (workers.get(id)) {
      case (null) { Runtime.trap("Worker not found") };
      case (?_) {
        let updatedWorker : Worker = {
          id;
          name;
          mobile;
          site;
          dailyRate;
          active;
        };
        workers.add(id, updatedWorker);
        updatedWorker;
      };
    };
  };

  public shared ({ caller }) func deleteWorker(id : WorkerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete workers");
    };

    if (not workers.containsKey(id)) {
      Runtime.trap("Worker not found");
    };
    workers.remove(id);
  };

  public query ({ caller }) func listWorkers() : async [Worker] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list workers");
    };
    workers.values().toArray();
  };

  // Attendance Management - User level (day-to-day operations)

  public shared ({ caller }) func createAttendance(workerId : WorkerId, date : Text, morningPresent : Bool, afternoonPresent : Bool) : async Attendance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create attendance");
    };

    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    let attendance : Attendance = {
      workerId;
      date;
      morningPresent;
      afternoonPresent;
    };
    attendanceRecords := List.singleton<Attendance>(attendance);
    attendance;
  };

  public shared ({ caller }) func updateAttendance(workerId : WorkerId, date : Text, morningPresent : Bool, afternoonPresent : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update attendance");
    };

    let updatedAttendance : Attendance = {
      workerId;
      date;
      morningPresent;
      afternoonPresent;
    };
    attendanceRecords := attendanceRecords.map<Attendance, Attendance>(
      func(record) { if (record.workerId == workerId and record.date == date) { updatedAttendance } else { record } }
    );
  };

  public shared ({ caller }) func deleteAttendance(workerId : WorkerId, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete attendance");
    };

    attendanceRecords := attendanceRecords.filter<Attendance>(
      func(record) { record.workerId != workerId or record.date != date }
    );
  };

  public query ({ caller }) func getAttendanceByWorker(workerId : WorkerId) : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    attendanceRecords.filter<Attendance>(func(record) { record.workerId == workerId }).toArray();
  };

  public query ({ caller }) func getAttendanceByDate(date : Text) : async [Attendance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view attendance");
    };
    attendanceRecords.filter<Attendance>(func(record) { record.date == date }).toArray();
  };

  // Advances Management - User level (financial operations)

  public shared ({ caller }) func createAdvance(workerId : WorkerId, amount : Nat, date : Text, note : Text) : async Advance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create advances");
    };

    if (not workers.containsKey(workerId)) {
      Runtime.trap("Worker not found");
    };
    let advance : Advance = {
      workerId;
      amount;
      date;
      note;
    };
    advances := List.singleton<Advance>(advance);
    advance;
  };

  public shared ({ caller }) func deleteAdvance(workerId : WorkerId, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete advances");
    };

    advances := advances.filter<Advance>(
      func(record) { not (record.workerId == workerId and record.date == date) }
    );
  };

  public query ({ caller }) func getAdvancesByWorker(workerId : WorkerId) : async [Advance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view advances");
    };
    advances.filter<Advance>(func(record) { record.workerId == workerId }).toArray();
  };

  // Sites Management - Admin only (business configuration)

  public shared ({ caller }) func createSite(site : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create sites");
    };

    var containsSite = false;
    for (existingSite in sites.values()) {
      if (existingSite == site) {
        containsSite := true;
      };
    };
    if (containsSite) {
      Runtime.trap("Site already exists");
    };
    sites := List.singleton<Text>(site);
  };

  public shared ({ caller }) func deleteSite(site : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete sites");
    };

    sites := sites.filter<Text>(func(existingSite) { existingSite != site });
  };

  public query ({ caller }) func listSites() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list sites");
    };
    sites.toArray();
  };

  // Owners Management - Admin only (business configuration)

  public shared ({ caller }) func createOwner(name : Text, site : Text) : async Owner {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create owners");
    };

    let id = nextOwnerId;
    nextOwnerId += 1;

    let owner : Owner = {
      id;
      name;
      site;
    };

    owners.add(id, owner);
    owner;
  };

  public query ({ caller }) func getOwner(id : OwnerId) : async ?Owner {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view owners");
    };
    owners.get(id);
  };

  public shared ({ caller }) func updateOwner(id : OwnerId, name : Text, site : Text) : async Owner {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update owners");
    };

    switch (owners.get(id)) {
      case (null) { Runtime.trap("Owner not found") };
      case (?_) {
        let updatedOwner : Owner = {
          id;
          name;
          site;
        };
        owners.add(id, updatedOwner);
        updatedOwner;
      };
    };
  };

  public shared ({ caller }) func deleteOwner(id : OwnerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete owners");
    };

    if (not owners.containsKey(id)) {
      Runtime.trap("Owner not found");
    };
    owners.remove(id);
  };

  public query ({ caller }) func listOwners() : async [Owner] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list owners");
    };
    owners.values().toArray();
  };

  // Labor Records Management - User level (day-to-day operations)

  public shared ({ caller }) func createLaborRecord(ownerId : OwnerId, category : Text, date : Text, morningCount : Int, afternoonCount : Int, dailyRate : Nat) : async LaborRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create labor records");
    };

    if (not owners.containsKey(ownerId)) {
      Runtime.trap("Owner not found");
    };
    let totalAmount = (morningCount + afternoonCount) * Int.fromNat(dailyRate);
    let id = nextLaborRecordId;
    nextLaborRecordId += 1;

    let laborRecord : LaborRecord = {
      id;
      ownerId;
      category;
      date;
      morningCount;
      afternoonCount;
      dailyRate;
      totalAmount;
    };

    laborRecords.add(id, laborRecord);
    laborRecord;
  };

  public shared ({ caller }) func updateLaborRecord(id : LaborRecordId, category : Text, date : Text, morningCount : Int, afternoonCount : Int, dailyRate : Nat) : async LaborRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update labor records");
    };

    switch (laborRecords.get(id)) {
      case (null) { Runtime.trap("Labor record not found") };
      case (?existingRecord) {
        let totalAmount = (morningCount + afternoonCount) * Int.fromNat(dailyRate);
        let updatedRecord : LaborRecord = {
          id;
          ownerId = existingRecord.ownerId;
          category;
          date;
          morningCount;
          afternoonCount;
          dailyRate;
          totalAmount;
        };
        laborRecords.add(id, updatedRecord);
        updatedRecord;
      };
    };
  };

  public shared ({ caller }) func deleteLaborRecord(id : LaborRecordId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete labor records");
    };

    if (not laborRecords.containsKey(id)) {
      Runtime.trap("Labor record not found");
    };
    laborRecords.remove(id);
  };

  public query ({ caller }) func getLaborRecordsByOwner(ownerId : OwnerId) : async [LaborRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view labor records");
    };

    laborRecords.values().toArray().filter<LaborRecord>(
      func(record) { record.ownerId == ownerId }
    );
  };

  // Weekly Balances Management - User level (financial operations)

  public shared ({ caller }) func createWeeklyBalance(ownerId : OwnerId, week : Text, prevBalance : Int, advanceDeduction : Int, thisWeekTotal : Int) : async WeeklyBalance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create weekly balances");
    };

    if (not owners.containsKey(ownerId)) {
      Runtime.trap("Owner not found");
    };
    let finalPayable = prevBalance + advanceDeduction + thisWeekTotal;

    let balance : WeeklyBalance = {
      ownerId;
      week;
      prevBalance;
      advanceDeduction;
      thisWeekTotal;
      finalPayable;
    };

    weeklyBalances.add(week, balance);
    balance;
  };

  public shared ({ caller }) func updateWeeklyBalance(ownerId : OwnerId, week : Text, prevBalance : Int, advanceDeduction : Int, thisWeekTotal : Int) : async WeeklyBalance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update weekly balances");
    };

    switch (weeklyBalances.get(week)) {
      case (null) { Runtime.trap("Weekly balance not found") };
      case (?_) {
        let finalPayable = prevBalance + advanceDeduction + thisWeekTotal;
        let updatedBalance : WeeklyBalance = {
          ownerId;
          week;
          prevBalance;
          advanceDeduction;
          thisWeekTotal;
          finalPayable;
        };
        weeklyBalances.add(week, updatedBalance);
        updatedBalance;
      };
    };
  };

  public query ({ caller }) func getWeeklyBalance(week : Text) : async ?WeeklyBalance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view weekly balances");
    };
    weeklyBalances.get(week);
  };

  // Dashboard - Admin only (sensitive financial summaries)

  public query ({ caller }) func getDashboard() : async { activeWorkers : Nat; totalPendingBalance : Int } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view dashboard");
    };

    let activeWorkers = workers.values().toArray().filter(
      func(worker) { worker.active }
    ).size();

    var totalPendingBalance : Int = 0;
    for (balance in weeklyBalances.values()) {
      totalPendingBalance += balance.finalPayable;
    };

    { activeWorkers; totalPendingBalance };
  };
};
