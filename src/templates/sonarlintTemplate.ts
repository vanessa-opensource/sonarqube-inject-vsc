import { IConfigTemplate } from "./IConfigTemplate";

export default class SonarlintTemplate implements IConfigTemplate {

    public getTemplateObject(): object {
        return {
            serverId: "my-company-server",
            projectKey: "my-project",
        };
    }
}
