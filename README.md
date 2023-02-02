# Form Builder

## Making a payment

_Context: You need to redirect to the payment form screen with a specific amount to make a payment._

The `component-form` component may be overwhelming but with this simple hack you can redirect to the payment screen to make a payment easily. From the current screen, redirect to the payment screen and specify the amount in the route's state data.

```javascript
history.push(`/dashboards/payments-board#makeapayment`, {
    routeData: {
        quickPayment: {
            totalAmount: restoreDuesTotal,
            /*
                this property can be used to set @paymentFee field to 0$ and disabled.
                'YES' | 'NO'
            */
            doNotChargeCAF: 'YES',
            /*
                this property can be used to disable the 'Select Payment Type' option
                true | false
            */
            disablePaymentType: true,
        },
    },
});
```

The state of the `/dashboards/payments-board#makeapayment` route should be in the shape of,

```javascript
{
    routeData: {
        quickPayment: {
            totalAmount: 20;
            doNotChargeCAF: 'YES' | 'NO';
            disablePaymentType: true | false,
        }
    }
}
```

---
