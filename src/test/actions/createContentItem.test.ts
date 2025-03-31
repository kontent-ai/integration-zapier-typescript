import { createAppTester } from "zapier-platform-core";
import * as nock from "nock";
import { addInputData, mockBundle } from "../utils/mockBundle";
import {
  ContentItemContracts,
  ContentTypeContracts,
  ElementContracts,
  LanguageContracts,
  LanguageVariantContracts,
  languageVariantElementsBuilder,
  LanguageVariantElementsBuilder,
  ManagementClient,
} from "@kontent-ai/management-sdk";
import App from "../../index";
import { KontentBundle } from "../../types/kontentBundle";
import { createContentItem, InputData } from "../../actions/createContentItem";
import { createUTCDate } from "../utils/date";
import { mockSnippetsRequest } from "../utils/mockSnippetsRequest";
import { mockLanguageRequest } from "../utils/mockLanguageRequest";
import { mockTypeRequest } from "../utils/mockTypeRequest";

const appTester = createAppTester(App);
nock.disableNetConnect();

afterEach(() => nock.cleanAll());

describe("createContentItem", () => {
  it("changes WF step", async () => {
    const itemName = "Created item name";
    const itemExternalId = "Created item external id";

    const bundle: KontentBundle<InputData> = addInputData(mockBundle, {
      name: itemName,
      contentTypeId: rawContentType.id,
      externalId: itemExternalId,
      languageId: rawLanguage.id,
      elements__asset_el: [
        "asset1Codename,67fa93df-ef47-41c8-8b92-f500fd6b437f",
      ],
      elements__custom_el: "custom value",
      elements__date_time_el: "1993-01-01T00:00:00.000Z",
      elements__modular_content_el: [
        "item1ExternalId,e427d105-dd99-4f09-b293-d2c5dfbf5e2d",
      ],
      elements__multiple_choice_el: [
        "d61b01fc-fe7f-4c25-915b-b003c21c55b3",
        "option2",
      ],
      elements__number_el: 234,
      elements__rich_text_el: "<p>rich value</p>",
      elements__taxonomy_el: [
        "term1Codename",
        "f86b6373-d022-4baa-be0c-6153a3c0031d",
      ],
      elements__text_el: "super duper text",
      elements__url_slug_el: "url_slug_value",
    });

    const client = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    });

    mockTypeRequest(client, rawContentType);

    mockSnippetsRequest(client);

    mockLanguageRequest(client, rawLanguage);

    const expectedCreateItemRequest = client.addContentItem().withData({
      name: itemName,
      type: { codename: rawContentType.codename },
      external_id: itemExternalId,
    });
    const itemId = "e819c466-4b0c-4fd9-9441-b41dd85a1cdc";
    nock(expectedCreateItemRequest.getUrl())
      .post("", JSON.stringify(expectedCreateItemRequest.data))
      .reply(201, {
        id: itemId,
        name: itemName,
        codename: "generated_codename",
        type: { id: rawContentType.id, codename: rawContentType.codename },
        external_id: itemExternalId,
        last_modified: createUTCDate(1993, 1, 1),
        collection: { id: "00000000-0000-0000-0000-000000000000" },
        spaces: [],
      } satisfies ContentItemContracts.IAddContentItemResponseContract);

    const expectedCreateVariantRequest = client
      .upsertLanguageVariant()
      .byItemId(itemId)
      .byLanguageId(rawLanguage.id)
      .withData(builder => ({
        elements: buildExpectedElements(builder),
      }));

    nock(expectedCreateVariantRequest.getUrl())
      .put("", JSON.stringify(expectedCreateVariantRequest.data(languageVariantElementsBuilder)))
      .reply(201, {
        item: { id: itemId },
        language: { id: rawLanguage.id },
        elements: resultElements,
        last_modified: createUTCDate(1993, 1, 1).toISOString(),
        workflow: {
          workflow_identifier: { codename: "default" },
          step_identifier: { id: "3ecd7341-ad09-44b1-b457-4257ba3fa73b" },
        },
        contributors: [],
        due_date: { value: null },
        schedule: {
          publish_display_timezone: null,
          publish_time: null,
          unpublish_display_timezone: null,
          unpublish_time: null,
        },
      } satisfies LanguageVariantContracts.IUpsertLanguageVariantResponseContract);

    const search = App.creates[createContentItem.key].operation.perform;

    const result = await appTester(search, bundle);

    expect(result).toMatchInlineSnapshot(`
      {
        "elements": {
          "asset_el": [
            "asset1Id",
            "67fa93df-ef47-41c8-8b92-f500fd6b437f",
          ],
          "custom_el": "custom value",
          "date_time_el": "1993-01-01T00:00:00.000Z",
          "modular_content_el": [
            "item1Id",
            "e427d105-dd99-4f09-b293-d2c5dfbf5e2d",
          ],
          "multiple_choice_el": [
            "d61b01fc-fe7f-4c25-915b-b003c21c55b3",
            "option2Id",
          ],
          "number_el": 234,
          "rich_text_el": "<p>rich value</p>",
          "taxonomy_el": [
            "term1Id",
            "f86b6373-d022-4baa-be0c-6153a3c0031d",
          ],
          "text_el": "super duper text",
          "url_slug_el": "url_slug_value",
        },
        "modular_content": "[]",
        "system": {
          "codename": "generated_codename",
          "contentTypeId": "f14de016-4d57-475d-a855-b12967294a51",
          "externalId": "Created item external id",
          "fullId": "e819c466-4b0c-4fd9-9441-b41dd85a1cdc/ed733acb-e1e2-4c82-bfe4-ae82f73908f9",
          "id": "e819c466-4b0c-4fd9-9441-b41dd85a1cdc",
          "language": "test_language",
          "languageId": "ed733acb-e1e2-4c82-bfe4-ae82f73908f9",
          "lastModified": "1993-01-01T00:00:00.000Z",
          "name": "Created item name",
          "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
          "type": "test_content_type",
          "workflowStepId": "3ecd7341-ad09-44b1-b457-4257ba3fa73b",
        },
      }
    `);
  });
});

