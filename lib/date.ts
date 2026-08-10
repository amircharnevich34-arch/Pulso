// Every daily log (dieta, agua, rutina) anchors to this timezone instead of
// the device clock, so the "day" doesn't shift depending on where someone opens the app.
const TIMEZONE = "America/Mexico_City";

export function todayInMexicoCity(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}
