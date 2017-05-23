var { isNaN } = require("lodash");

const pattern = /(!)?([0-9]*)/;

module.exports = (image, rotation) => {
  const rotationParts = rotation.match(pattern);
  if (rotationParts === null) {
    throw new Error("Invalid rotation code");
  }

  const rotationDegrees = parseInt(rotationParts[2]);
  if (isNaN(rotationDegrees)) {
    throw new Error("Invalid rotation code");
  }

  if (rotationDegrees < 0 || rotationDegrees > 360) {
    throw new Error("Rotation must be between 0 and 360 degrees");
  }

  if (rotationParts[1] !== undefined) {
    image.flip(false, true);
  }

  image.rotate(rotationDegrees);
};
