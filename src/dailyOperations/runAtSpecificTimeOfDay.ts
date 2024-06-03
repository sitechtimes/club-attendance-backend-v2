/**
 * Schedules the execution of a given function at a specific time of day.
 * @param hour - The hour of the day (in 24-hour format) at which the function should be executed.
 * @param minutes - The minutes of the hour at which the function should be executed.
 * @param func - The function to be executed.
 */
export function runAtSpecificTimeOfDay(
  hour: number,
  minutes: number,
  func: Function[]
) {
  const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();
  const targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minutes,
    0,
    0
  );
  let delay = targetTime.getTime() - now.getTime();

  if (delay < 0) {
    delay += twentyFourHours; // Schedule for the next day if target time has already passed
  }

  setTimeout(() => {
    // Runs each function in the func array once
    func.forEach((target) => {
      target();
    });
    //func(); // Run the function once
    setInterval(() => {
      func.forEach(async (target) => {
        await target();
      });
    }, twentyFourHours); // Schedule the function to run every 24 hours
  }, delay);
}
