import DiagnosisService from "./DiagnosisService";
import DocumentService from "./DocumentService";
import FacilityService from "./FacilityService";
import InputService from "./InputService";
import IssService from "./IssService";
import KarteService from "./KarteService";
import LabTestService from "./LabTestService";
import MasterService from "./MasterService";
import MediaService from "./MediaService";
import PatientService from "./PatientService";
import PvtService from "./PvtService";
import RiskService from "./RiskService";
import StampService from "./StampService";
import UserService from "./UserService";

class ApiService {
  constructor() {
    this.diagnosisService = new DiagnosisService();
    this.documentService = new DocumentService();
    this.facilityService = new FacilityService();
    this.inputService = new InputService();
    this.issService = new IssService();
    this.karteService = new KarteService();
    this.labTestService = new LabTestService();
    this.masterService = new MasterService();
    this.mediaService = new MediaService();
    this.patientService = new PatientService();
    this.pvtService = new PvtService();
    this.riskService = new RiskService();
    this.stampService = new StampService();
    this.userService = new UserService();
  }

  get(name) {
    switch (name) {
      case "diagnosis":
        return this.diagnosisService;
      case "document":
        return this.documentService;
      case "facility":
        return this.facilityService;
      case "input":
        return this.inputService;
      case "iss":
        return this.issService;
      case "karte":
        return this.karteService;
      case "labTest":
        return this.labTestService;
      case "master":
        return this.masterService;
      case "media":
        return this.mediaService;
      case "patient":
        return this.patientService;
      case "pvt":
        return this.pvtService;
      case "risk":
        return this.riskService;
      case "stamp":
        return this.stampService;
      case "user":
        return this.userService;
      default:
        return null;
    }
  }
}

export default ApiService;
