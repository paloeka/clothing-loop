import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe } from "@stripe/react-stripe-js";
import { ChangeEvent, FormEvent, useContext, useState } from "react";

import { useTranslation } from "react-i18next";
import { paymentInitiate, priceIDs } from "../../api/payment";
import FormJup from "../../util/form-jup";
import { ToastContext } from "../../providers/ToastProvider";
import { GinParseErrors } from "../../util/gin-errors";

interface RadioItem {
  value: string;
  cents: number;
  text: string;
  priceID: string;
}

interface FormValues {
  oneoff_radio: string;
  oneoff_custom: string;
  recurring_radio: string;
  email: string;
}

const recurring: RadioItem[] = [
  {
    value: "2_50",
    cents: 250,
    text: "€2.50",
    priceID: priceIDs.recurring_2_50,
  },
  {
    value: "5_00",
    cents: 500,
    text: "€5.00",
    priceID: priceIDs.recurring_5_00,
  },
  {
    value: "10_00",
    cents: 1000,
    text: "€10.00",
    priceID: priceIDs.recurring_10_00,
  },
];
const oneOff: RadioItem[] = [
  { value: "5_00", cents: 500, text: "€5.00", priceID: priceIDs.oneOff_any },
  { value: "10_00", cents: 1000, text: "€10.00", priceID: priceIDs.oneOff_any },
  { value: "20_00", cents: 2000, text: "€20.00", priceID: priceIDs.oneOff_any },
  { value: "50_00", cents: 5000, text: "€50.00", priceID: priceIDs.oneOff_any },
  {
    value: "100_00",
    cents: 10000,
    text: "€100.00",
    priceID: priceIDs.oneOff_any,
  },
];

