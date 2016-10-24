import { configTemplate } from "./configTemplateInterface";

export default class GlobalTemplate implements configTemplate {
    public getTemplateObject(): Object {
        return {
            "servers": [
                {
                    "id": "localhost",
                    "url": "http://localhost:9000",
                    "token": "YOUR_SONARQUBE_AUTH_TOKEN"
                },
                {
                    "id": "my-company-server",
                    "url": "http://my-company.com",
                    "token": "YOUR_SONARQUBE_AUTH_TOKEN"
                }
            ]
        };
    }
}
