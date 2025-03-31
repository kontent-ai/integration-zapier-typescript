import { createAppTester } from "zapier-platform-core";
import * as nock from "nock";
import { addInputData, mockBundle } from "../utils/mockBundle";
import {
  ManagementClient,
  WorkflowContracts,
} from "@kontent-ai/management-sdk";
import App from "../../index";
import { KontentBundle } from "../../types/kontentBundle";
import findWorkflowStep, { InputData } from "../../searches/findWorkflowStep";

const appTester = createAppTester(App);
nock.disableNetConnect();

afterEach(() => nock.cleanAll());

describe("findWorkflowStep", () => {
  it("returns workflow step returned from the CM API and matched by part of the name", async () => {
    const bundle: KontentBundle<InputData> = addInputData(mockBundle, {
      stepName: "review",
    });

    const expectedRequest = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    }).listWorkflows();

    nock(expectedRequest.getUrl()).get("").reply(200, [rawWf]);

    const search = App.searches[findWorkflowStep.key].operation.perform;

    const result = await appTester(search, bundle);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "id": "64b4a51f-2177-407d-bb96-4e3003529b5a",
          "name": "Preview 2",
          "transitionsTo": [
            "1f645987-d37a-4c3b-a799-2f7e2117be00",
          ],
        },
        {
          "id": "81d89c3e-cd70-42df-a9be-f95e561e84e8",
          "name": "Preview 3",
          "transitionsTo": [
            "422817dc-9813-41cf-8c0e-5c5b09876c81",
          ],
        },
      ]
    `);
  });

  it("returns workflow step returned from the CM API and matched by the whole name", async () => {
    const bundle: KontentBundle<InputData> = addInputData(mockBundle, {
      stepName: "Preview 3",
    });

    const expectedRequest = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    }).listWorkflows();

    nock(expectedRequest.getUrl()).get("").reply(200, [rawWf]);

    const search = App.searches[findWorkflowStep.key].operation.perform;

    const result = await appTester(search, bundle);

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "id": "81d89c3e-cd70-42df-a9be-f95e561e84e8",
          "name": "Preview 3",
          "transitionsTo": [
            "422817dc-9813-41cf-8c0e-5c5b09876c81",
          ],
        },
      ]
    `);
  });
});

const rawWf: WorkflowContracts.IWorkflowContract = {
  id: "64b4a51f-2177-407d-bb96-4e3003529b5a",
  name: "Default",
  codename: "default",
  scopes: [],
  steps: [
    {
      id: "64b4a51f-2177-407d-bb96-4e3003529b5a",
      name: "Preview 2",
      codename: "preview_2",
      transitions_to: [{ step: { id: "1f645987-d37a-4c3b-a799-2f7e2117be00" }}],
      color: "red",
      role_ids: [],
    },
    {
      id: "81d89c3e-cd70-42df-a9be-f95e561e84e8",
      name: "Preview 3",
      codename: "preview_3",
      transitions_to: [{ step: { id: "422817dc-9813-41cf-8c0e-5c5b09876c81" }}],
      color: "persian-green",
      role_ids: [],
    },
  ],
  published_step: {
    id: "4b0296f1-0153-4710-b57e-df0d509151cd",
    name: "Publish",
    codename: "publish",
    create_new_version_role_ids: [],
    unpublish_role_ids: [],
  },
  scheduled_step: {
    id: "4b0296f1-0153-4710-b57e-df0d509151cd",
    name: "Schedule",
    codename: "schedule",
    create_new_version_role_ids: [],
    unpublish_role_ids: [],
  },
  archived_step: {
    id: "4b0296f1-0153-4710-b57e-df0d509151cd",
    name: "Archive",
    codename: "archive",
    role_ids: [],
  }
};
