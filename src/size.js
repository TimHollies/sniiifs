var { isNaN } = require("lodash");

const widthHeightPattern = /([0-9]*)?,([0-9]*)?/;
const percentPattern = /pct:([0-9]+)/;

module.exports = (image, size) => {
  if (size === "full" || size === "max") {
    return;
  }

  const widthHeight = size.match(widthHeightPattern);
  if (widthHeight !== null) {
    image.resize(
      widthHeight[1] !== undefined ? parseInt(widthHeight[1]) : null,
      widthHeight[2] !== undefined ? parseInt(widthHeight[2]) : null
    );
    return;
  }

  // const percentScale = size.match(percentPattern);
  // if (percentScale !== null) {
  //   const scaleAmount = parseInt(percentScale[1]);
  //   if (isNaN(scaleAmount)) {
  //     throw new Error("Size percentange must be an integer");
  //   }
  //   const metaData = image.metadata();
  //   image.resize(metaData.width * (percentScale / 100));
  //   return;
  // }

  throw new Error("Could not parse size");
};
