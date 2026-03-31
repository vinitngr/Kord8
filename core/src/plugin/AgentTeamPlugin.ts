import { AgentTeam } from "../agent/AgentTeam";

export interface AgentTeamPlugin {
  name: string;
  setup(app: AgentTeam): Promise<void> | void;
}
