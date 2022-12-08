import {ContextView} from "@stripe/ui-extension-sdk/ui";
import type { ExtensionContextValue } from "@stripe/ui-extension-sdk/context";
import {Button} from '@stripe/ui-extension-sdk/ui';
import {Icon} from '@stripe/ui-extension-sdk/ui';
import { showToast } from "@stripe/ui-extension-sdk/utils";
import {Select, Box, Inline} from '@stripe/ui-extension-sdk/ui';
import BrandIcon from "./brand_icon.svg";
import {createHttpClient, STRIPE_API_KEY} from '@stripe/ui-extension-sdk/http_client';
import Stripe from 'stripe';
import {useState, useEffect, useCallback } from 'react';

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
  const [isPressed, setIsPressed] = useState(false);
  const [isPrebilled, setIsPrebilled] = useState(false);
  let setIterations = 1;
  let subcriptionScheduleId ='';
  const BASE_URL =
    environment.mode == "test"
      ? `https://dashboard.stripe.com/${environment.mode}`
      : `https://dashboard.stripe.com`;

  // Stripe object ID of the current view point - This app should pick up the customer object Id.
  console.log(environment.objectContext?.id)
 
  //---------------------------- Backend - Stripe API ---------------------------------

  // 1. Validate if prebilling is enabled for Subscription Schedules and get the Subscription schedule Id
   const isPrebillingEnabled = useCallback(async () => {
    const subscriptionScheduleResponse = await stripe.subscriptionSchedules.list({ 
          customer: environment.objectContext?.id,
        });
      console.log(subscriptionScheduleResponse)
      subcriptionScheduleId = subscriptionScheduleResponse. data[0].id
      if(subscriptionScheduleResponse.data[0].prebilling.invoice)
        setIsPrebilled(true);
    }, []);

  // 2. Update Subscription Schedule with prebilling
  const createPrebill = () => {
    const subcriptionScheduleData = stripe.subscriptionSchedules.update(
      subcriptionScheduleId,
      { prebilling: {
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
        showToast("Prebilling enabled", {type: "success"})
        setIsPrebilled(true);
        //return response.json()
      })
      .catch((error) => {
        showToast(error.message.substring(0,29), {type: "caution"})
      })
    }

 
  //---------------------------- Front end - View Components---------------------------------

  
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
    <Select name="prebill-001" form="number" label="Choose the number of years to prebill"
    onChange={(e) => {
      setIterations = parseInt(e.target.value);
    }}>
        <option value="">Choose an option</option>
        <option value="1">1</option>
    </Select>
    <Box
      css={{
        padding: 'xxlarge',
        color: 'secondary',
        background: 'container',
        borderRadius: 'small',
      }}
    >
      <Button type="primary" disabled={isPrebilled? true:false} onPress={handleClick}>
        <Icon name="recurring" />
        {isPrebilled ? 'Order Prebilled Already!' : 'Prebill Order'}
      </Button>
    </Box>
    </ContextView>
  );
};

export default App;



