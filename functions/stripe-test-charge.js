require("dotenv").config();

const stripe = new (require("stripe"))(process.env.STRIPE_SECRET_KEY)

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event, context) => {
  
  console.log("Function : stripe-test-charge : handler running ! ")
  console.log(`STRIPE_SECRET_KEY : ${process.env.STRIPE_SECRET_KEY}`)
  
  if (!event.body || event.httpMethod !== "POST") {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        status: "invalid http method"
      })
    };
  }

  console.log("Parsing event.body data ! ")
  const data = JSON.parse(event.body);

  if (!data.stripeToken || !data.stripeAmt || !data.stripeIdempotency) {
    console.error("Required information is missing.");

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        status: "missing information"
      })
    };
  }

  console.log("Start Stripe Payment Processing !")
  // stripe payment processing begins here
  try {
    await stripe.customers
      .create({
        email: data.stripeEmail,
        // only need id from tokoen object
        source: data.stripeToken.id
      })
      .then(customer => {
        console.log(
          `starting the charges, amt: ${data.stripeAmt}, email: ${data.stripeEmail}`
        );
        return stripe.charges
          .create(
            {
              currency: "usd",
              amount: data.stripeAmt,
              receipt_email: data.stripeEmail,
              customer: customer.id,
              description: "Sample Charge"
            },
            {
              idempotency_key: data.stripeIdempotency
            }
          )
          .then(result => {
            //console.log(`Charge created: ${result}`);
            console.log("Stripe Charge Created OK !")
          });
      });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: "it works! beep boop"
      })
    };
  } catch (err) {
    console.log(err);

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        status: err
      })
    };
  }
};
