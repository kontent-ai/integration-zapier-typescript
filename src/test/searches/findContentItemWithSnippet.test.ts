import { createAppTester } from "zapier-platform-core";
import * as nock from "nock";
import { addInputData, mockBundle } from "../utils/mockBundle";
import {
  ContentItemContracts,
  ContentTypeContracts,
  ContentTypeSnippetContracts,
  LanguageContracts,
  ManagementClient,
} from "@kontent-ai/management-sdk";
import App from "../../index";
import { KontentBundle } from "../../types/kontentBundle";
import { LanguageVariantContracts } from "@kontent-ai/management-sdk/lib/contracts";
import { Contracts, DeliveryClient } from "@kontent-ai/delivery-sdk";
import findContentItem, { InputData } from "../../searches/findContentItem";
import { createUTCDate } from "../utils/date";
import { mockSnippetsRequest } from "../utils/mockSnippetsRequest";
import { mockLanguageRequest } from "../utils/mockLanguageRequest";

const appTester = createAppTester(App);
nock.disableNetConnect();

afterEach(() => nock.cleanAll());

describe("findContentItem", () => {
  it("returns content item with snippet returned from the CM API found by id", async () => {
    const bundle: KontentBundle<
      Omit<InputData, "searchField" | "searchValue">
    > = addInputData(mockBundle, {
      contentTypeId: rawContentType.id,
      languageId: rawLanguage.id,
      searchPattern: "{0}={1}",
      searchInfo: "",
    });

    const managementClient = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    });

    const expectedTypeRequest = managementClient
      .viewContentType()
      .byTypeId(rawContentType.id);

    nock(expectedTypeRequest.getUrl())
      .get("")
      .reply(200, rawContentType)
      .persist();

    mockLanguageRequest(managementClient, rawLanguage);

    mockSnippetsRequest(managementClient, rawSnippets);

    const expectedItemByIdQuery = managementClient
      .viewContentItem()
      .byItemId(rawContentItem.id);

    nock(expectedItemByIdQuery.getUrl())
      .get("")
      .reply(200, rawContentItem)
      .persist();

    const expectedItemByCodenameQuery = managementClient
      .viewContentItem()
      .byItemCodename(rawContentItem.codename);

    nock(expectedItemByCodenameQuery.getUrl())
      .get("")
      .reply(200, rawContentItem)
      .persist();

    const expectedItemByExternalIdQuery = managementClient
      .viewContentItem()
      .byItemExternalId(rawContentItem.external_id || "");

    nock(expectedItemByExternalIdQuery.getUrl())
      .get("")
      .reply(200, rawContentItem)
      .persist();

    const expectedVariantsOfItemQuery = managementClient
      .listLanguageVariantsOfItem()
      .byItemId(rawContentItem.id);

    nock(expectedVariantsOfItemQuery.getUrl())
      .get("")
      .reply(200, [rawVariant])
      .persist();

    const expectedItemByElementQuery = new DeliveryClient({
      environmentId: bundle.authData.projectId,
      previewApiKey: "someKey",
    })
      .itemsFeed()
      .withParameter({ getParam: () => `elements.text_snippet=value snippet` })
      .types([rawContentType.codename])
      .queryConfig({ usePreviewMode: true })
      .limitParameter(1)
      .languageParameter(rawLanguage.codename);

    const expectedItemByElementQueryUrl = expectedItemByElementQuery.getUrl();
    nock(
      expectedItemByElementQueryUrl.slice(
        0,
        expectedItemByElementQueryUrl.indexOf("?")
      )
    )
      .get("")
      .query(
        new URLSearchParams(
          expectedItemByElementQueryUrl.slice(
            expectedItemByElementQueryUrl.indexOf("?") + 1
          )
        )
      )
      .reply(200, { items: [rawDeliveryItem], modular_content: {} });


    const search = App.searches[findContentItem.key].operation.perform;

    const byIdResult = await appTester(
      search,
      addInputData(bundle, {
        searchField: "id",
        searchValue: rawContentItem.id,
      })
    );

    expect(byIdResult).toMatchInlineSnapshot(`
      [
        {
          "elements": {
            "text": "greatText",
            "text_snippet": "value snippet",
          },
          "modular_content": "[]",
          "system": {
            "codename": "test_content_item",
            "contentTypeId": "aea2d2cf-f38a-4260-bb95-ac0bcd7587de",
            "externalId": "test_item_external_id",
            "fullId": "0de95e3e-2568-4aec-b996-dc71b1cf2944/2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "id": "0de95e3e-2568-4aec-b996-dc71b1cf2944",
            "language": "test_language",
            "languageId": "2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "lastModified": "1230-12-15T00:00:00.000Z",
            "name": "test content item",
            "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
            "type": "test_content_type",
            "workflowStepId": "89205fc8-bf8e-4bc3-9eb2-725c9623ef40",
          },
        },
      ]
    `);

    const byCodenameResult = await appTester(
      search,
      addInputData(bundle, {
        searchField: "system.codename",
        searchValue: rawContentItem.codename,
      })
    );

    expect(byCodenameResult).toMatchInlineSnapshot(`
      [
        {
          "elements": {
            "text": "greatText",
            "text_snippet": "value snippet",
          },
          "modular_content": "[]",
          "system": {
            "codename": "test_content_item",
            "contentTypeId": "aea2d2cf-f38a-4260-bb95-ac0bcd7587de",
            "externalId": "test_item_external_id",
            "fullId": "0de95e3e-2568-4aec-b996-dc71b1cf2944/2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "id": "0de95e3e-2568-4aec-b996-dc71b1cf2944",
            "language": "test_language",
            "languageId": "2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "lastModified": "1230-12-15T00:00:00.000Z",
            "name": "test content item",
            "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
            "type": "test_content_type",
            "workflowStepId": "89205fc8-bf8e-4bc3-9eb2-725c9623ef40",
          },
        },
      ]
    `);

    const byExternalIdResult = await appTester(
      search,
      addInputData(bundle, {
        searchField: "externalId",
        searchValue: rawContentItem.external_id || "",
      })
    );

    expect(byExternalIdResult).toMatchInlineSnapshot(`
      [
        {
          "elements": {
            "text": "greatText",
            "text_snippet": "value snippet",
          },
          "modular_content": "[]",
          "system": {
            "codename": "test_content_item",
            "contentTypeId": "aea2d2cf-f38a-4260-bb95-ac0bcd7587de",
            "externalId": "test_item_external_id",
            "fullId": "0de95e3e-2568-4aec-b996-dc71b1cf2944/2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "id": "0de95e3e-2568-4aec-b996-dc71b1cf2944",
            "language": "test_language",
            "languageId": "2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "lastModified": "1230-12-15T00:00:00.000Z",
            "name": "test content item",
            "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
            "type": "test_content_type",
            "workflowStepId": "89205fc8-bf8e-4bc3-9eb2-725c9623ef40",
          },
        },
      ]
    `);

    const byElementResult = await appTester(
      search,
      addInputData(bundle, {
        searchField: "elements.text_snippet",
        searchValue: rawVariant.elements[1]?.value.toString() ?? "",
      })
    );

    expect(byElementResult).toMatchInlineSnapshot(`
      [
        {
          "elements": {
            "text": "greatText",
            "text_snippet": "value snippet",
          },
          "modular_content": "[]",
          "system": {
            "codename": "test_content_item",
            "contentTypeId": "aea2d2cf-f38a-4260-bb95-ac0bcd7587de",
            "externalId": "test_item_external_id",
            "fullId": "0de95e3e-2568-4aec-b996-dc71b1cf2944/2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "id": "0de95e3e-2568-4aec-b996-dc71b1cf2944",
            "language": "test_language",
            "languageId": "2493d2af-27cd-4bb0-9f95-862ad58026ff",
            "lastModified": "1230-12-15T00:00:00.000Z",
            "name": "test content item",
            "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
            "type": "test_content_type",
            "workflowStepId": "89205fc8-bf8e-4bc3-9eb2-725c9623ef40",
          },
        },
      ]
    `);
  });
});

