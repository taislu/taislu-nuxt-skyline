import axios from "axios";
import uuidv1 from "uuid/v1";
import { data } from "../storedata.js";

export const state = () => ({
  cartUIStatus: "idle",
  storedata: data,
  cart: []
});

export const getters = {
  //featuredProducts: state => state.storedata.slice(0, 3),
  featuredProducts: state => state.storedata.slice(6, 9),
  women: state => state.storedata.filter(el => el.gender === "Female"),
  men: state => state.storedata.filter(el => el.gender === "Male"),

  cartCount: state => {
    if (!state.cart.length) return 0;
    return state.cart.reduce((ac, next) => ac + next.quantity, 0);
  },
  cartTotal: state => {
    if (!state.cart.length) return 0;
    return state.cart.reduce((ac, next) => ac + next.quantity * next.price, 0);
  }
};

export const mutations = {
  updateCartUI: (state, payload) => {
    state.cartUIStatus = payload;
  },
  clearCart: state => {
    //this clears the cart
    (state.cart = []), (state.cartUIStatus = "idle");
  },
  addToCart: (state, payload) => {
    let itemfound = state.cart.find(el => el.id === payload.id);
    itemfound
      ? (itemfound.quantity += payload.quantity)
      : state.cart.push(payload);
  }
};

export const actions = {

  async postStripeFunction({ getters, commit }, payload) {
    commit("updateCartUI", "loading");
    //console.log("payload.data.token : ", payload.data.token)
    try {
      await axios
        .post(
          //"https://taislu-nuxt-skyline.netlify.com/.netlify/functions/index",
          "https://taislu-nuxt-skyline.netlify.com/.netlify/functions/stripe-test-charge",
          {
            stripeEmail: payload.stripeEmail,
            stripeAmt: Math.floor(getters.cartTotal * 100), //it expects the price in cents, as an integer
            stripeToken: payload.data.token,
            stripeIdempotency: uuidv1() //we use this library to create a unique id
          },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        )
        .then(res => {
          if (res.status === 200) {
            commit("updateCartUI", "success");
            setTimeout(() => commit("clearCart"), 5000);
          } else {
            commit("updateCartUI", "failure");
            // allow them to try again
            setTimeout(() => commit("updateCartUI", "idle"), 5000);
          }

          console.log(JSON.stringify(res, null, 2));
        });
    } catch (err) {
      console.log(err);
      commit("updateCartUI", "failure");
    }
  }
};
