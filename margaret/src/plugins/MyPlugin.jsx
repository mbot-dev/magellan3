import React, { useEffect } from "react";
import PluginInterface from "./PluginInterface";

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const MyUI = ({ start, onStop }) => {
  useEffect(() => {
    if (!start) {
      return;
    }
    sleep(3000).then(() => {
      onStop();
    });
  }, [start]);

  return start ? (
    <div style={{ padding: "32px" }}>Plugin is running</div>
  ) : (
    <div>Plugin is not running</div>
  );
};

// class MyPlugin extends PluginInterface {
//   constructor() {
//     super();
//   }

//   get name() {
//     return "MyPlugin";
//   }

//   get plugPoint() {
//     return this.plugPoint;
//   }

//   init() {
//     console.log("App Message Plugin initialized");
//   }

//   render(props) {
//     return <MyUI {...props} />;
//   }
// }

export default MyUI;
