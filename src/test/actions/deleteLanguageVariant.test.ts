import { createAppTester } from "zapier-platform-core";
import * as nock from "nock";
import { addInputData, mockBundle } from "../utils/mockBundle";
import {
  ContentItemContracts,
  ContentTypeContracts,
  LanguageContracts,
  LanguageVariantContracts,
  ManagementClient,
} from "@kontent-ai/management-sdk";
import App from "../../index";
import { KontentBundle } from "../../types/kontentBundle";
import {
  deleteLanguageVariant,
  InputData,
} from "../../actions/deleteLanguageVariant";
import { createUTCDate } from "../utils/date";
import { mockSnippetsRequest } from "../utils/mockSnippetsRequest";
import { mockLanguageRequest } from "../utils/mockLanguageRequest";

const appTester = createAppTester(App);
nock.disableNetConnect();

afterEach(() => nock.cleanAll());

describe("deleteLanguageVariant", () => {
  it("deletes language variant through CM API", async () => {
    const bundle: KontentBundle<
      Omit<InputData, "searchField" | "searchValue">
    > = addInputData(mockBundle, {
      languageId: rawVariant.language.id || "",
      searchPattern: "{0}={1}",
    });

    const client = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    });

    const expectedVariantRequest = client
      .viewLanguageVariant()
      .byItemId(rawVariant.item.id || "")
      .byLanguageId(rawVariant.language.id || "");

    nock(expectedVariantRequest.getUrl())
      .get("")
      .reply(200, rawVariant)
      .persist();

    mockSnippetsRequest(client);

    mockLanguageRequest(client, rawLanguage);

    const expectedContentTypeRequest = client
      .viewContentType()
      .byTypeId(rawContentType.id);
    nock(expectedContentTypeRequest.getUrl())
      .get("")
      .reply(200, rawContentType)
      .persist();

    const expectedDeleteRequest = client
      .deleteLanguageVariant()
      .byItemId(rawItem.id)
      .byLanguageId(rawVariant.language.id || "");
    nock(expectedDeleteRequest.getUrl()).delete("").reply(204).persist();

    const search = App.creates[deleteLanguageVariant.key].operation.perform;

    const expectedByIdRequest = client.viewContentItem().byItemId(rawItem.id);
    nock(expectedByIdRequest.getUrl()).get("").reply(200, rawItem);

    const resultById = await appTester(
      search,
      addInputData(bundle, { searchField: "id", searchValue: rawItem.id })
    );

    expect(resultById).toMatchInlineSnapshot(`
      {
        "elements": {},
        "modular_content": "[]",
        "system": {
          "codename": "some_item_name",
          "contentTypeId": "22d83f4d-dec4-458b-8ef8-fc4a05761524",
          "externalId": "item_external_id",
          "fullId": "9d309f21-5326-42e3-ab12-0c4a5e9db64d/e3a742b4-a946-4baa-bf93-39ad1d13834b",
          "id": "9d309f21-5326-42e3-ab12-0c4a5e9db64d",
          "language": "sample_language",
          "languageId": "e3a742b4-a946-4baa-bf93-39ad1d13834b",
          "lastModified": "1316-05-14T00:00:00.000Z",
          "name": "Some Item Name",
          "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
          "type": "sample_content_type",
          "workflowStepId": "6b7590d5-75e5-4860-8cc0-02c5bffce2dc",
        },
      }
    `);

    const expectedByCodenameRequest = client
      .viewContentItem()
      .byItemCodename(rawItem.codename);
    nock(expectedByCodenameRequest.getUrl()).get("").reply(200, rawItem);

    const resultByCodename = await appTester(
      search,
      addInputData(bundle, {
        searchField: "system.codename",
        searchValue: rawItem.codename,
      })
    );

    expect(resultByCodename).toMatchInlineSnapshot(`
      {
        "elements": {},
        "modular_content": "[]",
        "system": {
          "codename": "some_item_name",
          "contentTypeId": "22d83f4d-dec4-458b-8ef8-fc4a05761524",
          "externalId": "item_external_id",
          "fullId": "9d309f21-5326-42e3-ab12-0c4a5e9db64d/e3a742b4-a946-4baa-bf93-39ad1d13834b",
          "id": "9d309f21-5326-42e3-ab12-0c4a5e9db64d",
          "language": "sample_language",
          "languageId": "e3a742b4-a946-4baa-bf93-39ad1d13834b",
          "lastModified": "1316-05-14T00:00:00.000Z",
          "name": "Some Item Name",
          "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
          "type": "sample_content_type",
          "workflowStepId": "6b7590d5-75e5-4860-8cc0-02c5bffce2dc",
        },
      }
    `);

    const expectedByExternalIdRequest = client
      .viewContentItem()
      .byItemExternalId(rawItem.external_id || "");
    nock(expectedByExternalIdRequest.getUrl()).get("").reply(200, rawItem);

    const resultByExternalId = await appTester(
      search,
      addInputData(bundle, {
        searchField: "externalId",
        searchValue: rawItem.external_id || "",
      })
    );

    expect(resultByExternalId).toMatchInlineSnapshot(`
      {
        "elements": {},
        "modular_content": "[]",
        "system": {
          "codename": "some_item_name",
          "contentTypeId": "22d83f4d-dec4-458b-8ef8-fc4a05761524",
          "externalId": "item_external_id",
          "fullId": "9d309f21-5326-42e3-ab12-0c4a5e9db64d/e3a742b4-a946-4baa-bf93-39ad1d13834b",
          "id": "9d309f21-5326-42e3-ab12-0c4a5e9db64d",
          "language": "sample_language",
          "languageId": "e3a742b4-a946-4baa-bf93-39ad1d13834b",
          "lastModified": "1316-05-14T00:00:00.000Z",
          "name": "Some Item Name",
          "projectId": "ae6f7ad5-766c-4b03-a118-56f65e45db7b",
          "type": "sample_content_type",
          "workflowStepId": "6b7590d5-75e5-4860-8cc0-02c5bffce2dc",
        },
      }
    `);
  });
});

const rawLanguage: LanguageContracts.ILanguageModelContract = {
  id: "e3a742b4-a946-4baa-bf93-39ad1d13834b",
  name: "Sample language",
  codename: "sample_language",
  is_default: false,
  is_active: true,
};

const rawContentType: ContentTypeContracts.IContentTypeContract = {
  id: "22d83f4d-dec4-458b-8ef8-fc4a05761524",
  name: "Sample content type",
  codename: "sample_content_type",
  last_modified: createUTCDate(1212, 9, 26).toISOString(),
  elements: [],
};

const rawItem: ContentItemContracts.IContentItemModelContract = {
  id: "9d309f21-5326-42e3-ab12-0c4a5e9db64d",
  name: "Some Item Name",
  codename: "some_item_name",
  collection: { id: "1da391cf-d664-4492-a8f4-74420a08a069" },
  type: { id: rawContentType.id },
  external_id: "item_external_id",
  last_modified: createUTCDate(1355, 4, 5),
  spaces: [],
};

const rawVariant: LanguageVariantContracts.ILanguageVariantModelContract = {
  item: { id: rawItem.id },
  language: { id: rawLanguage.id },
  elements: [],
  last_modified: createUTCDate(1316, 5, 14).toISOString(),
  workflow: {
    workflow_identifier: { codename: "default" },
    step_identifier: { id: "6b7590d5-75e5-4860-8cc0-02c5bffce2dc" },
  },
  contributors: [],
  due_date: { value: null },
  schedule: {
    publish_display_timezone: null,
    publish_time: null,
    unpublish_display_timezone: null,
    unpublish_time: null,
  },
};
