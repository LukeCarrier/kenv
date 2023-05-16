// Name: Pomodoro
// Description: A Pomodoro timer, right here!

import "@johnlindquist/kit";

const HOUR_MIN = 60;
const MIN_SEC = 60;
const SEC_MS = 1000;

const WORK_INTERVAL_SECS = 25 * 60;
const REST_INTERVAL_SECS = 5 * 60;

const WORK_INTERVAL_ICON = "🍅";
const REST_INTERVAL_ICON = "🏝️";
const COMPLETE_ICON = "🎉";

const WIDGET_HTML = `
  <div class="flex text-6xl items-center justify-center rounded-full">
    {{icon}}
  </div>
  <div class="flex-1">
    <h4 class="pr-6 font-medium text-secondary-900">{{goal}}</h4>
    <div class="mt-1 text-secondary-500">{{timer}}</div>
  </div>
`;
const DING_JS = `new Audio("../kenvs/personal/assets/ding.ogg").play();`;
const DING_SECS = 5;

function formatTimeRemaining(seconds: number): string {
  const totalMinutes = Math.floor(seconds / HOUR_MIN);
  const formatSeconds = String(seconds % MIN_SEC).padStart(2, "0");
  const formatMinutes = String(totalMinutes % MIN_SEC).padStart(2, "0");
  return `${formatMinutes}:${formatSeconds}`;
}

const goal = await arg("What's your goal this interval?")

const timerWidget = await widget(WIDGET_HTML, {
  title: "Pomodoro",
  state: { icon: "", goal: "", timer: "" },

  containerClass: "p-6 max-w-sm mx-auto rounded-xl shadow-lg flex items-center space-x-4",
  alwaysOnTop: true,
  preventEscape: true,
  minimizable: false,
  maximizable: false,
  fullscreenable: false,
  opacity: 0.45,

  // If these are below the minimum size of a widget on macOS (160x120) the
  // widget appears as a small white box without any content until manually
  // resized.
  width: 340,
  height: 120,
});

function doInterval(icon: string, goal: string, interval_secs: number): Promise<void> {
  timerWidget.setState({ icon, goal, timer: formatTimeRemaining(interval_secs) });

  return new Promise<void>((resolve) => {
    const startTime = new Date().getTime();
    const timerInterval = setInterval(() => {
      const thisTime = new Date().getTime();
      const elapsedSeconds = Math.round((thisTime - startTime) / SEC_MS);
      const remainingSeconds = interval_secs - elapsedSeconds;
      if (remainingSeconds >= 0) {
        timerWidget.setState({ icon, goal, timer: formatTimeRemaining(remainingSeconds) });
      } else {
        clearInterval(timerInterval);
        timerWidget.executeJavaScript(DING_JS).finally(() => {
          resolve();
        });
      }
    }, 1000);
  });
}

await doInterval(WORK_INTERVAL_ICON, goal, WORK_INTERVAL_SECS);
await doInterval(REST_INTERVAL_ICON, `Break after ${goal}`, REST_INTERVAL_SECS);
timerWidget.setState({ icon: COMPLETE_ICON, goal: `${goal} all done!`, timer: "That's another interval complete." });
setTimeout(() => timerWidget.close(), DING_SECS * 1000);
