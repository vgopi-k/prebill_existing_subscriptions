import { ContextView, Divider } from "@stripe/ui-extension-sdk/ui";
import type { ExtensionContextValue } from "@stripe/ui-extension-sdk/context";
import { Button } from '@stripe/ui-extension-sdk/ui';
import { Icon } from '@stripe/ui-extension-sdk/ui';
import { showToast } from "@stripe/ui-extension-sdk/utils";
import { Select, Box, Inline } from '@stripe/ui-extension-sdk/ui';
import BrandIcon from "./brand_icon.svg";
import { createHttpClient, STRIPE_API_KEY } from '@stripe/ui-extension-sdk/http_client';
import Stripe from 'stripe';
import { useState, useEffect, useCallback } from 'react';
import React from "react";

// Initiate communication with the stripe client.
const stripe = new Stripe(STRIPE_API_KEY, {
  httpClient: createHttpClient(),
  apiVersion: '2022-08-01',
})


/**
 * This is a view that is rendered in the Stripe dashboard's customer detail page.
 * In stripe-app.json, this view is configured with stripe.dashboard.customer.detail viewport.
 * You can add a new view by running "stripe apps add view" from the CLI.
 */
const App = ({ userContext, environment }: ExtensionContextValue) => {
  const [isPrebilled, setIsPrebilled] = useState(false);
  const [hasCheckedPrebillState, setHasCheckedPrebillState] = useState(false);
  const [arrSubSchedule, setArrSubSchedule] = useState([]);
  const [selectedSubSched, setSelectedSubSched] = useState(-1);
  let setIterations = 1;
  const BASE_URL =
    environment.mode == "test"
      ? `https://dashboard.stripe.com/${environment.mode}`
      : `https://dashboard.stripe.com`;

  // Stripe object ID of the current view point - This app should pick up the customer object Id.
  console.log('App Context Loaded for: ' + environment.objectContext?.id)

  //---------------------------- Backend - Stripe API ---------------------------------

  // 1. Validate if prebilling is enabled for Subscription Schedules and get the Subscription schedule Id
  const isPrebillingEnabled = useCallback(async () => {
    setIsPrebilled(true);
    setHasCheckedPrebillState(false);
    for await (const subscriptionScheduleResponse of stripe.subscriptionSchedules.list({
      customer: environment.objectContext?.id,
    })) {
      if ((typeof subscriptionScheduleResponse?.prebilling?.invoice == 'undefined')) {
        setIsPrebilled(false);
        arrSubSchedule.push(subscriptionScheduleResponse);
      }
    }
    // set flag that PrebillState has been checked to true;
    setHasCheckedPrebillState(true);
  }, []);

  // 2. Update Subscription Schedule with prebilling
  const createPrebill = () => {
    const subcriptionScheduleData = stripe.subscriptionSchedules.update(
      arrSubSchedule[selectedSubSched]?.id,
      {
        prebilling: {
          iterations: setIterations,
        }
      }
    );
    return subcriptionScheduleData
  }

  //---------------------------- On page load -----------------------------------

  useEffect(() => {
    isPrebillingEnabled();
  }, [isPrebillingEnabled]);


  //---------------------------- Backend - Action Components---------------------------------

  const handleClick = () => {
    // Function 1
    createPrebill()
      .then((response) => {
        showToast("Prebilling enabled", { type: "success" })
        setIsPrebilled(true);
        setSelectedSubSched(-1);
        while (arrSubSchedule.length) { arrSubSchedule.pop(); }
        isPrebillingEnabled();
        //return response.json()
      })
      .catch((error) => {
        showToast(error.message.substring(0, 29), { type: "caution" })
      })
  }


  //---------------------------- Front end - View Components---------------------------------

  // display if multiple schedule
  function SelectSubscriptionSchedule(props) {
    //if not checked prebilled state show message
    if (props.hasCheckedPrebillState == 'false') {
      return (
        <Inline>Checking for Subscription Schedules</Inline>
      )
    }
    else if (arrSubSchedule.length == 1) {
      // else if only one Subscription Schedule, show message for that Subscription Schedule
      setSelectedSubSched(0);
      return (
        <Inline>Modifying Subscription Schedule <Inline css={{
          font: 'body',
          fontWeight: 'semibold',
          marginY: 'large',
        }}>{arrSubSchedule[0]?.id}</Inline>{((typeof arrSubSchedule[0]?.metadata?.salesforce_order_id !== 'undefined') ? " (SF Order ID: " : "")}
          <Inline css={{
            font: 'body',
            fontWeight: 'semibold',
            marginY: 'large',
          }}>{((typeof arrSubSchedule[0]?.metadata?.salesforce_order_id !== 'undefined') ? arrSubSchedule[0]?.metadata?.salesforce_order_id + ")" : "")}</Inline></Inline>
      )
    }
    else if (arrSubSchedule.length < 1) {
      // else if no items in the array, then no prebilled Subscription Schedule
      return (
        <Inline>No Subscription Schedule that hasn't been prebilled</Inline>
      )
    }
    else {
      // otherwise return a select box to choose the appropriate Subscription Schedule
      return (
        <Select name="prebill-ss" form="number" label="Select Subscription Schedule to Pre-Bill" value={selectedSubSched}
          onChange={(e) => {
            setSelectedSubSched(parseInt(e.target.value));
          }}>
          <option value="-1">Choose a Subscription Schedule to modify</option>
          {
            arrSubSchedule.map((val, index) =>
              <option value={index}>{val?.metadata?.salesforce_order_id ? val?.id + " - " + val?.metadata?.salesforce_order_id : val?.id}</option>
            )
          }
        </Select>
      )
    }
  }


  return (
    <ContextView
      title="Pre bill the customer for order renewals"
      brandColor="#F6F8FA" // replace this with your brand color
      brandIcon={BrandIcon} // replace this with your brand icon
      externalLink={{
        label: "View docs",
        href: "https://stripe.com/docs/stripe-apps"
      }}
    >
      <Box
        css={{
          padding: 'xxlarge',
          color: 'secondary',
          background: 'container',
          borderRadius: 'small',
        }}
      >
        <SelectSubscriptionSchedule hasCheckedPrebillState={hasCheckedPrebillState} />
        <Divider />
        <Button type="primary" disabled={isPrebilled || !hasCheckedPrebillState || selectedSubSched < 0 ? true : false} onPress={handleClick}>
          <Icon name="recurring" />
          {isPrebilled && hasCheckedPrebillState ? 'Order Prebilled Already!' : 'Prebill Order'}
        </Button>
      </Box>
    </ContextView>
  );
};

export default App;



