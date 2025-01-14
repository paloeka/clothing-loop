import { FormEvent, useContext, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useHistory } from "react-router-dom";
import { Helmet } from "react-helmet";

import { TwoColumnLayout } from "../components/Layouts";
import { loginEmail } from "../api/login";
import { ToastContext } from "../providers/ToastProvider";
import FormJup from "../util/form-jup";
import { AuthContext } from "../providers/AuthProvider";
import { GinParseErrors } from "../util/gin-errors";

//media
const CirclesFrame =
  "https://ucarecdn.com/200fe89c-4dc0-4a72-a9b2-c5d4437c91fa/-/format/auto/circles.png";
const LoginImg =
  "https://ucarecdn.com/cac06018-e1b6-4124-865f-26b816df54c7/-/resize/x600/-/format/auto/-/quality/smart/login.jpg";

export default function Login() {
  const { authUser } = useContext(AuthContext);
  const history = useHistory();
  const { addToast, addToastError } = useContext(ToastContext);
  const { t } = useTranslation();

  const [error, setError] = useState("");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const values = FormJup<{ email: string }>(e);

    const email = values.email;

    if (email === "") {
      setError("email");
      return;
    }

    (async () => {
      try {
        await loginEmail(email);
        addToast({
          type: "info",
          message: t("loginEmailSent"),
        });
      } catch (err: any) {
        console.error(err);
        setError("email");
        addToastError(GinParseErrors(t, err));
      }
    })();
  }
  if (authUser) {
    addToast({
      type: "success",
      message: t("userIsLoggedIn"),
    });

    history.replace("/admin/dashboard");
  }

  return (
    <>
      <Helmet>
        <title>The Clothing Loop | Login</title>
        <meta name="description" content="Login" />
      </Helmet>

      <main className="pt-10">
        <TwoColumnLayout img={LoginImg}>
          <div className="relative sm:p-10 -mx-4 sm:mx-0">
            <div className="p-10 bg-teal-light">
              <img
                className="absolute bottom-[-12px] left-[-12px] -z-10"
                src={CirclesFrame}
                alt=""
              />
              <h1 className="font-serif font-bold text-5xl text-secondary mb-8">
                {t("login")}
              </h1>
              <p className="leading-7 mb-6">
                <Trans
                  i18nKey="areYouAlreadyHosting<a>JoinAnExistingLoop"
                  components={{
                    a: <Link className="link" to="../../loops/find"></Link>,
                  }}
                ></Trans>
              </p>

              <form onSubmit={onSubmit} className="flex flex-col">
                <input
                  className={`input w-full invalid:input-warning ${
                    error ? "input-error" : "input-secondary"
                  }`}
                  placeholder={t("email")}
                  type="email"
                  name="email"
                  required
                />
                <button type="submit" className="btn btn-primary w-full mt-6">
                  {t("submit")}
                  <span className="feather feather-arrow-right ml-4"></span>
                </button>
              </form>
            </div>
          </div>
        </TwoColumnLayout>
      </main>
    </>
  );
}
