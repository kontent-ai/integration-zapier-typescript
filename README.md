# Zapier CLI Integration

Source code for the Zapier integration with Kentico Kontent

## Integrations

This integration contains 4 triggers, 4 actions, and 2 searches:

- __Triggers__
    - Variant workflow step change
    - Variant published status change
    - Variant created or deleted
    - Taxonomy group changed
- __Actions__
    - Create content item
    - Change variant workflow step
    - Update language variant
    - Delete language variant
- __Searches__
    - Find content item
    - Find workflow step

## Creating a trigger in Zapier

Using the Kentico Kontent integration, you only need to configure the Zap in Zapier. The creation of the webhook in Kontent is handled automatically by the integration; the webhook will be created when you turn on the Zap, and deleted when you turn it off.

1. Create a new Zap: https://zapier.com/app/zaps.
2. In the _Choose App & Event_ field, search for `Kentico Kontent` then choose your trigger.

![step 1](./images/step1.png)

3. Click __Continue__ then __Sign in to Kentico Kontent__ on the next screen. You can find the credentials on the _API Keys_ page in Kontent.

![sign in](./images/authenticate.png)

4. Configure the conditions for your trigger. Most triggers have multiple events that can be "listened" to, and you can select multiple options or leave the field empty for all events.  
  Triggers will output the language variant or taxonomy group which fired the webhook as its output. However, each trigger also contains an __Addtional Step Output__ field where you can choose to output more data from the step, if you need it in later steps. For example, choosing _Raw JSON of variant_ will return the Delivery response for an item allowing you to access the `modular_content` later on.

5. Click __Test and Review__ to get a sample item from your Kontent project. This allows you to configure later steps using fields from your content items.

## Example - Google calendar

Let's say your company manages events for a client. At this point, you've been using Kentico Kontent to store information about the events, but you've been manually creating the event in Google Calendar and emailing the attendees. We can now use Zapier to do this for us whenever a new event is published.

### Content types in Kontent

To start, we should have an __Event__ content type with 2 content groups- one for the event details:

![event details](./images/eventdetails.png)

and one for the attendees, a notification option, and a note:

![event attendees](./images/eventattendees.png)

The event's `attendee_list` is a linked item element which can only contain items from your __Contact__ content type:

![contact type](./images/contact.png)

### Creating the Zap

To reduce the amount of manual work that needs to be done, we want Zapier to create a calendar item and send emails whenever an Event is published in Kontent. The final product will look like this:

![all steps](./images/steps.png)

#### Step 1

Of course, we start with the trigger. For the __Trigger event__ choose _Variant published status change_. In the configuration of the step, set the following:

![step 1 configuration](./images/step1config.png)

Under __Webhook Name__ you can enter any value you'd like such as "Google Calendar Event Creation" which will appear in Kontent's Webhooks page, or you can leave it empty to use the default "Variant published status changed (Zapier)."

We need to select _Raw JSON of variant_ in the __Additional Step Output__ field so that we can parse the attendees modular content in the next step.

#### Step 2

Next we can use a __Code by Zapier__ step to set some variables to use in later steps. If you're not familiar with the basics of code steps, please read [Zapier's documentation](https://zapier.com/apps/code/help). In the __Input data__ field we can load some values from the trigger to use in javascript:

- __json__: The raw JSON of the item, used to load the modular content (attendees).
- __attendees__: The value of the `attendee_list` element, which contains the codenames of the linked items.
- __notify__: the value of the `notify_attendees` element, which will contain a value only if the box was checked.

We need to know a little javascript here. Use JSON to parse the `modular_content` object, then use `Object.values()` to create an array. Filter the array so that only contacts from the `attendees` variable remain, then `map` the email addresses to a new array:

```js
let modular = JSON.parse(inputData.json).modular_content;
modular = Object.values(modular);
modular = modular.filter(m => inputData.attendees.includes(m.system.id));
const emails = modular.map(m => m.elements.email.value);
```

Finally, we'll check whether `notify` has any value and save that for the email step of our Zap. Use the `output` variable to save our 2 objects:

```js
const notify = inputData.notify !== undefined;
output = [{emails: emails, notify: notify}];
```

The finished step should look like this:

![step 2 configuration](./images/step2config.png)

#### Step 3

Our next step is to create the Google Calendar event. In __Choose App & Event__ select _Google Calendar_ and _Create Detailed Event_. On the next screen, you'll need to authorize a Google Account which has access to the calendar you wish to modify.

On the __Customize Detailed Event__ screen, select your calendar then use data from step 1 to populate these fields:

![step 3 configuration](./images/step3config.png)

In the _Attendees_ field we're loading the comma-separated email addresses we parsed from `modular_content` in step 2. From the screenshot it seems as if email addresses need to be added individually to separate lines, but the comma-separated value also works fine.

#### Step 4

The above step will create the calendar event, but doesn't email attendees about its creation. We'll make a separate step for that, but we only want to email the attendees if the event had the __Notify attendees__ box checked. We converted that value to a `boolean` in step 2, so now we can use a __Filter by Zapier__ step.

In the _Only continue if..._ field, select the `notify` variable we output in step 2, and the condition _(Boolean) Is true_.

![step 4 configuration](./images/step4config.png)

#### Step 5

For the final step, choose the __Gmail__ App and the __Send email__ action. Authorize the account that will send the emails, then populate the email with values from step 1. Again, we can use the comma-separated list of email addresses from step 2 in the __To__ field of the email:

![step 5 configuration](./images/step5config.png)

#### Turning on the Zap

We're pretty much done- turn on the Zap to create the webhook in Kontent. If the On/Off switch is greyed-out in Zapier, you most likely need to test one of the steps (or, choose __Skip test__). All steps should have a green check mark in the top-left corner.

When the Zap is turned on, you should see this in Kontent:

![webhook](./images/webhook.png)

The endpoint and secret are automatically generated by the Zapier integration and will start to work immediately. __Do not change the secret!__ Webhook signatures are automatically validated by the integration for your security, but it relies on using this exact secret which is generated by hashing several values.

You can now test the Zap by publishing an Event content item in Kontent which has some Contacts linked as attendees. After a short time, you should see the "dot" next to the webhook turn green indicating that the POST was sent to Zapier. In Zapier, you can check __Task History__ in the right sidebar to check whether the Zap executed successfully:

![history](./images/history.png)