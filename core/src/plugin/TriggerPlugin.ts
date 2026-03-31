import { AgentTeam } from "../agent/AgentTeam";
import { AgentTeamPlugin } from "./AgentTeamPlugin";
import { ManualTrigger } from "../triggers/ManualTrigger";
import { CronTrigger } from "../triggers/CronTrigger";
import { WebhookTrigger } from "../triggers/WebhookTrigger";
import { ScheduledTrigger } from "../triggers/ScheduledTrigger";
import { GitHubTrigger } from "../triggers/GitHubTrigger";

export class TriggerPlugin implements AgentTeamPlugin {
  name = "TriggerPlugin";

  async setup(app: AgentTeam): Promise<void> {
    app.triggers.register(ManualTrigger);
    app.triggers.register(CronTrigger);
    app.triggers.register(WebhookTrigger);
    app.triggers.register(ScheduledTrigger);
    app.triggers.register(GitHubTrigger);
  }
}
