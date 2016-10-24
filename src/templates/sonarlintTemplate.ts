import { configTemplate } from "./configTemplateInterface";

export default class SonarlintTemplate implements configTemplate {

    public getTemplateObject(): Object {
        return {
            "serverId": "my-company-server",
            "projectKey": "my-project"
        };
    }
}