const resultElements: ElementContracts.IContentItemElementContract[] = [
  {
    element: {
      id: "b81ac159-eef9-4962-ae23-87b6145abd4d",
    },
    value: [
      { id: "asset1Id", codename: "asset1Codename" },
      { id: "67fa93df-ef47-41c8-8b92-f500fd6b437f" },
    ],
  },
  {
    element: {
      id: "b5d85814-44e7-4c4d-a15e-fa6fdc2405e9",
    },
    value: "custom value",
  },
  {
    element: {
      id: "cb6cd7d6-855c-45b3-ad59-7c25844e85cd",
    },
    value: "1993-01-01T00:00:00.000Z",
  },
  {
    element: {
      id: "72e5bb70-079c-469a-89f4-b8aba9b75551",
    },
    value: [
      { id: "item1Id", external_id: "item1ExternalId" },
      { id: "e427d105-dd99-4f09-b293-d2c5dfbf5e2d" },
    ],
  },
  {
    element: {
      id: "dff67dce-c23f-4366-94dd-b9f565bb6d2c",
    },
    value: [
      { id: "d61b01fc-fe7f-4c25-915b-b003c21c55b3" },
      { id: "option2Id", codename: "option2" },
    ],
  },
  {
    element: {
      id: "9a305614-9175-443b-9bf6-61adaf3280d6",
    },
    value: 234,
  },
  {
    element: {
      id: "2e460e16-e006-4726-848b-9912c413d947",
    },
    value: "<p>rich value</p>",
    components: [],
  },
  {
    element: {
      id: "f870da17-761e-49fe-a546-e52be730b05e",
    },
    value: [
      { id: "term1Id", codename: "term1Codename" },
      { id: "f86b6373-d022-4baa-be0c-6153a3c0031d" },
    ],
  },
  {
    element: {
      id: "24b667e6-f543-48fb-b144-cdbcb3be011c",
    },
    value: "super duper text",
  },
  {
    element: {
      id: "c6408e22-5db7-464a-ad6d-5952a803743b",
    },
    value: "url_slug_value",
  },
];

