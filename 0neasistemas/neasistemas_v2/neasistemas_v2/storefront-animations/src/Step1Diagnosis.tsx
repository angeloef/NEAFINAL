import { CardSequence } from "./CardSequence";
import { ChatAct } from "./acts/ChatAct";
import { TableAct } from "./acts/TableAct";
import { DashboardAct } from "./acts/DashboardAct";
import { ReportAct } from "./acts/ReportAct";

export const Step1Diagnosis = () => (
  <CardSequence acts={[ChatAct, TableAct, DashboardAct, ReportAct]} />
);