function DonationFormContent() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const stripe = useStripe();
  const { t } = useTranslation();

  const { addToastError } = useContext(ToastContext);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const values = FormJup<FormValues>(e);

    let radioObj: RadioItem | undefined;

    if (values.email === "") {
      setError("email");
      return;
    }

    if (isRecurring) {
      let value = values?.recurring_radio || "";
      if (value === "") {
        addToastError("This error should not happen");
        return;
      }
      radioObj = recurring.find((v) => v.value === value);
    } else {
      let value = values?.recurring_radio || "";

      radioObj = oneOff.find((v) => v.value === value);

      if (!radioObj) {
        let cents = Number.parseInt(value);
        if (!cents) {
          setError("oneoff_custom");
          return;
        }
        radioObj = {
          value: value,
          cents,
          text: "",
          priceID: priceIDs.oneOff_any,
        };
      }
    }

    if (!radioObj) {
      addToastError(t("anErrorOccurredDuringCheckout"));
      return;
    }
    (async () => {
      try {
        const res = await paymentInitiate({
          price_cents: radioObj.cents,
          email: values.email,
          is_recurring: isRecurring,
          price_id: radioObj.priceID,
        });

        console.log(res.data);
        if (!res.data?.session_id) throw "Couldn't find session ID";
        if (!stripe) throw "Stripe object does not exist";
        const err = (
          await stripe.redirectToCheckout({
            sessionId: res.data.session_id,
          })
        ).error;
        if (err) throw err;
      } catch (e: any) {
        setError(e?.data || e?.message || "submit");
        addToastError(
          e?.data
            ? GinParseErrors(t, e.data)
            : e?.message || t("anErrorOccurredDuringCheckout")
        );
        setLoading(false);
        setTimeout(() => {
          setError("");
        }, 3000);
      }
    })();
  }

  function oneOffRadio(item: RadioItem) {
    return (
      <label key={"oneoff" + item.text} className="flex">
        <input
          type="radio"
          name="oneoff_radio"
          value={item.value}
          defaultChecked={item.value === oneOff[1].value}
          className="radio radio-secondary mr-3"
        />
        {item.text}
      </label>
    );
  }

  function recurringRadio(item: RadioItem) {
    return (
      <label key={"recurring" + item.text} className="flex items-center h-12">
        <input
          type="radio"
          name="recurring_radio"
          className="radio radio-secondary mr-3"
          defaultChecked={item.value === recurring[1].value}
          value={item.value}
        />
        {item.text}
      </label>
    );
  }

  function deselectOneOffRadio(e: ChangeEvent<HTMLInputElement>) {
    let el = e.target.form?.elements?.namedItem("oneoff_radio");
    (el as RadioNodeList).value = "";
  }

  return (
    <div>
      <form onSubmit={onSubmit} id="donation-form">
        <p className="mb-3">{t("howDoYouWantToContributeToTheClothingLoop")}</p>
        <div className="mb-6">
          <button
            className={`mr-3 btn btn-secondary ${
              !isRecurring ? "" : "btn-outline"
            }`}
            type="button"
            onClick={() => setIsRecurring(false)}
          >
            {t("oneTimeDonation")}
          </button>

          <button
            className={`btn btn-secondary ${isRecurring ? "" : "btn-outline"}`}
            type="button"
            onClick={() => setIsRecurring(true)}
          >
            {t("becomeAMember")}
          </button>
        </div>
        <p className="mb-3">
          {isRecurring
            ? t("iWillSupportTheClothingLoopWithAMonthlyDonation")
            : t("iWillSupportTheClothingLoopWithAOneTimeDonation")}
        </p>

        <div
          className={`mb-6 grid grid-cols-3 grid-rows-2 gap-3 items-center ${
            isRecurring ? "hidden" : ""
          }`}
        >
          {oneOff.map((item) => oneOffRadio(item))}

          <div className="flex items-center">
            <input
              name="oneoff_radio"
              type="radio"
              value=""
              aria-label="type a custom amount in the next text input"
              className="invisible -z-10 mr-3 absolute"
            />

            <input
              name="oneoff_custom"
              className={`input invalid:input-error w-full ${
                error === "oneoff_custom" ? "input-error" : "input-secondary"
              }`}
              type="number"
              aria-invalid={error === "oneoff_custom"}
              onChange={deselectOneOffRadio}
              placeholder={t("otherAmount")}
            />
          </div>
        </div>
        <div
          className={`mb-6 grid grid-cols-3 gap-3 ${
            isRecurring ? "" : "hidden"
          }`}
        >
          {recurring.map((i) => recurringRadio(i))}
        </div>
        <div>
          <input
            name="email"
            className={`input invalid:input-error ${
              error === "email" ? "input-error" : "input-secondary"
            }`}
            type="email"
            placeholder={t("email")}
            aria-invalid={error === "email"}
          />
        </div>

        <br />

        {isRecurring && (
          <p className="base-300 text-sm mb-2">
            {t("dontHaveACreditCardChooseSepa")}
          </p>
        )}

        <div>
          {loading ? (
            <span className="feather feather-loader animate-spin" />
          ) : (
            <button
              type="submit"
              className={`btn bw-btn-primary ${
                !error ? "" : "ring-2 ring-offset-2 ring-error"
              }`}
            >
              {t("donate")}
            </button>
          )}
        </div>

        <p className="text-xs mt-2">
          {t("byDonatingYouAgreeWithOur")}
          <a href="/privacy-policy" target="_blank" className="link">
            {t("privacyPolicy")}
          </a>
          .
        </p>
      </form>
    </div>
  );
}

export default function DonationForm() {
  const { t } = useTranslation();

  const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || "";
  if (stripePublicKey) {
    const stripePromise = loadStripe(stripePublicKey);

    return (
      <div className="max-w-screen-sm mx-auto">
        <h1 className="text-4xl text-secondary font-serif font-bold mb-6">
          {t("donateToTheClothingLoop")}
        </h1>
        <p
          className="leading-relaxed mb-6"
          dangerouslySetInnerHTML={{
            __html: t("thanksForConsideringADonation"),
          }}
        ></p>

        <Elements stripe={stripePromise}>
          <DonationFormContent />
        </Elements>
      </div>
    );
  }
  return <div>{t("accessTokenNotConfigured")}</div>;
}