const buildExpectedElements = (builder: LanguageVariantElementsBuilder) => [
  builder.assetElement({
    element: { id: "b81ac159-eef9-4962-ae23-87b6145abd4d" },
    value: [
      { codename: "asset1Codename" },
      { id: "67fa93df-ef47-41c8-8b92-f500fd6b437f" },
    ],
  }),
  builder.customElement({
    element: { id: "b5d85814-44e7-4c4d-a15e-fa6fdc2405e9" },
    value: "custom value",
  }),
  builder.dateTimeElement({
    element: { id: "cb6cd7d6-855c-45b3-ad59-7c25844e85cd" },
    value: "1993-01-01T00:00:00.000Z",
    display_timezone: null,
  }),
  builder.linkedItemsElement({
    element: { id: "72e5bb70-079c-469a-89f4-b8aba9b75551" },
    value: [
      { external_id: "item1ExternalId" },
      { id: "e427d105-dd99-4f09-b293-d2c5dfbf5e2d" },
    ],
  }),
  builder.multipleChoiceElement({
    element: { id: "dff67dce-c23f-4366-94dd-b9f565bb6d2c" },
    value: [
      { id: "d61b01fc-fe7f-4c25-915b-b003c21c55b3" },
      { codename: "option2" },
    ],
  }),
  builder.numberElement({
    element: { id: "9a305614-9175-443b-9bf6-61adaf3280d6" },
    value: 234,
  }),
  builder.richTextElement({
    element: { id: "2e460e16-e006-4726-848b-9912c413d947" },
    value: "<p>rich value</p>",
    components: [],
  }),
  builder.taxonomyElement({
    element: { id: "f870da17-761e-49fe-a546-e52be730b05e" },
    value: [
      { codename: "term1Codename" },
      { id: "f86b6373-d022-4baa-be0c-6153a3c0031d" },
    ],
  }),
  builder.textElement({
    element: { id: "24b667e6-f543-48fb-b144-cdbcb3be011c" },
    value: "super duper text",
  }),
  builder.urlSlugElement({
    element: { id: "c6408e22-5db7-464a-ad6d-5952a803743b" },
    value: "url_slug_value",
    mode: "custom",
  }),
];

const typeElements: (ElementContracts.IContentTypeElementContract & {
  readonly options?: ReadonlyArray<
    Readonly<{ name: string; codename?: string; id?: string }>
  >;
})[] = [
    {
      type: "asset",
      codename: "asset_el",
      id: "b81ac159-eef9-4962-ae23-87b6145abd4d",
      name: "asset element",
    },
    {
      type: "custom",
      codename: "custom_el",
      id: "b5d85814-44e7-4c4d-a15e-fa6fdc2405e9",
      name: "custom element",
    },
    {
      type: "date_time",
      codename: "date_time_el",
      id: "cb6cd7d6-855c-45b3-ad59-7c25844e85cd",
      name: "date_time element",
    },
    {
      type: "modular_content",
      codename: "modular_content_el",
      id: "72e5bb70-079c-469a-89f4-b8aba9b75551",
      name: "linked items element",
    },
    {
      type: "multiple_choice",
      codename: "multiple_choice_el",
      id: "dff67dce-c23f-4366-94dd-b9f565bb6d2c",
      name: "multiple choice element",
      options: [
        { name: "Option 1", id: "d61b01fc-fe7f-4c25-915b-b003c21c55b3" },
        { name: "Option 2", codename: "option2" },
      ],
    },
    {
      type: "number",
      codename: "number_el",
      id: "9a305614-9175-443b-9bf6-61adaf3280d6",
      name: "number element",
    },
    {
      type: "rich_text",
      codename: "rich_text_el",
      id: "2e460e16-e006-4726-848b-9912c413d947",
      name: "rich text element",
    },
    {
      type: "taxonomy",
      codename: "taxonomy_el",
      id: "f870da17-761e-49fe-a546-e52be730b05e",
      name: "taxonomy element",
    },
    {
      type: "text",
      codename: "text_el",
      id: "24b667e6-f543-48fb-b144-cdbcb3be011c",
      name: "text element",
    },
    {
      type: "url_slug",
      codename: "url_slug_el",
      id: "c6408e22-5db7-464a-ad6d-5952a803743b",
      name: "url slug element",
    },
  ];

const rawContentType: ContentTypeContracts.IContentTypeContract = {
  id: "f14de016-4d57-475d-a855-b12967294a51",
  name: "Test content type",
  codename: "test_content_type",
  elements: typeElements,
  last_modified: createUTCDate(1348, 4, 7).toISOString(),
};

const rawLanguage: LanguageContracts.ILanguageModelContract = {
  id: "ed733acb-e1e2-4c82-bfe4-ae82f73908f9",
  name: "Test language",
  codename: "test_language",
  is_active: true,
  is_default: true,
};
