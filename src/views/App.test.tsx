import {render} from '@stripe/ui-extension-sdk/testing';
import {Button} from '@stripe/ui-extension-sdk/ui';
import App from './App';

describe('App', () => {
  it('changes button text when pressed', async () => {
    const {wrapper, update} = render(<App />);

    // Expect that the initial text is correct
    expect(wrapper.find(Button)).toContainText('Renew Order');

    // Press the button
    wrapper.find(Button)!.trigger('onPress');

    // This is needed if the "onPress" handler involves something asyncronous
    // like a promise or a React useEffect hook
    await update();
    

    //console.log(updatedSubscription.prebilling);
    console.log("testing");

    // Expect that the text changed
    expect(wrapper.find(Button)).toContainText('Order renewed!');
  });
});