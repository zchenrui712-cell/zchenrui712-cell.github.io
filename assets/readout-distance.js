const stimulus = [0, 1, 0];
const readoutPicker = document.querySelector('#demo-readout');
const distanceOutput = document.querySelector('#demo-distance');

function updateDistance() {
  const readout = JSON.parse(readoutPicker.value);
  const differences = stimulus.map((sample, index) => sample - readout[index]);
  const distance = Math.hypot(...differences);
  distanceOutput.value = `L2 distance = ${distance.toFixed(3)}`;
}

readoutPicker.addEventListener('change', updateDistance);
updateDistance();
