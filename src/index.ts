import { Authentication } from './authentication';
import { version } from 'zapier-platform-core';
import getContentItems from './triggers/dropdowns/getContentItems';
import getLinkedItems from './triggers/dropdowns/getLinkedItems';
import getContentTypes from './triggers/dropdowns/getContentTypes';
import getWorkflowSteps from './triggers/dropdowns/getWorkflowSteps';
import getLanguages from './triggers/dropdowns/getLanguages';
import findContentItem from './searches/findContentItem';
import findWorkflowStep from './searches/findWorkflowStep';
import { findLanguage } from './searches/findLanguage';
import { findAsset } from './searches/findAsset';
import { changeContentItemWorkflow } from './actions/changeContentItemWorkflow';
import { updateLanguageVariant } from './actions/updateLanguageVariant';
import { createContentItem } from './actions/createContentItem';
import { deleteLanguageVariant } from './actions/deleteLanguageVariant';
import triggerWebhookFired from './triggers/triggerWebhookFired';

// We can roll up all our behaviors in an App.
export default {
    // This is just shorthand to reference the installed dependencies you have. Zapier will
    // need to know these before we can upload
    version: require('../package.json').version,
    platformVersion: version,

    authentication: Authentication,

    // beforeRequest & afterResponse are optional hooks into the provided HTTP client
    beforeRequest: [],

    afterResponse: [],

    // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
    resources: {},

    // If you want your trigger to show up, you better include it here!
    triggers: {
        [triggerWebhookFired.key]: triggerWebhookFired,

        // Lists for dropdowns
        [getLinkedItems.key]: getLinkedItems,
        [getContentTypes.key]: getContentTypes,
        [getContentItems.key]: getContentItems,
        [getWorkflowSteps.key]: getWorkflowSteps,
        [getLanguages.key]: getLanguages,
    },

    // If you want your searches to show up, you better include it here!
    searches: {
        [findContentItem.key]: findContentItem,
        [findWorkflowStep.key]: findWorkflowStep,
        [findLanguage.key]: findLanguage,
        [findAsset.key]: findAsset,
    },

    // If you want your creates to show up, you better include it here!
    creates: {
        [createContentItem.key]: createContentItem,
        [changeContentItemWorkflow.key]: changeContentItemWorkflow,
        [updateLanguageVariant.key]: updateLanguageVariant,
        [deleteLanguageVariant.key]: deleteLanguageVariant,
    },

    searchOrCreates: {
        find_item: {
            search: 'find_item',
            create: 'create_item',
            key: 'find_item',
            display: {
                'description': 'Finds a content item matching the provided parameters. If more items match, it returns the first found item.',
                'label': 'Find or create content item'
            }
        }
    }
};