const rawContentType: ContentTypeContracts.IContentTypeContract = {
  id: "aea2d2cf-f38a-4260-bb95-ac0bcd7587de",
  name: "test content type",
  codename: "test_content_type",
  last_modified: createUTCDate(1348, 4, 7).toISOString(),
  elements: [
    {
      id: "50702d62-b381-45bd-816e-57bf1ccd2de6",
      type: "text",
      name: "text element",
      codename: "text",
    },
    {
      id: "1e3e3269-6f82-43e0-8304-95653508b90e",
      type: "snippet",
      name: "content snippet",
      codename: "content_snippet"
    }
  ],
};

const rawContentItem: ContentItemContracts.IContentItemModelContract = {
  id: "0de95e3e-2568-4aec-b996-dc71b1cf2944",
  type: { id: rawContentType.id, codename: rawContentType.codename },
  name: "test content item",
  codename: "test_content_item",
  last_modified: createUTCDate(1356, 12, 25),
  collection: { id: "db3ccd21-55db-4ca1-bf85-062538b772c8" },
  external_id: "test_item_external_id",
};

const rawLanguage: LanguageContracts.ILanguageModelContract = {
  id: "2493d2af-27cd-4bb0-9f95-862ad58026ff",
  name: "test language",
  codename: "test_language",
  is_active: true,
  is_default: true,
};

const rawSnippets: ReadonlyArray<ContentTypeSnippetContracts.IContentTypeSnippetContract> = [{
  id: "1e3e3269-6f82-43e0-8304-95653508b90e",
  codename: 'content_snippet',
  last_modified: createUTCDate(1356, 12, 25).toISOString(),
  name: 'test content snippet',
  elements: [
    {
      id: "50702d62-b381-45bd-816e-57bf1ccd2de2",
      type: "text",
      name: "text element",
      codename: "text_snippet",
    },
  ]
}];


const rawVariant: LanguageVariantContracts.IListLanguageVariantsOfItemResponseContract = {
  item: rawContentItem,
  language: rawLanguage,
  last_modified: createUTCDate(1230, 12, 15).toISOString(),
  workflow: {
    workflow_identifier: { codename: "default" },
    step_identifier: { codename: "89205fc8-bf8e-4bc3-9eb2-725c9623ef40" },
  },
  workflow_step: { id: "89205fc8-bf8e-4bc3-9eb2-725c9623ef40" },
  elements: [
    {
      element: {
        id: "50702d62-b381-45bd-816e-57bf1ccd2de6",
        codename: "text",
      },
      value: "greatText",
    },
    {
      element: {
        id: "50702d62-b381-45bd-816e-57bf1ccd2de2",
        codename: "text_snippet",
      },
      value: "value snippet"
    }
  ],
};

const rawDeliveryItem: Contracts.IContentItemContract = {
  system: {
    id: rawContentItem.id,
    codename: rawContentItem.codename,
    type: rawContentType.codename,
    name: rawContentItem.name,
    language: rawLanguage.codename,
    collection: "default",
    workflow_step: rawVariant.workflow_step.id || "",
    workflow: null,
    last_modified: rawVariant.last_modified,
    sitemap_locations: [],
  },
  elements: {
    text_snippet: {
      name: "Text Snippet",
      type: "text",
      value: "value snippet"
    },
    text: {
      name: "text element",
      type: "text",
      value: "greatText"
    }
  }
};
