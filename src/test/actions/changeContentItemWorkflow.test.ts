import { createAppTester } from 'zapier-platform-core';
import * as nock from 'nock';
import { addInputData, mockBundle } from '../utils/mockBundle';
import { LanguageVariantContracts, ManagementClient, WorkflowContracts } from '@kontent-ai/management-sdk';
import App from '../../index';
import { KontentBundle } from '../../types/kontentBundle';
import { changeContentItemWorkflow, InputData } from '../../actions/changeContentItemWorkflow';
import { createUTCDate } from '../utils/date';

const appTester = createAppTester(App);
nock.disableNetConnect();

afterEach(() => nock.cleanAll());

describe("changeContentItemWorkflow", () => {
  it("changes WF step", async () => {
    const bundle: KontentBundle<InputData> = addInputData(mockBundle, {
      fullItemId: `${rawVariant.item.id}/${rawVariant.language.id}`,
      workflowStepIds: rawWf.steps[1]?.id || "",
    });

    const client = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    });

    const expectedWfRequest = client.listWorkflows();
    nock(expectedWfRequest.getUrl()).get("").reply(200, [rawWf]);

    const expectedVariantRequest = client
      .viewLanguageVariant()
      .byItemId(rawVariant.item.id || "")
      .byLanguageId(rawVariant.language.id || "");
    nock(expectedVariantRequest.getUrl()).get("").reply(200, rawVariant);

    const expectedChangeWfRequest = client
      .changeWorkflowOfLanguageVariant()
      .byItemId(rawVariant.item.id || "")
      .byLanguageId(rawVariant.language.id || "")
      .withData({
        workflow_identifier: { codename: "default" }, // using custom workflows is not supported here yet
        step_identifier: { id: rawWf.steps[1]?.id || "" },
      });
    nock(expectedChangeWfRequest.getUrl()).put("").reply(204);

    const search = App.creates[changeContentItemWorkflow.key].operation.perform;

    const result = await appTester(search, bundle);

    expect(result).toMatchInlineSnapshot(`
      {
        "message": "Content item workflow step has changed",
      }
    `);
  });
});

const rawWf: WorkflowContracts.IWorkflowContract = {
  id: "b4d3b3b4-4b1b-4b1b-8b1b-4b1b4b1b4b1b",
  name: "Default",
  codename: "default",
  scopes: [],
  steps: [
    {
      id: "50fc24bd-0fc1-426e-b9c3-572de7cd179a",
      name: "Draft",
      codename: "draft",
      transitions_to: [{ step: { id: "792ea977-4fc1-49c8-9950-4c245576f423" } }],
      color: "red",
      role_ids: [],
    },
    {
      id: "792ea977-4fc1-49c8-9950-4c245576f423",
      name: "Review",
      codename: "review",
      transitions_to: [{ step: { id: "4cf052e1-13a3-4649-9eb7-65e07a7cfc49" }}],
      color: "yellow",
      role_ids: [],
    },
  ],
  published_step: {
    id: "4cf052e1-13a3-4649-9eb7-65e07a7cfc49",
    name: "Publish",
    codename: "publish",
    create_new_version_role_ids: [],
    unpublish_role_ids: [],
  },
  scheduled_step: {
    id: "498b83e8-9bb5-4b80-94ef-fe066c1114b8",
    name: "Scheduled",
    codename: "scheduled",
    create_new_version_role_ids: [],
    unpublish_role_ids: [],
  },
  archived_step: {
    id: "8fbfb744-7ab1-41e8-a4dd-754d76a40218",
    name: "Archived",
    codename: "archived",
    role_ids: [],
  },
};

const rawVariant: LanguageVariantContracts.ILanguageVariantModelContract = {
  item: { id: "db2dcddc-62c5-41a7-81f5-9f958f69b0bd" },
  language: { id: "984efe5c-6898-4d51-8afa-a66b9de51cc0" },
  elements: [],
  last_modified: createUTCDate(1316, 5, 14).toISOString(),
  workflow: {
    workflow_identifier: { codename: rawWf.codename },
    step_identifier: { id: rawWf.steps[0]?.id },
  },
  schedule: {
    publish_display_timezone: null,
    publish_time: null,
    unpublish_time: null,
    unpublish_display_timezone: null,
  },
  contributors: [],
  due_date: { value: null },
};
