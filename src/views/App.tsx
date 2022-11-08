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
  var setIterations = 1;
  const BASE_URL =
    environment.mode == "test"
      ? `https://dashboard.stripe.com/${environment.mode}`
      : `https://dashboard.stripe.com`;
  
      console.log(environment.objectContext?.id)
  //Get Current Subscriptions details
  const getSubscription = useCallback(async () => {
  const data = await stripe.subscriptions.retrieve(environment.objectContext?.id);
    console.log(data)
    if(data.prebilling.invoice)
      setIsPrebilled(true);
  }, []);

  useEffect(() => {
    getSubscription();
  }, [getSubscription]);

  const createPrebill = () => {
    // Call the Stripe API to renew the subscription with prebilling for 1 iteration
    // If the user has permission to update subscription, this should succeed.
    const subcriptionData = stripe.subscriptions.update(
      // We can use the current objectContext to get the Subscription ID.
      environment.objectContext?.id,
      { prebilling: {
          iterations: setIterations,
        }
      }
    );
    return subcriptionData
  }
  const handleClick = () => {
    // Function 1
    createPrebill()
      .then((response) => {
        showToast("Subscription updated", {type: "success"})
        return response.json()
      })
      .catch(() => {
        showToast("Subscription could not be updated", {type: "caution"})
      })
    // Function 2
    setIsPrebilled(true);
    }
  //View Components//
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
        <option value="2">2</option>
        <option value="3">3</option>
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
        {isPrebilled ? 'Order renewed!' : 'Renew Order'}
      </Button>
    </Box>
    </ContextView>
  );
};

export default App;



