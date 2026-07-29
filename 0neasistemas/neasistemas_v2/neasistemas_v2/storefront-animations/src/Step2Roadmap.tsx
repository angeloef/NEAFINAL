import { CardSequence } from "./CardSequence";
import { RoadmapAct } from "./acts-step2/RoadmapAct";
import { ProposalAct } from "./acts-step2/ProposalAct";
import { WebsiteAct } from "./acts-step2/WebsiteAct";
import { AnnotateAct } from "./acts-step2/AnnotateAct";

export const Step2Roadmap = () => (
  <CardSequence acts={[RoadmapAct, ProposalAct, WebsiteAct, AnnotateAct]} />
);
