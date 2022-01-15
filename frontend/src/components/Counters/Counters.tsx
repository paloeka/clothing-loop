import * as React from "react";
import { useEffect, useState, useRef } from "react";

//project resources
import { getChainsLength } from "../../util/firebase/chain";
import SingleCounter from "./SingleCounter";
import useIntersectionObserver from "./hooks";

//mui
import { makeStyles } from "@material-ui/core";
import theme from "../../util/theme";
import { number } from "yup/lib/locale";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const Counters = () => {
  const classes = makeStyles(theme as any)();
  const containerRef = useRef(null);

  const [chains, setChains] = useState(0);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const chainsLengthResponse = await getChainsLength();
      setChains(chainsLengthResponse);
    })();
  }, []);

  //check if div is visible on viewport
  const callBack = (entries: any) => {
    const [entry] = entries;
    setIsVisible(entry.isIntersecting);
  };

  const options = {
    root: null,
    rootMargin: "50px",
    threshold: 0.5,
  };

  useIntersectionObserver(callBack, containerRef, options);

  return (
    <div ref={containerRef} className={classes.countersWrapper}>
      <div className="isVisible">
        <h1>{isVisible ? <SingleCounter end={350} step={2} /> : "0"}</h1>
        <h3>{"Different loops"}</h3>
      </div>
      <div className="isVisible">
        <h1>{isVisible ? <SingleCounter end={13000} step={15} /> : "0"}</h1>
        <h3>{"People"}</h3>
      </div>
      <a className="isVisible" href="/loops/find">
        <h1>{"5"}</h1>
        <h3>{"Countries"}</h3>
      </a>
      <div className={classes.counterLinkWrapper}>
        <div className={classes.counterLinkIconWrapper}>
          <a href="/loops/find" className={classes.counterLink}>
            <ArrowDownwardIcon className="icon" />
          </a>
        </div>
        <h3>Our goals</h3>
      </div>
    </div>
  );
};

export default Counters;