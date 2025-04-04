import { createAppTester } from "zapier-platform-core";
import * as nock from "nock";
import App from "../../index";
import triggerItemExistenceChanged, {
  InputData,
} from "../../triggers/triggerWebhookFired";
import { KontentBundle } from "../../types/kontentBundle";
import { mockBundle } from "../utils/mockBundle";
import {
  ManagementClient,
  WebhookContracts,
  WebhookModels,
} from "@kontent-ai/management-sdk";
import { createUTCDate } from "../utils/date";

const appTester = createAppTester(App);
nock.disableNetConnect();

afterEach(() => nock.cleanAll());

describe("triggerWebhookFired", () => {
  it("creates new webhook upon through CM API upon subscribe", async () => {
    const bundle: KontentBundle<InputData> = {
      ...mockBundle,
      inputData: {
        ...mockBundle.inputData,
        name: "Simple test name for webhook",
        source: "published",
        watchedEvents: [
          "item_created",
          "item_changed",
          "item_deleted",
          "type_created",
        ],
        itemTypeFilter: ["cd54f362-c532-4df8-be8c-969fc1db97ba"],
        itemCollectionFilter: ["17bb2114-476a-43be-87cb-95fea70dce6e"],
        taxonomyFilter: ["17bb2114-476a-43be-87cb-95fea70dce6e"],
      } satisfies InputData,
      targetUrl: "https://test-url.test",
    };

    const expectedName = `${bundle.inputData.name} (Zapier)`;

    const expectedWebhook = {
      name: expectedName,
      url: bundle.targetUrl || "",
      secret: "EwUwJR6JM1lJrfljsQ1Uvebbav5RU9Y9eOG5E9L86OY=",
      delivery_triggers: {
        events: "specific",
        slot: "published",
        content_item: {
          enabled: true,
          actions: [
            { action: "created" },
            { action: "changed" },
            { action: "deleted" },
          ],
          filters: {
            content_types: [{ id: "cd54f362-c532-4df8-be8c-969fc1db97ba" }],
            collections: [{ id: "17bb2114-476a-43be-87cb-95fea70dce6e" }],
          },
        },
        content_type: {
          enabled: true,
          actions: [{ action: "created" }],
          filters: {},
        },
        taxonomy: {
          enabled: true,
          actions: [
            { action: "metadata_changed" },
            { action: "created" },
            { action: "deleted" },
            { action: "term_changed" },
            { action: "term_created" },
            { action: "term_deleted" },
            { action: "terms_moved" },
          ],
          filters: {
            taxonomies: [{ id: "17bb2114-476a-43be-87cb-95fea70dce6e" }],
          },
        },
      },
    } satisfies WebhookModels.IAddWebhookData;

    const expectedRequest = new ManagementClient({
      environmentId: bundle.authData.projectId,
      apiKey: bundle.authData.cmApiKey,
    })
      .addWebhook()
      .withData(expectedWebhook);

    nock(expectedRequest.getUrl())
      .post("", (body) => {
        expect(body).toEqual(expectedWebhook);
        return true;
      })
      .reply(201, {
        id: "404c8821-d3ba-4794-8cee-853f3952ca99",
        ...expectedWebhook,
        last_modified: createUTCDate(1993, 1, 1).toISOString(),
      } satisfies WebhookContracts.IAddWebhookContract);

    const subscribe =
      App.triggers[triggerItemExistenceChanged.key].operation.performSubscribe;

    const result = await appTester(subscribe, bundle);

    expect(result).toMatchInlineSnapshot(`
      {
        "delivery_triggers": {
          "content_item": {
            "actions": [
              {
                "action": "created",
              },
              {
                "action": "changed",
              },
              {
                "action": "deleted",
              },
            ],
            "enabled": true,
            "filters": {
              "collections": [
                {
                  "id": "17bb2114-476a-43be-87cb-95fea70dce6e",
                },
              ],
              "content_types": [
                {
                  "id": "cd54f362-c532-4df8-be8c-969fc1db97ba",
                },
              ],
            },
          },
          "content_type": {
            "actions": [
              {
                "action": "created",
              },
            ],
            "enabled": true,
            "filters": {},
          },
          "events": "specific",
          "slot": "published",
          "taxonomy": {
            "actions": [
              {
                "action": "metadata_changed",
              },
              {
                "action": "created",
              },
              {
                "action": "deleted",
              },
              {
                "action": "term_changed",
              },
              {
                "action": "term_created",
              },
              {
                "action": "term_deleted",
              },
              {
                "action": "terms_moved",
              },
            ],
            "enabled": true,
            "filters": {
              "taxonomies": [
                {
                  "id": "17bb2114-476a-43be-87cb-95fea70dce6e",
                },
              ],
            },
          },
        },
        "id": "404c8821-d3ba-4794-8cee-853f3952ca99",
        "last_modified": "1993-01-01T00:00:00.000Z",
        "name": "Simple test name for webhook (Zapier)",
        "secret": "EwUwJR6JM1lJrfljsQ1Uvebbav5RU9Y9eOG5E9L86OY=",
        "url": "https://test-url.test",
      }
    `);
  });
});
