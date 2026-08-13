// Mock async data access.
//
// Everything lives in memory (the spec forbids persistence), but these calls are
// genuinely asynchronous and honour an AbortSignal — so react-query's
// cancel-in-flight-requests-on-navigation behaviour is real, not decorative.
// When a real server arrives, only the bodies of these functions change.

const delay = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
  const id = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => {
    clearTimeout(id);
    reject(new DOMException('Aborted', 'AbortError'));
  }, { once: true });
});

const WEATHER_KINDS = ['sunny', 'partly', 'clear', 'hot'];

export async function fetchWeather({ signal }) {
  await delay(350 + Math.random() * 450, signal);
  return {
    temp: 24 + Math.floor(Math.random() * 9),
    kind: WEATHER_KINDS[Math.floor(Math.random() * WEATHER_KINDS.length)],
    humidity: 40 + Math.floor(Math.random() * 35),
  };
}

// Stands in for the Google Calendar feed pull. `events` is handed in from the
// store so the mock stays the single source of truth for the demo data.
export async function fetchCalendarFeed(events, { signal }) {
  await delay(250 + Math.random() * 350, signal);
  return events;
}

export const queryKeys = {
  weather: ['weather'],
  calendarFeed: (month) => ['calendar-feed', month],
};
