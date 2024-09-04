import { useState, useRef } from "react";
import "./App.css";

const PADDING_X = 30; // Padding on the left and right edges
const PADDING_Y = 30; // Padding on the top and bottom edges

function shiftDictFunc(shiftDict = { 1: 400, 2: 500, 3: 600 }) {
  const totalWeight = Object.values(shiftDict).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const randomNum = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedKey;

  for (const [key, weight] of Object.entries(shiftDict)) {
    cumulativeWeight += weight;
    if (randomNum < cumulativeWeight) {
      selectedKey = parseInt(key);
      break;
    }
  }

  return selectedKey;
}

function App() {
  const [cursorPosition, setCursorPosition] = useState({
    xDirection: "400px",
    yDirection: "700px",
  });
  const [buttonSize, setButtonSize] = useState(64);
  const [userName, setUserName] = useState("");
  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [startTime, setStartTime] = useState(null); // Start time state
  const previousClickTime = useRef(null); // Use ref for previous click time
  const misclicksRef = useRef(0); // Use ref to track misclicks
  const currentRenderData = {
    Distance: null,
    size: buttonSize,
    direction: null,
    time: null,
    distanceTravelled: null,
    misclicks: 0,
  };
  const timeArrRef = useRef([]);

  const extraClickHandler = (e) => {
    if (trialCount < 200) {
      misclicksRef.current += 1; // Increment misclick count
    }
  };

  const clickHandler = (e) => {
    if (trialCount >= 200) return;

    const shiftDict = { 1: 400, 2: 500, 3: 600 };
    const buttonSizes = { 1: 64, 2: 128, 3: 200 };

    const buttonPosition = e.target.getBoundingClientRect();
    let buttonX = buttonPosition.left;
    let buttonY = buttonPosition.top;

    const cursorX = e.clientX;
    const cursorY = e.clientY;

    let selectedKey = shiftDictFunc(shiftDict);
    let sizeKey = shiftDictFunc(buttonSizes);

    let x;
    let direction;
    if (buttonX < 720 && buttonY < 430) {
      x = Math.random() * (90 - 0) + 0;
      direction = 1;
    } else if (buttonX > 720 && buttonY > 430) {
      x = Math.random() * (270 - 180) + 180;
      direction = -1;
    } else if (buttonX < 720 && buttonY > 430) {
      x = Math.random() * (360 - 270) + 270;
      direction = 1;
    } else {
      x = Math.random() * (180 - 90) + 90;
      direction = -1;
    }

    let radianAngle = (x * Math.PI) / 180;
    let newX = buttonX + Math.cos(radianAngle) * shiftDict[selectedKey];
    let newY = buttonY + Math.sin(radianAngle) * shiftDict[selectedKey];

    // Ensure the button stays within bounds considering padding
    if (newX < PADDING_X) newX = PADDING_X;
    if (newY < PADDING_Y) newY = PADDING_Y;
    if (newX + buttonSizes[sizeKey] > window.innerWidth - PADDING_X) {
      newX = window.innerWidth - PADDING_X - buttonSizes[sizeKey];
    }
    if (newY + buttonSizes[sizeKey] > window.innerHeight - PADDING_Y) {
      newY = window.innerHeight - PADDING_Y - buttonSizes[sizeKey];
    }

    const newXString = `${Math.floor(newX)}px`;
    const newYString = `${Math.floor(newY)}px`;

    const distanceCB = Math.sqrt(
      Math.pow(newX - cursorX, 2) + Math.pow(newY - cursorY, 2)
    );

    // Calculate the time difference in milliseconds
    const currentTime = Date.now();
    let elapsedTimeMs = 0;

    if (previousClickTime.current) {
      elapsedTimeMs = currentTime - previousClickTime.current;
    }

    previousClickTime.current = currentTime;

    const seconds = Math.floor(elapsedTimeMs / 1000);
    const milliseconds = elapsedTimeMs % 1000;

    currentRenderData.Distance = shiftDict[selectedKey];
    currentRenderData.size = buttonSizes[sizeKey];
    currentRenderData.direction = direction;
    currentRenderData.time = `${seconds}.${milliseconds}`;
    currentRenderData.distanceTravelled = distanceCB;
    currentRenderData.misclicks = misclicksRef.current;
    timeArrRef.current.push(currentRenderData);

    setButtonSize(buttonSizes[sizeKey]);
    setCursorPosition({ xDirection: newXString, yDirection: newYString });
    setTrialCount((prevCount) => {
      if (prevCount + 1 >= 200) {
        setShowModal(true);
      }
      return prevCount + 1;
    });

    // Reset misclicks count for the next trial
    misclicksRef.current = 0;
  };

  const handleUserNameChange = (e) => {
    setUserName(e.target.value);
  };

  const handleStartExperiment = () => {
    if (userName.trim() === "") {
      alert("Please enter your name to start the experiment.");
      return;
    }
    setStartTime(Date.now()); // Set the start time
    previousClickTime.current = Date.now(); // Initialize previous click time
    misclicksRef.current = 0; // Initialize misclick count
    setIsExperimentStarted(true);
  };

  const downloadCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Distance,Size,Direction,Time,DistanceTravelled,Misclicks\n" +
      timeArrRef.current
        .map(
          (entry) =>
            `${entry.Distance},${entry.size},${entry.direction},${entry.time},${entry.distanceTravelled},${entry.misclicks}`
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${userName}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="App">
      <h1>Fitts' Law Experiment</h1>
      {!isExperimentStarted ? (
        <div className="input-container">
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={handleUserNameChange}
          />
          <button onClick={handleStartExperiment}>Start Experiment</button>
        </div>
      ) : (
        <div className="mainDiv" onClick={extraClickHandler}>
          <button
            id="movingButton"
            style={{
              top: cursorPosition.yDirection,
              left: cursorPosition.xDirection,
              width: `${buttonSize}px`,
              height: `${buttonSize}px`,
              backgroundColor: "#ff6347", // Tomato color
            }}
            onClick={clickHandler}
            disabled={trialCount >= 200}
          >
            Click Me
          </button>
          {trialCount < 200 && (
            <p className="progress">{`Progress: ${trialCount}/200`}</p>
          )}
        </div>
      )}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Experiment Complete!</h2>
            <p>You've completed all 200 trials.</p>
            <button className="modal-button" onClick={downloadCSV}>
              Download Results as CSV
            </button>
            <button
              className="modal-button"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
